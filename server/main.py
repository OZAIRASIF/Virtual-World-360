from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
import os
from models import HotspotDeleteRequest, HotspotUpdateRequest, SceneUpdateReorder, Tour, Scene, Hotspot, SceneUpdate
from db import tours_collection, scenes_collection
from uuid import uuid4
import requests
from sklearn.cluster import DBSCAN
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
import numpy as np
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from restnet import find_hotspot_between_image_arrays
# Initialize FastAPI app
app = FastAPI()

origins = [
    "http://localhost:5173",  # Allow frontend application running on this origin
    "https://yourdomain.com",  # Allow your production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

cloud_nam = "dumnnsxzh"
key = "915679899899667"
secret = "rnu-3mhkaYVaM1XcdOohXodlpHE"
# Cloudinary configuration
# cloudinary.config(
#     cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
#     api_key=os.getenv('CLOUDINARY_API_KEY'),
#     api_secret=os.getenv('CLOUDINARY_API_SECRET')
# )
cloudinary.config(
    cloud_name=cloud_nam,
    api_key=key,
    api_secret=secret
)

# Get all tours
@app.get("/api/tours", response_model=List[Tour])
def get_tours():
    tours = []
    for tour in tours_collection.find():
        tour['id'] = str(tour['id'])  # Convert UUID to str
        tours.append(tour)
    return tours

# Create a new tour
@app.post("/api/tours", response_model=Tour)
def create_tour(tour: Tour):
    new_tour = {
        "id": str(uuid4()),  # Generate a new UUID
        "name": tour.name,
        "sceneIds": tour.sceneIds,
    }
    result = tours_collection.insert_one(new_tour)
    created_tour = tours_collection.find_one({"id": new_tour['id']})
    return created_tour

# Update a tour
@app.put("/api/tours/{tour_id}", response_model=Tour)
def update_tour(tour_id: str, tour: Tour):
    update_result = tours_collection.update_one(
        {"id": tour_id},
        {"$set": {"name": tour.name}}
    )
    if update_result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    updated_tour = tours_collection.find_one({"id": tour_id})
    return updated_tour


@app.post("/api/tours/{tour_id}/scenes", response_model=Scene)
def create_scene_and_add_to_tour(tour_id: str, file: UploadFile = File(...)):
    try:
        # Upload image to Cloudinary
        upload_result = cloudinary.uploader.upload(file.file)
        image_url = upload_result.get("secure_url")
        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to upload image to Cloudinary")
        image_name = file.filename.rsplit(".", 1)[0]

        # Create the new scene
        new_scene = {
            "id": str(uuid4()),
            "name": image_name,
            "image": image_url,
            "hotspots": []
        }
        scenes_collection.insert_one(new_scene)

        # Find the tour
        tour = tours_collection.find_one({"id": tour_id})
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        if "sceneIds" not in tour:
            tour["sceneIds"] = []

        # Add new scene ID to tour
        tours_collection.update_one(
            {"id": tour_id},
            {"$push": {"sceneIds": new_scene['id']}}
        )

        # If this is not the first scene, create hotspot between main and new scene
        if len(tour["sceneIds"]) >= 1:
            main_scene_id = tour["sceneIds"][0]
            main_scene = scenes_collection.find_one({"id": main_scene_id})

            if main_scene:
                try:
                    # Download main scene image
                    resp = requests.get(main_scene['image'], timeout=10)
                    resp.raise_for_status()
                    main_img_array = np.frombuffer(resp.content, np.uint8)
                    main_img = cv2.imdecode(main_img_array, cv2.IMREAD_COLOR)
                    if main_img is None:
                        raise ValueError("Failed to decode main scene image")

                    # Read current uploaded file
                    file.file.seek(0)
                    file_bytes = np.frombuffer(file.file.read(), np.uint8)
                    new_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
                    if new_img is None:
                        raise ValueError("Failed to decode uploaded image")

                    # Find hotspot pitch/yaw
                    pitch, yaw = find_hotspot_between_image_arrays(main_img, new_img)

                    # --- Append hotspot in main scene for the new image ---
                    main_to_new_hotspot = {
                        "pitch": pitch,
                        "yaw": yaw,
                        "type": "custom",
                        "sceneId": new_scene['id'],
                        "text": f"Go to {new_scene['name']}"
                    }
                    scenes_collection.update_one(
                        {"id": main_scene_id},
                        {"$push": {"hotspots": main_to_new_hotspot}}
                    )

                    # --- Append hotspot in new scene pointing to main scene ---
                    new_to_main_hotspot = {
                        "pitch": pitch,
                        "yaw": (yaw + 180) % 360 - 180,
                        "type": "custom",
                        "sceneId": main_scene_id,
                        "text": f"Go to {main_scene['name']}"
                    }
                    scenes_collection.update_one(
                        {"id": new_scene['id']},
                        {"$push": {"hotspots": new_to_main_hotspot}}
                    )

                    print(f"Hotspot created between main scene and {new_scene['name']}")

                except Exception as e:
                    # Fallback to manual center
                    print("No match found, using default hotspot")
                    print(e)
                    main_to_new_hotspot = {"pitch": 0, "yaw": 0, "type": "custom",
                                           "sceneId": new_scene['id'], "text": f"Go to {new_scene['name']}"}
                    new_to_main_hotspot = {"pitch": 0, "yaw": 180, "type": "custom",
                                           "sceneId": main_scene_id, "text": f"Go to {main_scene['name']}"}

                    scenes_collection.update_one(
                        {"id": main_scene_id}, {"$push": {"hotspots": main_to_new_hotspot}}
                    )
                    scenes_collection.update_one(
                        {"id": new_scene['id']}, {"$push": {"hotspots": new_to_main_hotspot}}
                    )

        return Scene(**new_scene)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



    
@app.delete("/api/tours/{tour_id}/scenes/{scene_id}", response_model=dict)
def delete_scene_from_tour(tour_id: str, scene_id: str):
    try:
        # Find the tour
        tour = tours_collection.find_one({"id": tour_id})
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")

        # Check if the scene exists in the database
        scene = scenes_collection.find_one({"id": scene_id})
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")

        # Remove the scene ID from the tour's sceneIds
        tours_collection.update_one(
            {"id": tour_id},
            {"$pull": {"sceneIds": scene_id}}
        )
        
        # Remove hotspots in other scenes targeting this scene
        scenes_collection.update_many(
            {"hotspots.sceneId": scene_id},
            {"$pull": {"hotspots": {"sceneId": scene_id}}}
        )


        # Delete the scene from the scenes collection
        scenes_collection.delete_one({"id": scene_id})

        # Optionally, delete the image from Cloudinary
        if "image" in scene:
            public_id = scene["image"].split("/")[-1].split(".")[0]  # Extract public_id from the image URL
            cloudinary.uploader.destroy(public_id)

        return {"message": "Scene deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# Get all scenes for a tour
@app.get("/api/tours/{tour_id}/scenes", response_model=List[Scene])
def get_scenes_for_tour(tour_id: str):
    
    try:
        tour = tours_collection.find_one({"id": tour_id})
        # Find the tour by ID
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")

        # Fetch all scenes associated with the tour
        scenes = []
        for scene_id in tour.get("sceneIds", []):
            scene = scenes_collection.find_one({"id": scene_id})
            if scene:
                scenes.append(scene)
        print(scenes)
        return scenes

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.put("/api/tours/{tour_id}/scenes/{scene_id}")
async def update_scene_name(tour_id: str, scene_id: str, data: SceneUpdate):
    scene_name = data.name 
    print(scene_name,scene_id)
    # Accessing the name directly from the Pydantic model
    if not scene_name:
        raise HTTPException(status_code=400, detail="Scene name is required")
    
    # Logic to update the scene in the database
    result = scenes_collection.update_one({"id": scene_id}, {"$set": {"name": scene_name}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Scene not found")

    return {"message": "Scene name updated successfully"}


# Add a hotspot to a scene
@app.post("/api/scenes/{scene_id}/hotspots")
def add_hotspot(scene_id: str, hotspot: Hotspot):
    try:
        # Find the scene by ID
        scene = scenes_collection.find_one({"id": scene_id})
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")

        # Convert the hotspot id to sceneId as string
        hotspot_data = hotspot.dict()
        hotspot_data['sceneId'] = str(hotspot_data['sceneId'])  # Convert scene_id to string and store in 'sceneId'

        # Add the modified hotspot to the scene's hotspots array
        scenes_collection.update_one(
            {"id": scene_id},
            {"$push": {"hotspots": hotspot_data}}
        )

        return {"message": "Hotspot added successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    

@app.put("/api/scenes/{scene_id}/hotspots")
async def update_hotspot(scene_id: str, updated_hotspot: HotspotUpdateRequest):
    # Verify the scene exists
    print(scene_id)
    scene = scenes_collection.find_one({"id": scene_id})
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # Find the hotspot in the scene's hotspots
    for hotspot in scene.get("hotspots", []):
        if hotspot["pitch"] == updated_hotspot.pitch and hotspot["yaw"] == updated_hotspot.yaw:
            # Update the hotspot properties
            hotspot.update(updated_hotspot.dict(exclude_unset=True))
            break
    else:
        raise HTTPException(status_code=404, detail="Hotspot not found")

    # Update the scene in the database
    scenes_collection.update_one(
        {"id": scene_id},
        {"$set": {"hotspots": scene["hotspots"]}}
    )
    return {"message": "Hotspot updated successfully"}


@app.delete("/api/scenes/{scene_id}/hotspots")
async def delete_hotspot(scene_id: str, hotspot_to_delete: HotspotDeleteRequest):
    # Verify the scene exists
    scene = scenes_collection.find_one({"id":scene_id})
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # Filter out the hotspot to delete
    new_hotspots = [
        hs for hs in scene.get("hotspots", [])
        if not (hs["pitch"] == hotspot_to_delete.pitch and hs["yaw"] == hotspot_to_delete.yaw)
    ]

    # Check if any hotspots were removed
    if len(new_hotspots) == len(scene.get("hotspots", [])):
        raise HTTPException(status_code=404, detail="Hotspot not found")

    # Update the scene in the database
    scenes_collection.update_one(
        {"id": scene_id},
        {"$set": {"hotspots": new_hotspots}}
    )
    return {"message": "Hotspot deleted successfully"}



# import uuid
# import cv2
# import numpy as np
# import cloudinary.uploader
# from fastapi import UploadFile, File, HTTPException

# def find_hotspot_between_images(img1_path, img2_path):
#     """ORB feature match, return yaw/pitch of hotspot."""
#     img1 = cv2.imread(img1_path, 0)
#     img2 = cv2.imread(img2_path, 0)

#     if img1 is None or img2 is None:
#         return None

#     orb = cv2.ORB_create()
#     kp1, des1 = orb.detectAndCompute(img1, None)
#     kp2, des2 = orb.detectAndCompute(img2, None)

#     if des1 is None or des2 is None:
#         return None

#     bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
#     matches = bf.match(des1, des2)
#     if not matches:
#         return None

#     matches = sorted(matches, key=lambda x: x.distance)
#     best_match = matches[0]

#     pt1 = kp1[best_match.queryIdx].pt
#     yaw = (pt1[0] / img1.shape[1]) * 360 - 180
#     pitch = (pt1[1] / img1.shape[0]) * 180 - 90

#     return {"yaw": yaw, "pitch": pitch}


# from uuid import uuid4

# @app.post("/api/tours/{tour_id}/scenes", response_model=Scene)
# def create_scene_and_add_to_tour(tour_id: str, file: UploadFile = File(...)):
#     try:
#         # ✅ Upload the image to Cloudinary
#         upload_result = cloudinary.uploader.upload(file.file)
#         image_url = upload_result.get("secure_url")

#         # ✅ Create a new scene
#         new_scene = {
#             "id": str(uuid4()),
#             "name": "New Scene",
#             "image": image_url,
#             "hotspots": []
#         }

#         # ✅ Insert scene into DB
#         scenes_collection.insert_one(new_scene)

#         # ✅ Find tour
#         tour = tours_collection.find_one({"id": tour_id})
#         if not tour:
#             raise HTTPException(status_code=404, detail="Tour not found")

#         # ✅ Attach new scene to tour
#         tours_collection.update_one(
#             {"id": tour_id},
#             {"$push": {"sceneIds": new_scene['id']}}
#         )

#         # ✅ Fetch updated scene list
#         tour = tours_collection.find_one({"id": tour_id})
#         scene_ids = tour.get("sceneIds", [])

#         # If there are at least 2 scenes, add a hotspot at the center of previous scene
#         # Add hotspot to previous scene pointing to new scene
#         if len(scene_ids) > 1:
#             prev_id = scene_ids[-2]
#             prev_scene = scenes_collection.find_one({"id": prev_id})
#             center_hotspot = {
#                 "id": str(uuid4()),
#                 "pitch": 0.0,  # center
#                 "yaw": 0.0,    # center
#                 "type": "scene",
#                 "text": f"Go to {new_scene['name']}",
#                 "targetScene": new_scene['id']
#             }
#             scenes_collection.update_one(
#                 {"id": prev_id},
#                 {"$push": {"hotspots": center_hotspot}}
#             )

#         # Add hotspot to new scene pointing back to previous scene
#         if len(scene_ids) > 1:
#             reverse_hotspot = {
#                 "id": str(uuid4()),
#                 "pitch": 0.0,  # center
#                 "yaw": 0.0,    # center
#                 "type": "scene",
#                 "text": f"Go to {prev_scene['name']}",
#                 "targetScene": prev_id
#             }
#             scenes_collection.update_one(
#                 {"id": new_scene['id']},
#                 {"$push": {"hotspots": reverse_hotspot}}
#             )

#         return Scene(**new_scene)

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
