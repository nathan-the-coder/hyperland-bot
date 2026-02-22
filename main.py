import asyncio
import discord
from discord.ext import commands
from config import DISCORD_TOKEN, GUILD_ID


class HyperlandBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        super().__init__(command_prefix="!", intents=intents)

    async def setup_hook(self):
        await self.load_extension("cogs.commands")
        await self.load_extension("cogs.tickets")
        await self.load_extension("cogs.events")

        if GUILD_ID:
            guild = discord.Object(id=GUILD_ID)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)

    async def on_ready(self):
        print(f"Logged in as {self.user} (ID: {self.user.id})")


async def main():
    async with HyperlandBot() as bot:
        await bot.start(DISCORD_TOKEN)


if __name__ == "__main__":
    asyncio.run(main())
