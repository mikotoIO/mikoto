import httpx

class AuthClient:
    def __init__(self, base_url='http://localhost:9500'):
        self.client = httpx.AsyncClient(base_url=base_url)

    async def bot_login(self, token: str):
        r = await self.client.post('/bots/auth', json={'botKey': token})
        return r.json()['accessToken']