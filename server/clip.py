import cv2
import numpy as np
import torch
from transformers import CLIPProcessor, CLIPModel
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image

# Load CLIP
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.eval()

# Function to get CLIP embedding
def get_embedding(patch):
    patch_pil = Image.fromarray(cv2.cvtColor(patch, cv2.COLOR_BGR2RGB))
    inputs = processor(images=patch_pil, return_tensors="pt")
    with torch.no_grad():
        feat = model.get_image_features(**inputs)
    return feat.squeeze().cpu().numpy()

# Extract patches
def extract_patches(img, patch_h, patch_w):
    patches = []
    h, w, _ = img.shape
    for y in range(0, h, patch_h):
        for x in range(0, w, patch_w):
            patch = img[y:y+patch_h, x:x+patch_w]
            if patch.shape[0] == patch_h and patch.shape[1] == patch_w:
                patches.append(((x,y), patch))
    return patches

# Convert coordinates to pitch/yaw
def equirectangular_to_angles(x, y, w, h):
    yaw = (x / w) * 360 - 180
    pitch = 90 - (y / h) * 180
    return pitch, yaw

# Main function with option to pick nth best match
def find_hotspot_between_image_arrays(img1, img2, patch_size=256, rank=1):
    patches1 = extract_patches(img1, patch_size, patch_size)
    patches2 = extract_patches(img2, patch_size, patch_size)

    # Compute embeddings
    emb1 = [(pos, get_embedding(p)) for pos,p in patches1]
    emb2 = [(pos, get_embedding(p)) for pos,p in patches2]

    # Compare all patches
    scores = []
    for (pos1, e1) in emb1:
        for (pos2, e2) in emb2:
            sim = cosine_similarity([e1],[e2])[0][0]
            scores.append((sim, (pos1, pos2)))

    if len(scores) < rank:
        return 0, 0  # not enough matches

    # Sort and pick nth best
    scores = sorted(scores, key=lambda x: x[0], reverse=True)
    best_score, best_pair = scores[rank-1]

    # Convert to pitch/yaw relative to img1
    (x1,y1), (x2,y2) = best_pair
    h1, w1, _ = img1.shape
    pitch, yaw = equirectangular_to_angles(x1, y1, w1, h1)

    print(f"{rank} best similarity={best_score:.3f}, pitch={pitch:.2f}, yaw={yaw:.2f}")
    return pitch, yaw
