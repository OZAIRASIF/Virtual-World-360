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

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
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
        # Upload the image to Cloudinary
        upload_result = cloudinary.uploader.upload(file.file)
        image_url = upload_result.get("secure_url")

        # Create a new scene with the uploaded image URL
        new_scene = {
            "id": str(uuid4()),  # Generate a new UUID
            "name": "New Scene",  # Default scene name
            "image": image_url,
            "hotspots": []
        }

        # Insert the scene into the database
        scenes_collection.insert_one(new_scene)

        # Add the scene ID to the tour's sceneIds
        tour = tours_collection.find_one({"id": tour_id})
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")

        tours_collection.update_one(
            {"id": tour_id},
            {"$push": {"sceneIds": new_scene['id']}}
        )

        # Return the new scene, which should match the Scene model format
        return Scene(**new_scene)  # This will return the data as per the Pydantic Scene model

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


# @app.patch("/api/tours/{tour_id}/scenes/{scene_id}/reorder")
# async def update_scene_name(tour_id: str, scene_id: str, order: SceneUpdateReorder):
#     try:
#         tour = tours_collection.find_one({"id": tour_id})
#         # Find the tour by ID
#         if not tour:
#             raise HTTPException(status_code=404, detail="Tour not found")
#         sceneIds = tour.get("sceneIds")
#         sceneIds.remove(scene_id)
#         sceneIds.insert(order.index-1, scene_id)
#         result = tours_collection.update_one({"id": tour_id}, {"$set": {"sceneIds": sceneIds}})
#         if result.matched_count == 0:
#             raise HTTPException(status_code=404, detail="Scene not found")
#         return {"message": "Scene order updated successfully"}
                                                                        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail="Unable to reorder")

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