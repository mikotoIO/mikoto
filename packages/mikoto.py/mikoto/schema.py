# Generated File. Do not edit manually!
from __future__ import annotations

from pydantic import BaseModel, TypeAdapter
from typing import Optional, Any, List, Callable, Coroutine
import socketio


class Client:
    def __init__(self):
        self.sio = socketio.AsyncClient()

    async def call(self, event: str, payload) -> Any:
        res: Any = await self.sio.call(event, payload)
        if "err" in res:
            raise Exception(res["err"])
        return res.get("ok")

    def on(self, event: str, callback=None) -> Any:
        return self.sio.on(event, callback)

    def ready(self, fn):
        return self.sio.on("ready", fn)

    async def boot(self, url: str, auth_token: str):
        await self.sio.connect(url, auth={"token": auth_token})
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


class Unread(BaseModel):
    channelId: str
    timestamp: str


class Relations:
    pass


class Document(BaseModel):
    id: str
    channelId: str
    content: str


class TypingEvent(BaseModel):
    channelId: str
    userId: str
    memberId: str


class MessageDeleteEvent(BaseModel):
    messageId: str
    channelId: str


class VoiceToken(BaseModel):
    url: str
    channelId: str
    token: str


class SpaceUpdateOptions(BaseModel):
    name: Optional[str]
    icon: Optional[str]


class ChannelCreateOptions(BaseModel):
    name: str
    type: str
    parentId: Optional[str]


class ChannelUpdateOptions(BaseModel):
    name: Optional[str]


class MemberUpdateOptions(BaseModel):
    roleIds: List[str]


class RoleEditPayload(BaseModel):
    name: Optional[str]
    color: Optional[str]
    permissions: Optional[str]
    position: Optional[int]


class UserUpdateOptions(BaseModel):
    name: Optional[str]
    avatar: Optional[str]


class MainService:
    channels: ChannelService
    documents: DocumentService
    spaces: SpaceService
    members: MemberService
    users: UserService
    messages: MessageService
    roles: RoleService
    voice: VoiceService
    client: Client

    def __init__(self, client: Client):
        self.client = client
        self.channels = ChannelService(client)
        self.documents = DocumentService(client)
        self.spaces = SpaceService(client)
        self.members = MemberService(client)
        self.users = UserService(client)
        self.messages = MessageService(client)
        self.roles = RoleService(client)
        self.voice = VoiceService(client)


