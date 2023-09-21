# Generated File. Do not edit manually!
from __future__ import annotations

from pydantic import BaseModel, TypeAdapter
from typing import Optional, Any, List, Callable
import socketio

class Client:
    def __init__(self):
        self.sio = socketio.AsyncClient()

    async def call(self, event: str, *args) -> Any:
        res = await self.sio.call(event, args)
        if 'err' in res:
            raise Exception(res['err'])
        return res['ok']

    def on(self, event: str, callback = None):
        return self.sio.on(event, callback)

    def ready(self):
        return self.sio.on('ready')
        
    async def boot(self, url: str):
        await self.sio.connect(url)
        await self.sio.wait()


class User(BaseModel):
    id: str
    name: str
    avatar: Optional[str]
    category: Optional[str]

class Role(BaseModel):
    id: str
    name: str
    color: Optional[str]
    spaceId: str
    permissions: str
    position: int

class Channel(BaseModel):
    id: str
    spaceId: str
    parentId: Optional[str]
    name: str
    order: int
    lastUpdated: Optional[str]
    type: str

class Space(BaseModel):
    id: str
    name: str
    icon: Optional[str]
    channels: List[Channel]
    roles: List[Role]
    ownerId: Optional[str]

class Member(BaseModel):
    id: str
    spaceId: str
    user: User
    roleIds: List[str]

class Message(BaseModel):
    id: str
    content: str
    timestamp: str
    editedTimestamp: Optional[str]
    authorId: Optional[str]
    author: Optional[User]
    channelId: str

class Invite(BaseModel):
    code: str

class SpaceUpdateOptions(BaseModel):
    name: Optional[str]
    icon: Optional[str]

class MemberUpdateOptions(BaseModel):
    roleIds: List[str]

class UserUpdateOptions(BaseModel):
    name: Optional[str]
    avatar: Optional[str]

class ChannelCreateOptions(BaseModel):
    name: str
    type: str
    parentId: Optional[str]

class TypingEvent(BaseModel):
    channelId: str
    userId: str
    member: Optional[Member]

class ListMessageOptions(BaseModel):
    cursor: Optional[str]
    limit: int

class MessageDeleteEvent(BaseModel):
    messageId: str
    channelId: str

class Unread(BaseModel):
    channelId: str
    timestamp: str

class RoleEditPayload(BaseModel):
    name: Optional[str]
    color: Optional[str]
    permissions: Optional[str]
    position: Optional[int]

class VoiceToken(BaseModel):
    url: str
    channelId: str
    token: str

class Relations(BaseModel):
    pass

class Document(BaseModel):
    id: str
    channelId: str
    content: str

class MainService:
    client: Client
    spaces: SpaceService
    channels: ChannelService
    members: MemberService
    users: UserService
    messages: MessageService
    roles: RoleService
    voice: VoiceService
    relations: RelationService
    documents: DocumentService



    def __init__(self, client: Client):
        self.client = client
        self.spaces = SpaceService(client)
        self.channels = ChannelService(client)
        self.members = MemberService(client)
        self.users = UserService(client)
        self.messages = MessageService(client)
        self.roles = RoleService(client)
        self.voice = VoiceService(client)
        self.relations = RelationService(client)
        self.documents = DocumentService(client)

