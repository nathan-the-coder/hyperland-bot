import discord
from discord import app_commands
from discord.ext import commands
from utils.mc_server import get_server_status
from config import MC_IP, MC_PORT, GUILD_ID
from cogs.tickets import TicketView, store_ticket_message_id


class Commands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="hln", description="Check HLN Server Status")
    async def hln(self, interaction: discord.Interaction):
        await interaction.response.defer()

        try:
            status = await get_server_status()

            player_list = (
                "\n".join([p["name"] for p in status["sample"]])
                if status.get("sample")
                else "None"
            )
            player_header = (
                f"Online Players ({status['players']}/{status['max_players']})"
            )

            embed = discord.Embed(title="Hyperland Status", color=0x55FF55)
            embed.add_field(
                name="**Server Info**",
                value=f"**IP: {MC_IP}**\n**PORT: {MC_PORT}**",
                inline=False,
            )
            embed.add_field(
                name="Version", value=status.get("version", "1.21.x"), inline=True
            )
            embed.add_field(
                name="Server Status",
                value="🟢 Online" if status["online"] else "🔴 Offline",
                inline=True,
            )
            embed.add_field(name=player_header, value=player_list, inline=False)
            embed.timestamp = discord.utils.utcnow()

            await interaction.followup.send(embed=embed)
        except Exception as e:
            print(f"Error in /hln: {e}")
            embed = discord.Embed(title="Hyperland Status", color=0xFF5555)
            embed.add_field(
                name="**Server Info**",
                value=f"**IP: {MC_IP}**\n**PORT: {MC_PORT}**",
                inline=False,
            )
            embed.add_field(
                name="Server Status", value="🔴 Unable to reach server", inline=True
            )
            embed.timestamp = discord.utils.utcnow()
            await interaction.followup.send(embed=embed)

    @app_commands.command(name="ip", description="Shows the IP of the minecraft server")
    async def ip(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🎮 Server IP", description=f"**{MC_IP}:{MC_PORT}**", color=0x55FF55
        )
        embed.set_footer(text="Hyperland Network")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="setup", description="Setup the ticket panel message")
    @app_commands.checks.has_permissions(administrator=True)
    async def setup(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🎫 Support Tickets",
            description="Need help? Create a ticket and our staff will assist you!",
            color=discord.Color.blurple(),
        )

        messages = [m async for m in interaction.channel.history(limit=20)]
        old_messages = [
            m
            for m in messages
            if m.author == self.bot.user
            and m.embeds
            and m.embeds[0].title
            and "Support Tickets" in m.embeds[0].title
        ]
        if old_messages:
            await interaction.channel.delete_messages(old_messages)

        message = await interaction.channel.send(embed=embed, view=TicketView())
        store_ticket_message_id(message.id)
        await interaction.response.send_message("Ticket panel sent!", ephemeral=True)

    @setup.error
    async def setup_error(self, interaction: discord.Interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message(
                "You need administrator permissions to use this command.",
                ephemeral=True,
            )


async def setup(bot):
    await bot.add_cog(Commands(bot))
