from pymongo import MongoClient
from bson import ObjectId
import os

# MongoDB client and database setup
client = MongoClient("mongodb://localhost:27017")  # Adjust the connection string as necessary
db = client.virtual_tour_db

# Collections
tours_collection = db.tours
scenes_collection = db.scenes
