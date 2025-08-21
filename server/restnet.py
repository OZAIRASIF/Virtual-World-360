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
# Load pretrained ResNet50 once
resnet = models.resnet50(pretrained=True)
resnet.fc = nn.Identity()  # remove classifier
resnet.eval()

transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def get_embedding(patch):
    img_t = transform(patch).unsqueeze(0)
    with torch.no_grad():
        feat = resnet(img_t)
    return feat.squeeze().numpy()

def resize_if_needed(img, max_width=2048):
    """Resize panorama if it's too big to keep compute reasonable."""
    h, w = img.shape[:2]
    if w > max_width:
        scale = max_width / w
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return img


def extract_patches(img, patch_h, patch_w, stride=None, ignore_top_ratio=0.5):
    """Extract patches with stride and ignore top % of image."""
    if stride is None:
        stride = patch_h // 2
    patches = []
    h, w, _ = img.shape
    
    y_start = int(h * ignore_top_ratio)
    
    for y in range(y_start, h - patch_h + 1, stride):
        for x in range(0, w - patch_w + 1, stride):
            patch = img[y:y+patch_h, x:x+patch_w]
            patches.append(((x + patch_w//2, y + patch_h//2), patch))
    return patches


def equirectangular_to_angles(x, y, w, h):
    yaw = (x / w) * 360 - 180
    pitch = 90 - (y / h) * 180
    return pitch, yaw


def find_hotspot_between_image_arrays(img1, img2):
    # --- Resize both if needed ---
    img1 = resize_if_needed(img1)
    img2 = resize_if_needed(img2)

    # --- Adaptive patch size based on image width ---
    h1, w1, _ = img1.shape
    patch_size = max(224, w1 // 6)   # e.g., 256 for 2048px wide
    stride = patch_size              # no overlap to keep it fast

    print(f"Using patch_size={patch_size}, stride={stride}, img1={w1}x{h1}")

    patches1 = extract_patches(img1, patch_size, patch_size, stride)
    patches2 = extract_patches(img2, patch_size, patch_size, stride)

    # --- Compute embeddings ---
    emb1 = [(pos, get_embedding(p)) for pos, p in patches1]
    emb2 = [(pos, get_embedding(p)) for pos, p in patches2]

    best_score, best_pair = -1, None
    for (pos1, e1) in emb1:
        for (pos2, e2) in emb2:
            sim = cosine_similarity([e1], [e2])[0][0]
            if sim > best_score:
                best_score = sim
                best_pair = (pos1, pos2)

    if best_pair is None:
        return 0, 0

    # Convert best match to pitch/yaw
    (x1, y1), _ = best_pair
    pitch, yaw = equirectangular_to_angles(x1, y1, w1, h1)

    print(f"Best similarity={best_score:.3f}, pitch={pitch:.2f}, yaw={yaw:.2f}")
    return pitch, yaw
