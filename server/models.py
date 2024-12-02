from pydantic import BaseModel
from uuid import UUID, uuid4
from typing import List, Optional


class SceneUpdate(BaseModel):
    name: str

class Hotspot(BaseModel):
    pitch: float
    yaw: float
    sceneId: str
    text: Optional[str] = None
    type: str

class Scene(BaseModel):
    id: str
    name: str
    image: str
    hotspots: List[dict]



class TourBase(BaseModel):
    id: UUID = uuid4()  # Generate a new UUID by default
    name: str
    sceneIds: List[UUID] = []
    
    
class HotspotUpdateRequest(BaseModel):
    pitch: float
    yaw: float
    text: Optional[str] = None
    type: Optional[str] = None
    sceneId: Optional[str] = None
    

class HotspotDeleteRequest(BaseModel):
    pitch: float
    yaw: float


class Tour(TourBase):
    pass

class TourInDB(TourBase):
    pass
