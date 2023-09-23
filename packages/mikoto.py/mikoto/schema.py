# Generated File. Do not edit manually!
from __future__ import annotations

from pydantic import BaseModel, TypeAdapter
from typing import Optional, Any, List, Callable, Coroutine
import socketio

class Client:
    def __init__(self):
        self.sio = socketio.AsyncClient()

    async def call(self, event: str, *args) -> Any:
        res = await self.sio.call(event, args)
        if 'err' in res:
            raise Exception(res['err'])
        return res.get('ok')

    def on(self, event: str, callback = None):
        return self.sio.on(event, callback)

    def ready(self, fn):
        return self.sio.on('ready', fn)
        
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
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/get", TypeAdapter(str).dump_python(id)))

    async def list(self, ) -> List[Space]:
        return TypeAdapter(List[Space]).validate_python(await self.client.call("spaces/list", ))

    async def create(self, name: str) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/create", TypeAdapter(str).dump_python(name)))

    async def update(self, id: str, options: SpaceUpdateOptions) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/update", TypeAdapter(str).dump_python(id), TypeAdapter(SpaceUpdateOptions).dump_python(options)))

    async def delete(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/delete", TypeAdapter(str).dump_python(id)))

    async def get_space_from_invite(self, invite_code: str) -> Space:
        return TypeAdapter(Space).validate_python(await self.client.call("spaces/getSpaceFromInvite", TypeAdapter(str).dump_python(invite_code)))

    async def join(self, invite_code: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/join", TypeAdapter(str).dump_python(invite_code)))

    async def leave(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/leave", TypeAdapter(str).dump_python(id)))

    async def create_invite(self, id: str) -> Invite:
        return TypeAdapter(Invite).validate_python(await self.client.call("spaces/createInvite", TypeAdapter(str).dump_python(id)))

    async def delete_invite(self, code: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/deleteInvite", TypeAdapter(str).dump_python(code)))

    async def list_invites(self, id: str) -> List[Invite]:
        return TypeAdapter(List[Invite]).validate_python(await self.client.call("spaces/listInvites", TypeAdapter(str).dump_python(id)))

    async def add_bot(self, space_id: str, user_id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("spaces/addBot", TypeAdapter(str).dump_python(space_id), TypeAdapter(str).dump_python(user_id)))

    def on_create(self, fn: Callable[[Space], Coroutine[Any, Any, None]]) -> Callable[[Space], Coroutine[Any, Any, None]]:
        @self.client.on("spaces/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))
        return handler

    def on_update(self, fn: Callable[[Space], Coroutine[Any, Any, None]]) -> Callable[[Space], Coroutine[Any, Any, None]]:
        @self.client.on("spaces/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))
        return handler

    def on_delete(self, fn: Callable[[Space], Coroutine[Any, Any, None]]) -> Callable[[Space], Coroutine[Any, Any, None]]:
        @self.client.on("spaces/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class MemberService:
    client: Client

    async def get(self, space_id: str, user_id: str) -> Member:
        return TypeAdapter(Member).validate_python(await self.client.call("members/get", TypeAdapter(str).dump_python(space_id), TypeAdapter(str).dump_python(user_id)))

    async def list(self, space_id: str) -> List[Member]:
        return TypeAdapter(List[Member]).validate_python(await self.client.call("members/list", TypeAdapter(str).dump_python(space_id)))

    async def update(self, space_id: str, user_id: str, role_ids: MemberUpdateOptions) -> Member:
        return TypeAdapter(Member).validate_python(await self.client.call("members/update", TypeAdapter(str).dump_python(space_id), TypeAdapter(str).dump_python(user_id), TypeAdapter(MemberUpdateOptions).dump_python(role_ids)))

    async def delete(self, space_id: str, user_id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("members/delete", TypeAdapter(str).dump_python(space_id), TypeAdapter(str).dump_python(user_id)))

    def on_create(self, fn: Callable[[Member], Coroutine[Any, Any, None]]) -> Callable[[Member], Coroutine[Any, Any, None]]:
        @self.client.on("members/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))
        return handler

    def on_update(self, fn: Callable[[Member], Coroutine[Any, Any, None]]) -> Callable[[Member], Coroutine[Any, Any, None]]:
        @self.client.on("members/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))
        return handler

    def on_delete(self, fn: Callable[[Member], Coroutine[Any, Any, None]]) -> Callable[[Member], Coroutine[Any, Any, None]]:
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
        return TypeAdapter(User).validate_python(await self.client.call("users/update", TypeAdapter(UserUpdateOptions).dump_python(options)))

    def on_create(self, fn: Callable[[User], Coroutine[Any, Any, None]]) -> Callable[[User], Coroutine[Any, Any, None]]:
        @self.client.on("users/onCreate")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))
        return handler

    def on_update(self, fn: Callable[[User], Coroutine[Any, Any, None]]) -> Callable[[User], Coroutine[Any, Any, None]]:
        @self.client.on("users/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))
        return handler

    def on_delete(self, fn: Callable[[User], Coroutine[Any, Any, None]]) -> Callable[[User], Coroutine[Any, Any, None]]:
        @self.client.on("users/onDelete")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class ChannelService:
    client: Client

    async def get(self, id: str) -> Channel:
        return TypeAdapter(Channel).validate_python(await self.client.call("channels/get", TypeAdapter(str).dump_python(id)))

    async def list(self, space_id: str) -> List[Channel]:
        return TypeAdapter(List[Channel]).validate_python(await self.client.call("channels/list", TypeAdapter(str).dump_python(space_id)))

    async def create(self, space_id: str, options: ChannelCreateOptions) -> Channel:
        return TypeAdapter(Channel).validate_python(await self.client.call("channels/create", TypeAdapter(str).dump_python(space_id), TypeAdapter(ChannelCreateOptions).dump_python(options)))

    async def delete(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/delete", TypeAdapter(str).dump_python(id)))

    async def move(self, id: str, order: int) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/move", TypeAdapter(str).dump_python(id), TypeAdapter(int).dump_python(order)))

    async def start_typing(self, channel_id: str, duration: int) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/startTyping", TypeAdapter(str).dump_python(channel_id), TypeAdapter(int).dump_python(duration)))

    async def stop_typing(self, channel_id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("channels/stopTyping", TypeAdapter(str).dump_python(channel_id)))

    def on_create(self, fn: Callable[[Channel], Coroutine[Any, Any, None]]) -> Callable[[Channel], Coroutine[Any, Any, None]]:
        @self.client.on("channels/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))
        return handler

    def on_update(self, fn: Callable[[Channel], Coroutine[Any, Any, None]]) -> Callable[[Channel], Coroutine[Any, Any, None]]:
        @self.client.on("channels/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))
        return handler

    def on_delete(self, fn: Callable[[Channel], Coroutine[Any, Any, None]]) -> Callable[[Channel], Coroutine[Any, Any, None]]:
        @self.client.on("channels/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))
        return handler

    def on_typing_start(self, fn: Callable[[TypingEvent], Coroutine[Any, Any, None]]) -> Callable[[TypingEvent], Coroutine[Any, Any, None]]:
        @self.client.on("channels/onTypingStart")
        async def handler(data):
            await fn(TypeAdapter(TypingEvent).validate_python(data))
        return handler

    def on_typing_stop(self, fn: Callable[[TypingEvent], Coroutine[Any, Any, None]]) -> Callable[[TypingEvent], Coroutine[Any, Any, None]]:
        @self.client.on("channels/onTypingStop")
        async def handler(data):
            await fn(TypeAdapter(TypingEvent).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class MessageService:
    client: Client

    async def list(self, channel_id: str, options: ListMessageOptions) -> List[Message]:
        return TypeAdapter(List[Message]).validate_python(await self.client.call("messages/list", TypeAdapter(str).dump_python(channel_id), TypeAdapter(ListMessageOptions).dump_python(options)))

    async def send(self, channel_id: str, content: str) -> Message:
        return TypeAdapter(Message).validate_python(await self.client.call("messages/send", TypeAdapter(str).dump_python(channel_id), TypeAdapter(str).dump_python(content)))

    async def edit(self, channel_id: str, message_id: str, content: str) -> Message:
        return TypeAdapter(Message).validate_python(await self.client.call("messages/edit", TypeAdapter(str).dump_python(channel_id), TypeAdapter(str).dump_python(message_id), TypeAdapter(str).dump_python(content)))

    async def delete(self, channel_id: str, message_id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("messages/delete", TypeAdapter(str).dump_python(channel_id), TypeAdapter(str).dump_python(message_id)))

    async def list_unread(self, space_id: str) -> List[Unread]:
        return TypeAdapter(List[Unread]).validate_python(await self.client.call("messages/listUnread", TypeAdapter(str).dump_python(space_id)))

    async def ack(self, channel_id: str, timestamp: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("messages/ack", TypeAdapter(str).dump_python(channel_id), TypeAdapter(str).dump_python(timestamp)))

    def on_create(self, fn: Callable[[Message], Coroutine[Any, Any, None]]) -> Callable[[Message], Coroutine[Any, Any, None]]:
        @self.client.on("messages/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))
        return handler

    def on_update(self, fn: Callable[[Message], Coroutine[Any, Any, None]]) -> Callable[[Message], Coroutine[Any, Any, None]]:
        @self.client.on("messages/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))
        return handler

    def on_delete(self, fn: Callable[[MessageDeleteEvent], Coroutine[Any, Any, None]]) -> Callable[[MessageDeleteEvent], Coroutine[Any, Any, None]]:
        @self.client.on("messages/onDelete")
        async def handler(data):
            await fn(TypeAdapter(MessageDeleteEvent).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class RoleService:
    client: Client

    async def create(self, space_id: str, name: str) -> Role:
        return TypeAdapter(Role).validate_python(await self.client.call("roles/create", TypeAdapter(str).dump_python(space_id), TypeAdapter(str).dump_python(name)))

    async def edit(self, id: str, edit: RoleEditPayload) -> Role:
        return TypeAdapter(Role).validate_python(await self.client.call("roles/edit", TypeAdapter(str).dump_python(id), TypeAdapter(RoleEditPayload).dump_python(edit)))

    async def delete(self, id: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("roles/delete", TypeAdapter(str).dump_python(id)))

    def on_create(self, fn: Callable[[Role], Coroutine[Any, Any, None]]) -> Callable[[Role], Coroutine[Any, Any, None]]:
        @self.client.on("roles/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))
        return handler

    def on_update(self, fn: Callable[[Role], Coroutine[Any, Any, None]]) -> Callable[[Role], Coroutine[Any, Any, None]]:
        @self.client.on("roles/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))
        return handler

    def on_delete(self, fn: Callable[[Role], Coroutine[Any, Any, None]]) -> Callable[[Role], Coroutine[Any, Any, None]]:
        @self.client.on("roles/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))
        return handler


    def __init__(self, client: Client):
        self.client = client


class VoiceService:
    client: Client

    async def join(self, channel_id: str) -> VoiceToken:
        return TypeAdapter(VoiceToken).validate_python(await self.client.call("voice/join", TypeAdapter(str).dump_python(channel_id)))



    def __init__(self, client: Client):
        self.client = client


class RelationService:
    client: Client




    def __init__(self, client: Client):
        self.client = client


class DocumentService:
    client: Client

    async def get(self, channel_id: str) -> Document:
        return TypeAdapter(Document).validate_python(await self.client.call("documents/get", TypeAdapter(str).dump_python(channel_id)))

    async def update(self, channel_id: str, content: str) -> None:
        return TypeAdapter(None).validate_python(await self.client.call("documents/update", TypeAdapter(str).dump_python(channel_id), TypeAdapter(str).dump_python(content)))



    def __init__(self, client: Client):
        self.client = client

