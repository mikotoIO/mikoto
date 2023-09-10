from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: str
    name: str
    # avatar: Optional[str]
    # category: Optional[str]

