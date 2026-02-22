import discord
from discord.ext import commands, tasks
from utils.mc_server import get_server_status, clear_cache
from config import GUILD_ID, MC_IP


class Events(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.stats_channels = {
            "members": "1472544108995154071",
            "players": "1472546850270875776",
            "ip": "1472547148389154937",
        }

    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Ready! Logged in as {self.bot.user}")
        self.update_stats.start()

    @tasks.loop(minutes=10)
    async def update_stats(self):
        guild = self.bot.get_guild(GUILD_ID)
        if not guild:
            return

        try:
            member_count = guild.member_count
            member_channel = guild.get_channel(int(self.stats_channels["members"]))
            if member_channel:
                await member_channel.edit(name=f"👥 Members: {member_count:,}")

            status = await get_server_status()

            player_channel = guild.get_channel(int(self.stats_channels["players"]))
            if player_channel:
                players = status.get("players", 0)
                await player_channel.edit(name=f"🎮 Players: {players}")

            ip_channel = guild.get_channel(int(self.stats_channels["ip"]))
            if ip_channel:
                await ip_channel.edit(name=f"🔗 IP: {MC_IP}")

            clear_cache()
        except Exception as e:
            print(f"Error updating stats: {e}")

    @update_stats.before_loop
    async def before_update_stats(self):
        await self.bot.wait_until_ready()


async def setup(bot):
    await bot.add_cog(Events(bot))
