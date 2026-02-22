import discord
from discord import ui
from discord.ext import commands
import json
import os
from config import TICKET_LOG_CHANNEL_ID, STAFF_ROLE_ID, TICKET_CATEGORY_ID

TICKET_MSG_FILE = "ticketMessageId.json"


def get_stored_ticket_message_id() -> int | None:
    try:
        if os.path.exists(TICKET_MSG_FILE):
            with open(TICKET_MSG_FILE, "r") as f:
                return json.load(f).get("messageId")
    except:
        pass
    return None


def store_ticket_message_id(message_id: int):
    with open(TICKET_MSG_FILE, "w") as f:
        json.dump({"messageId": message_id}, f)


class TicketView(ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @ui.button(
        label="Create Ticket",
        style=discord.ButtonStyle.primary,
        emoji="🎫",
        custom_id="create_ticket",
    )
    async def create_ticket(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(TicketModal())


class TicketModal(ui.Modal, title="Create Ticket"):
    reason = ui.TextInput(
        label="What do you need help with?",
        style=discord.TextStyle.paragraph,
        required=True,
    )

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        guild = interaction.guild
        user = interaction.user

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            user: discord.PermissionOverwrite(view_channel=True, send_messages=True),
            guild.owner: discord.PermissionOverwrite(
                view_channel=True, send_messages=True
            ),
        }

        if STAFF_ROLE_ID:
            staff_role = guild.get_role(STAFF_ROLE_ID)
            if staff_role:
                overwrites[staff_role] = discord.PermissionOverwrite(
                    view_channel=True, send_messages=True
                )

        channel = await guild.create_text_channel(
            name=f"ticket-{user.name}",
            category=guild.get_channel(TICKET_CATEGORY_ID),
            overwrites=overwrites,
        )

        embed = discord.Embed(title="🎫 Ticket Opened", color=discord.Color.green())
        embed.add_field(name="👤 Requester", value=f"{user.mention}", inline=True)
        embed.add_field(name="📝 Reason", value=str(self.reason), inline=True)
        embed.add_field(name="⏳ Status", value="Awaiting Staff...", inline=False)
        embed.set_footer(text="Hyperland Network • Support System")

        staff_mention = f"<@&{STAFF_ROLE_ID}>" if STAFF_ROLE_ID else ""
        view = TicketActionView()
        await channel.send(
            content=f"{user.mention} {staff_mention}".strip(), embed=embed, view=view
        )

        await log_ticket_action(
            interaction, "create", discord.Color.green(), channel, str(self.reason)
        )
        await interaction.followup.send(
            f"Ticket created: {channel.mention}", ephemeral=True
        )


class TicketActionView(ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.claimed_by = None
        self.update_buttons("open")

    def update_buttons(self, state: str):
        states = {
            "open": {"claim": False, "close": False, "reopen": True, "delete": False},
            "claimed": {"claim": True, "close": False, "reopen": True, "delete": False},
            "closed": {"claim": True, "close": True, "reopen": False, "delete": False},
            "reopened": {
                "claim": False,
                "close": False,
                "reopen": True,
                "delete": False,
            },
        }
        disabled = states.get(state, states["open"])

        self.claim.disabled = disabled["claim"]
        self.close.disabled = disabled["close"]
        self.reopen.disabled = disabled["reopen"]
        self.delete.disabled = disabled["delete"]

    @ui.button(
        label="Claim",
        style=discord.ButtonStyle.primary,
        emoji="🎟️",
        custom_id="claim_ticket",
    )
    async def claim(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.defer()

        self.claimed_by = interaction.user
        self.update_buttons("claimed")

        embed = interaction.message.embeds[0]
        embed.color = discord.Color.orange()
        embed.set_field_at(
            2, name="⏳ Status", value=f"Handled by {interaction.user.mention}"
        )

        await interaction.message.edit(embed=embed, view=self)
        await log_ticket_action(
            interaction, "claim", discord.Color.orange(), interaction.channel
        )
        await interaction.followup.send(
            f"✅ Ticket handled by {interaction.user.mention}!"
        )

    @ui.button(
        label="Close",
        style=discord.ButtonStyle.secondary,
        emoji="🔒",
        custom_id="close_ticket",
    )
    async def close(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(CloseModal(self))

    @ui.button(
        label="Reopen",
        style=discord.ButtonStyle.success,
        emoji="🔓",
        custom_id="reopen_ticket",
    )
    async def reopen(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(ReopenModal(self))

    @ui.button(
        label="Delete",
        style=discord.ButtonStyle.danger,
        emoji="🗑️",
        custom_id="delete_ticket",
    )
    async def delete(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(DeleteModal())


class CloseModal(ui.Modal, title="Close Ticket"):
    reason = ui.TextInput(
        label="Reason for closing?", style=discord.TextStyle.paragraph, required=True
    )

    def __init__(self, view: TicketActionView):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        self.view.update_buttons("closed")
        channel = interaction.channel

        embed = interaction.message.embeds[0]
        embed.color = discord.Color.red()
        embed.set_field_at(2, name="🔴 Status", value="Closed")
        embed.add_field(name="📝 Close Reason", value=str(self.reason))

        await interaction.message.edit(embed=embed, view=self.view)

        if channel.name.startswith("ticket-"):
            await channel.edit(name=f"closed-{channel.name[7:]}")

        await log_ticket_action(
            interaction, "close", discord.Color.red(), channel, str(self.reason)
        )
        await interaction.followup.send(
            f"✅ Ticket closed! Reason: {self.reason}", ephemeral=True
        )


class ReopenModal(ui.Modal, title="Reopen Ticket"):
    reason = ui.TextInput(
        label="Why are you reopening this ticket?",
        style=discord.TextStyle.paragraph,
        required=True,
    )

    def __init__(self, view: TicketActionView):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        self.view.update_buttons("reopened")
        channel = interaction.channel

        embed = interaction.message.embeds[0]
        embed.color = discord.Color.green()
        embed.set_field_at(2, name="🟡 Status", value="Reopened")
        embed.add_field(name="📝 Reopen Reason", value=str(self.reason))

        await interaction.message.edit(embed=embed, view=self.view)

        if channel.name.startswith("closed-"):
            await channel.edit(name=f"ticket-{channel.name[7:]}")

        await log_ticket_action(
            interaction, "reopen", discord.Color.green(), channel, str(self.reason)
        )
        await interaction.followup.send(
            f"✅ Ticket reopened! Reason: {self.reason}", ephemeral=True
        )


class DeleteModal(ui.Modal, title="Delete Ticket"):
    reason = ui.TextInput(
        label="Reason for deleting?", style=discord.TextStyle.paragraph, required=True
    )

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        channel = interaction.channel
        await log_ticket_action(
            interaction, "delete", discord.Color.red(), channel, str(self.reason)
        )
        await channel.send(
            f"🗑️ Ticket deleted by {interaction.user.mention}. Reason: {self.reason}"
        )
        await channel.delete()


async def log_ticket_action(
    interaction: discord.Interaction,
    action: str,
    color: discord.Color,
    channel: discord.TextChannel,
    reason: str = None,
):
    log_channel = interaction.guild.get_channel(TICKET_LOG_CHANNEL_ID)
    if not log_channel:
        return

    action_emojis = {
        "claim": "🎟️ Claimed",
        "close": "🔒 Closed",
        "reopen": "🔓 Reopened",
        "delete": "🗑️ Deleted",
        "create": "🎫 Created",
    }

    embed = discord.Embed(color=color, timestamp=discord.utils.utcnow())
    embed.set_author(
        name=f"Ticket {action_emojis.get(action, action)}",
        icon_url=interaction.user.display_avatar.url,
    )
    embed.add_field(
        name="👤 Moderator",
        value=f"{interaction.user.mention}\n`{interaction.user}`",
        inline=True,
    )
    embed.add_field(name="📂 Channel", value=f"`{channel.name}`", inline=True)
    embed.set_footer(text="Hyperland Network • Ticket Logs")

    if reason:
        embed.add_field(name="📝 Reason", value=reason, inline=False)

    await log_channel.send(embed=embed)


class Tickets(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        await self.show_support_ticket()

    async def show_support_ticket(self):
        from config import GUILD_ID

        TICKET_CHANNEL_ID = 1472504353964298373
        guild = self.bot.get_guild(GUILD_ID)
        if not guild:
            return

        channel = guild.get_channel(TICKET_CHANNEL_ID)
        if not channel:
            return

        embed = discord.Embed(
            title="🎫 Support Tickets",
            description="Need help? Create a ticket and our staff will assist you!",
            color=discord.Color.blurple(),
        )

        stored_id = get_stored_ticket_message_id()
        if stored_id:
            try:
                message = await channel.fetch_message(stored_id)
                await message.edit(embed=embed, view=TicketView())
                print("Ticket message updated (by stored ID).")
                return
            except:
                print("Stored ticket message not found, creating new one.")

        messages = await channel.history(limit=20).flatten()
        old_messages = [
            m
            for m in messages
            if m.author == self.bot.user
            and m.embeds
            and m.embeds[0].title
            and "Support Tickets" in m.embeds[0].title
        ]
        if old_messages:
            await channel.delete_messages(old_messages)

        message = await channel.send(embed=embed, view=TicketView())
        store_ticket_message_id(message.id)
        print("New ticket message sent.")


async def setup(bot):
    await bot.add_cog(Tickets(bot))