class SpaceService:
    client: Client

    async def get(self, id: str) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/get", id))

    async def list(self, ) -> List[Space]:
        return TypeAdapter(List[Space]).validate_python(await self.client.call("spaces/list", ))

    async def create(self, name: str) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/create", name))

    async def update(self, id: str, options: SpaceUpdateOptions) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/update", id, options))

    async def delete(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/delete", id))

    async def getSpaceFromInvite(self, inviteCode: str) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/getSpaceFromInvite", inviteCode))

    async def join(self, inviteCode: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/join", inviteCode))

    async def leave(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/leave", id))

    async def createInvite(self, id: str) -> Invite:
        return TypeAdapter(Invite).validate_python(await self.client.call("spaces/createInvite", id))

    async def deleteInvite(self, code: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/deleteInvite", code))

    async def listInvites(self, id: str) -> List[Invite]:
        return TypeAdapter(List[Invite]).validate_python(await self.client.call("spaces/listInvites", id))

    async def addBot(self, spaceId: str, userId: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/addBot", spaceId, userId))

    def onCreate(self, fn: Callable[[Space], None]):
        @self.client.on("spaces/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))
        return handler

    def onUpdate(self, fn: Callable[[Space], None]):
        @self.client.on("spaces/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))
        return handler

    def onDelete(self, fn: Callable[[Space], None]):
        @self.client.on("spaces/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class MemberService:
    client: Client

    async def get(self, spaceId: str, userId: str) -> Member:
        return TypeAdapter(Member).validate_python(await self.client.call("members/get", spaceId, userId))

    async def list(self, spaceId: str) -> List[Member]:
        return TypeAdapter(List[Member]).validate_python(await self.client.call("members/list", spaceId))

    async def update(self, spaceId: str, userId: str, roleIds: MemberUpdateOptions) -> Member:
        return TypeAdapter(Member).validate_python(await self.client.call("members/update", spaceId, userId, roleIds))

    async def delete(self, spaceId: str, userId: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("members/delete", spaceId, userId))

    def onCreate(self, fn: Callable[[Member], None]):
        @self.client.on("members/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))
        return handler

    def onUpdate(self, fn: Callable[[Member], None]):
        @self.client.on("members/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))
        return handler

    def onDelete(self, fn: Callable[[Member], None]):
        @self.client.on("members/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class UserService:
    client: Client

    async def me(self, ) -> User:
        return TypeAdapter(User).validate_python(await self.client.call("users/me", ))

    async def update(self, options: UserUpdateOptions) -> User:
        return TypeAdapter(User).validate_python(await self.client.call("users/update", options))

    def onCreate(self, fn: Callable[[User], None]):
        @self.client.on("users/onCreate")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))
        return handler

    def onUpdate(self, fn: Callable[[User], None]):
        @self.client.on("users/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))
        return handler

    def onDelete(self, fn: Callable[[User], None]):
        @self.client.on("users/onDelete")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class ChannelService:
    client: Client

    async def get(self, id: str) -> Channel:
        return TypeAdapter(Channel).validate_python(await self.client.call("channels/get", id))

    async def list(self, spaceId: str) -> List[Channel]:
        return TypeAdapter(List[Channel]).validate_python(await self.client.call("channels/list", spaceId))

    async def create(self, spaceId: str, options: ChannelCreateOptions) -> Channel:
        return TypeAdapter(Channel).validate_python(await self.client.call("channels/create", spaceId, options))

    async def delete(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/delete", id))

    async def move(self, id: str, order: int) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/move", id, order))

    async def startTyping(self, channelId: str, duration: int) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/startTyping", channelId, duration))

    async def stopTyping(self, channelId: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/stopTyping", channelId))

    def onCreate(self, fn: Callable[[Channel], None]):
        @self.client.on("channels/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))
        return handler

    def onUpdate(self, fn: Callable[[Channel], None]):
        @self.client.on("channels/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))
        return handler

    def onDelete(self, fn: Callable[[Channel], None]):
        @self.client.on("channels/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))
        return handler

    def onTypingStart(self, fn: Callable[[TypingEvent], None]):
        @self.client.on("channels/onTypingStart")
        async def handler(data):
            await fn(TypeAdapter(TypingEvent).validate_python(data))
        return handler

    def onTypingStop(self, fn: Callable[[TypingEvent], None]):
        @self.client.on("channels/onTypingStop")
        async def handler(data):
            await fn(TypeAdapter(TypingEvent).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class MessageService:
    client: Client

    async def list(self, channelId: str, options: ListMessageOptions) -> List[Message]:
        return TypeAdapter(List[Message]).validate_python(await self.client.call("messages/list", channelId, options))

    async def send(self, channelId: str, content: str) -> Message:
        return TypeAdapter(Message).validate_python(await self.client.call("messages/send", channelId, content))

    async def edit(self, channelId: str, messageId: str, content: str) -> Message:
        return TypeAdapter(Message).validate_python(await self.client.call("messages/edit", channelId, messageId, content))

    async def delete(self, channelId: str, messageId: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("messages/delete", channelId, messageId))

    async def listUnread(self, spaceId: str) -> List[Unread]:
        return TypeAdapter(List[Unread]).validate_python(await self.client.call("messages/listUnread", spaceId))

    async def ack(self, channelId: str, timestamp: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("messages/ack", channelId, timestamp))

    def onCreate(self, fn: Callable[[Message], None]):
        @self.client.on("messages/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))
        return handler

    def onUpdate(self, fn: Callable[[Message], None]):
        @self.client.on("messages/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))
        return handler

    def onDelete(self, fn: Callable[[MessageDeleteEvent], None]):
        @self.client.on("messages/onDelete")
        async def handler(data):
            await fn(TypeAdapter(MessageDeleteEvent).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class RoleService:
    client: Client

    async def create(self, spaceId: str, name: str) -> Role:
        return TypeAdapter(Role).validate_python(await self.client.call("roles/create", spaceId, name))

    async def edit(self, id: str, edit: RoleEditPayload) -> Role:
        return TypeAdapter(Role).validate_python(await self.client.call("roles/edit", id, edit))

    async def delete(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("roles/delete", id))

    def onCreate(self, fn: Callable[[Role], None]):
        @self.client.on("roles/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))
        return handler

    def onUpdate(self, fn: Callable[[Role], None]):
        @self.client.on("roles/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))
        return handler

    def onDelete(self, fn: Callable[[Role], None]):
        @self.client.on("roles/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class VoiceService:
    client: Client

    async def join(self, channelId: str) -> VoiceToken:
        return TypeAdapter(VoiceToken).validate_python(await self.client.call("voice/join", channelId))



    def __init__(self, client: Client):
        self.client = client


class RelationService:
    client: Client




    def __init__(self, client: Client):
        self.client = client


class DocumentService:
    client: Client

    async def get(self, channelId: str) -> Document:
        return TypeAdapter(Document).validate_python(await self.client.call("documents/get", channelId))

    async def update(self, channelId: str, content: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("documents/update", channelId, content))



    def __init__(self, client: Client):
        self.client = client

