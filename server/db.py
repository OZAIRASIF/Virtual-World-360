
import os
import pymongo

ENVIRONMENT = os.environ["ENVIRONMENT"]

if ENVIRONMENT == "dev":
    connection_string = "mongodb://localhost:27017"
    db_client = pymongo.MongoClient(connection_string)
    DB_NAME="virtual_tour_db"
    db_client = db_client.get_database(DB_NAME)
else:   
    MONGO_CLUSTER = os.environ["MONGO_URI"]
    MONGO_USERNAME = os.environ["MONGO_USERNAME"]
    MONGO_PASSWORD = os.environ["MONGO_PASSWORD"]
    DB_NAME = os.environ["DB_NAME"]
    connection_string = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_CLUSTER}/?retryWrites=true&ssl=true&ssl_cert_reqs=CERT_NONE&w=majority"
    db_client = pymongo.MongoClient(connection_string)
    db_client = db_client.get_database(DB_NAME)

tours_collection= db_client.get_collection("tours")
scenes_collection = db_client.get_collection("scenes")