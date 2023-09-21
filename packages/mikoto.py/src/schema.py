from pydantic import BaseModel
from typing import Optional, Any, List
import socketio


class Client:
    def __init__(self):
        self.sio = socketio.AsyncClient()

    async def call(self, event: str, *args) -> Any:
        res = await self.sio.call(event, args)
        if 'err' in res:
            raise Exception(res['err'])
        return res['ok']
    
    def on(self, event: str, callback):
        self.sio.on(event, callback)

    def ready(self):
        return self.sio.on('ready')
        
    async def boot(self, url: str):
        await self.sio.connect(url)
        await self.sio.wait()
        
    

class User(BaseModel):
    id: str
    name: str
    # avatar: Optional[str]
    # category: Optional[str]


