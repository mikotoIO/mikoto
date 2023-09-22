from mikoto.auth import AuthClient
from .schema import *
import asyncio

class MikotoClient(MainService):
    def __init__(self,
            auth_url="https://auth.alpha.mikoto.io",
            base_url="https://server.alpha.mikoto.io"         
        ):
        client = Client()
        self.auth = AuthClient(auth_url)
        self.base_url = base_url
        super().__init__(client)

    async def _login_internal(self, token: str):
        acc = await self.auth.bot_login(token)
        await self.client.boot(f'{self.base_url}?accessToken={acc}')

    def login(self, token: str):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self._login_internal(token))