class ChannelService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def get(self, channelId: str) -> Channel:
        payload = {"channelId": TypeAdapter(str).dump_python(channelId)}
        return TypeAdapter(Channel).validate_python(
            await self.client.call("channels/get", payload)
        )

    async def list(self, spaceId: str) -> List[Channel]:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(List[Channel]).validate_python(
            await self.client.call("channels/list", payload)
        )

    async def create(
        self, spaceId: str, name: str, parentId: Optional[str], type: str
    ) -> Channel:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "name": TypeAdapter(str).dump_python(name),
            "parentId": TypeAdapter(Optional[str]).dump_python(parentId),
            "type": TypeAdapter(str).dump_python(type),
        }
        return TypeAdapter(Channel).validate_python(
            await self.client.call("channels/create", payload)
        )

    async def update(self, channelId: str, options: ChannelUpdateOptions) -> Channel:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "options": TypeAdapter(ChannelUpdateOptions).dump_python(options),
        }
        return TypeAdapter(Channel).validate_python(
            await self.client.call("channels/update", payload)
        )

    async def delete(self, channelId: str) -> Channel:
        payload = {"channelId": TypeAdapter(str).dump_python(channelId)}
        return TypeAdapter(Channel).validate_python(
            await self.client.call("channels/delete", payload)
        )

    def on_create(self, fn: Callable[[Channel], Coroutine[Any, Any, None]]):
        @self.client.on("channels/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))

        return handler

    def on_update(self, fn: Callable[[Channel], Coroutine[Any, Any, None]]):
        @self.client.on("channels/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))

        return handler

    def on_delete(self, fn: Callable[[Channel], Coroutine[Any, Any, None]]):
        @self.client.on("channels/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Channel).validate_python(data))

        return handler


class DocumentService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def get(self, channelId: str) -> Document:
        payload = {"channelId": TypeAdapter(str).dump_python(channelId)}
        return TypeAdapter(Document).validate_python(
            await self.client.call("documents/get", payload)
        )

    async def update(self, channelId: str, content: str) -> Document:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "content": TypeAdapter(str).dump_python(content),
        }
        return TypeAdapter(Document).validate_python(
            await self.client.call("documents/update", payload)
        )


class MemberService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def get(self, spaceId: str, userId: str) -> Member:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "userId": TypeAdapter(str).dump_python(userId),
        }
        return TypeAdapter(Member).validate_python(
            await self.client.call("members/get", payload)
        )

    async def list(self, spaceId: str) -> List[Member]:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(List[Member]).validate_python(
            await self.client.call("members/list", payload)
        )

    async def create(self, spaceId: str, userId: str) -> Member:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "userId": TypeAdapter(str).dump_python(userId),
        }
        return TypeAdapter(Member).validate_python(
            await self.client.call("members/create", payload)
        )

    async def update(
        self, spaceId: str, userId: str, options: MemberUpdateOptions
    ) -> Member:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "userId": TypeAdapter(str).dump_python(userId),
            "options": TypeAdapter(MemberUpdateOptions).dump_python(options),
        }
        return TypeAdapter(Member).validate_python(
            await self.client.call("members/update", payload)
        )

    async def delete(self, spaceId: str, userId: str) -> Member:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "userId": TypeAdapter(str).dump_python(userId),
        }
        return TypeAdapter(Member).validate_python(
            await self.client.call("members/delete", payload)
        )

    def on_create(self, fn: Callable[[Member], Coroutine[Any, Any, None]]):
        @self.client.on("members/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))

        return handler

    def on_update(self, fn: Callable[[Member], Coroutine[Any, Any, None]]):
        @self.client.on("members/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))

        return handler

    def on_delete(self, fn: Callable[[Member], Coroutine[Any, Any, None]]):
        @self.client.on("members/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Member).validate_python(data))

        return handler


class MessageService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def list(
        self, channelId: str, cursor: Optional[str], limit: int
    ) -> List[Message]:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "cursor": TypeAdapter(Optional[str]).dump_python(cursor),
            "limit": TypeAdapter(int).dump_python(limit),
        }
        return TypeAdapter(List[Message]).validate_python(
            await self.client.call("messages/list", payload)
        )

    async def send(self, channelId: str, content: str) -> Message:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "content": TypeAdapter(str).dump_python(content),
        }
        return TypeAdapter(Message).validate_python(
            await self.client.call("messages/send", payload)
        )

    async def edit(self, channelId: str, messageId: str, content: str) -> Message:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "messageId": TypeAdapter(str).dump_python(messageId),
            "content": TypeAdapter(str).dump_python(content),
        }
        return TypeAdapter(Message).validate_python(
            await self.client.call("messages/edit", payload)
        )

    async def delete(self, channelId: str, messageId: str) -> Message:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "messageId": TypeAdapter(str).dump_python(messageId),
        }
        return TypeAdapter(Message).validate_python(
            await self.client.call("messages/delete", payload)
        )

    async def start_typing(self, channelId: str) -> TypingEvent:
        payload = {"channelId": TypeAdapter(str).dump_python(channelId)}
        return TypeAdapter(TypingEvent).validate_python(
            await self.client.call("messages/startTyping", payload)
        )

    async def ack(self, channelId: str, timestamp: str) -> Unread:
        payload = {
            "channelId": TypeAdapter(str).dump_python(channelId),
            "timestamp": TypeAdapter(str).dump_python(timestamp),
        }
        return TypeAdapter(Unread).validate_python(
            await self.client.call("messages/ack", payload)
        )

    async def list_unread(self, spaceId: str) -> List[Unread]:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(List[Unread]).validate_python(
            await self.client.call("messages/listUnread", payload)
        )

    def on_create(self, fn: Callable[[Message], Coroutine[Any, Any, None]]):
        @self.client.on("messages/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))

        return handler

    def on_update(self, fn: Callable[[Message], Coroutine[Any, Any, None]]):
        @self.client.on("messages/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))

        return handler

    def on_delete(self, fn: Callable[[Message], Coroutine[Any, Any, None]]):
        @self.client.on("messages/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Message).validate_python(data))

        return handler

    def on_typing_start(self, fn: Callable[[TypingEvent], Coroutine[Any, Any, None]]):
        @self.client.on("messages/onTypingStart")
        async def handler(data):
            await fn(TypeAdapter(TypingEvent).validate_python(data))

        return handler


class RoleService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def create(self, spaceId: str, name: str) -> Role:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "name": TypeAdapter(str).dump_python(name),
        }
        return TypeAdapter(Role).validate_python(
            await self.client.call("roles/create", payload)
        )

    async def edit(self, spaceId: str, roleId: str, options: RoleEditPayload) -> Role:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "roleId": TypeAdapter(str).dump_python(roleId),
            "options": TypeAdapter(RoleEditPayload).dump_python(options),
        }
        return TypeAdapter(Role).validate_python(
            await self.client.call("roles/edit", payload)
        )

    async def delete(self, spaceId: str, roleId: str) -> Role:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "roleId": TypeAdapter(str).dump_python(roleId),
        }
        return TypeAdapter(Role).validate_python(
            await self.client.call("roles/delete", payload)
        )

    def on_create(self, fn: Callable[[Role], Coroutine[Any, Any, None]]):
        @self.client.on("roles/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))

        return handler

    def on_update(self, fn: Callable[[Role], Coroutine[Any, Any, None]]):
        @self.client.on("roles/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))

        return handler

    def on_delete(self, fn: Callable[[Role], Coroutine[Any, Any, None]]):
        @self.client.on("roles/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Role).validate_python(data))

        return handler


class SpaceService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def get(self, spaceId: str) -> Space:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/get", payload)
        )

    async def list(
        self,
    ) -> List[Space]:
        payload = {}
        return TypeAdapter(List[Space]).validate_python(
            await self.client.call("spaces/list", payload)
        )

    async def create(self, name: str) -> Space:
        payload = {"name": TypeAdapter(str).dump_python(name)}
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/create", payload)
        )

    async def update(self, spaceId: str, options: SpaceUpdateOptions) -> Space:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "options": TypeAdapter(SpaceUpdateOptions).dump_python(options),
        }
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/update", payload)
        )

    async def delete(self, spaceId: str) -> Space:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/delete", payload)
        )

    async def get_space_from_invite(self, inviteCode: str) -> Space:
        payload = {"inviteCode": TypeAdapter(str).dump_python(inviteCode)}
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/getSpaceFromInvite", payload)
        )

    async def join(self, inviteCode: str) -> Space:
        payload = {"inviteCode": TypeAdapter(str).dump_python(inviteCode)}
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/join", payload)
        )

    async def leave(self, spaceId: str) -> Space:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(Space).validate_python(
            await self.client.call("spaces/leave", payload)
        )

    async def create_invite(self, spaceId: str) -> Invite:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(Invite).validate_python(
            await self.client.call("spaces/createInvite", payload)
        )

    async def list_invites(self, spaceId: str) -> List[Invite]:
        payload = {"spaceId": TypeAdapter(str).dump_python(spaceId)}
        return TypeAdapter(List[Invite]).validate_python(
            await self.client.call("spaces/listInvites", payload)
        )

    async def delete_invite(self, spaceId: str, inviteCode: str) -> str:
        payload = {
            "spaceId": TypeAdapter(str).dump_python(spaceId),
            "inviteCode": TypeAdapter(str).dump_python(inviteCode),
        }
        return TypeAdapter(str).validate_python(
            await self.client.call("spaces/deleteInvite", payload)
        )

    def on_create(self, fn: Callable[[Space], Coroutine[Any, Any, None]]):
        @self.client.on("spaces/onCreate")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))

        return handler

    def on_update(self, fn: Callable[[Space], Coroutine[Any, Any, None]]):
        @self.client.on("spaces/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))

        return handler

    def on_delete(self, fn: Callable[[Space], Coroutine[Any, Any, None]]):
        @self.client.on("spaces/onDelete")
        async def handler(data):
            await fn(TypeAdapter(Space).validate_python(data))

        return handler


class UserService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def me(
        self,
    ) -> User:
        payload = {}
        return TypeAdapter(User).validate_python(
            await self.client.call("users/me", payload)
        )

    async def update(self, options: UserUpdateOptions) -> User:
        payload = {"options": TypeAdapter(UserUpdateOptions).dump_python(options)}
        return TypeAdapter(User).validate_python(
            await self.client.call("users/update", payload)
        )

    def on_create(self, fn: Callable[[User], Coroutine[Any, Any, None]]):
        @self.client.on("users/onCreate")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))

        return handler

    def on_update(self, fn: Callable[[User], Coroutine[Any, Any, None]]):
        @self.client.on("users/onUpdate")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))

        return handler

    def on_delete(self, fn: Callable[[User], Coroutine[Any, Any, None]]):
        @self.client.on("users/onDelete")
        async def handler(data):
            await fn(TypeAdapter(User).validate_python(data))

        return handler


class VoiceService:
    client: Client

    def __init__(self, client: Client):
        self.client = client

    async def join(self, channelId: str) -> VoiceToken:
        payload = {"channelId": TypeAdapter(str).dump_python(channelId)}
        return TypeAdapter(VoiceToken).validate_python(
            await self.client.call("voice/join", payload)
        )
