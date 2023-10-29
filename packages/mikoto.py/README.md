# Mikoto.py

> Warning: Mikoto.py is still in early development and is not ready for production use.

Mikoto.py is the official Python library for interacting with the Mikoto API.

## Example

```py
import mikoto

MIKOTO_TOKEN = '<bot token>'

bot = mikoto.MikotoClient()

@bot.messages.on_create
async def messaging(msg: mikoto.Message):
    if msg.content == "!ping":
        await bot.messages.send(msg.channelId, "pong!")

@bot.client.ready
async def ready():
    # fires when the bot has fully connected to the API
    print('Ready!')

bot.login(MIKOTO_TOKEN)
```
