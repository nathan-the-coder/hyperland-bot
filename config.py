import os
from dotenv import load_dotenv

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = int(os.getenv("DISCORD_GUILD_ID", 0))
TICKET_LOG_CHANNEL_ID = int(os.getenv("TICKET_LOG_CHANNEL_ID", 0))
STAFF_ROLE_ID = (
    int(os.getenv("STAFF_ROLE_ID", 0)) if os.getenv("STAFF_ROLE_ID") else None
)
TICKET_CATEGORY_ID = int(os.getenv("TICKET_CATEGORY_ID", "1472502858443133045"))

MC_IP = os.getenv("MC_IP", "hyperlandsnetwork.playmc.cloud")
MC_PORT = int(os.getenv("MC_PORT", 25585))
