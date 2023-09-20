from pydantic import BaseModel
from typing import Optional, Any, List
import socketio
import asyncio

class Client(BaseModel):
    def __init__(self, sio: socketio.AsyncClient):
        self.sio = sio

    async def call(self, event: str, *args) -> Any:
        res = await self.sio.call(event, args)
        if 'err' in res:
            raise Exception(res['err'])
        return res['ok']
    
    def on(self, event: str, callback):
        self.sio.on(event, callback)

    def ready(self):
        return self.sio.on('ready')
        
    @classmethod
    async def create(url: str):
        sio = socketio.AsyncClient()
        await sio.connect(url)
        
        return Client(sio)
        
    

class User(BaseModel):
    id: str
    name: str
    # avatar: Optional[str]
    # category: Optional[str]


