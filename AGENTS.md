# AGENTS.md - Hyperland Bot Developer Guide

## Overview

A Discord bot for Hyperland Network that manages server status, tickets, and Discord integration. Built with discord.py 2.x and Python 3.10+.

## Project Structure

```
.
├── main.py                # Main entry point
├── config.py              # Environment configuration
├── requirements.txt       # Python dependencies
├── cogs/
│   ├── commands.py        # Slash commands (/hln, /ip, /setup)
│   ├── tickets.py         # Ticket system with buttons/modals
│   └── events.py          # Event handlers, stats updates
├── utils/
│   ├── __init__.py
│   └── mc_server.py       # Minecraft server ping with caching
└── .env                   # Environment variables (tokens, IPs)
```

## Commands

| Command | Description |
|---------|-------------|
| `python main.py` | Start the bot |
| `pip install -r requirements.txt` | Install dependencies |

## Code Style Guidelines

### General Conventions

- **Language**: Python 3.10+
- **Indentation**: 4 spaces
- **Line length**: Keep lines under 120 characters when reasonable
- **Type hints**: Use where helpful

### File Organization

```python
# 1. Standard library imports
import os
import json
import asyncio

# 2. External imports
import discord
from discord import app_commands
from discord.ext import commands

# 3. Local imports
from config import MC_IP, MC_PORT
from utils.mc_server import get_server_status

# 4. Class/function definitions
class MyCog(commands.Cog):
    pass

# 5. Setup function
async def setup(bot):
    await bot.add_cog(MyCog(bot))
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | snake_case | `mc_server.py`, `ticket_actions.py` |
| Classes | PascalCase | `TicketView`, `Commands` |
| Functions | snake_case | `get_server_status()`, `clear_cache()` |
| Constants | UPPER_SNAKE_CASE | `CACHE_TTL`, `TICKET_CHANNEL_ID` |
| Variables | snake_case | `player_list`, `embed` |

### Slash Commands

```python
@app_commands.command(name="command-name", description="Description")
async def command_name(self, interaction: discord.Interaction):
    await interaction.response.defer()
    try:
        # logic
        await interaction.followup.send(embed=embed)
    except Exception as e:
        print(f"Error: {e}")
        await interaction.followup.send("An error occurred.")
```

### Buttons and Views

```python
class MyView(ui.View):
    def __init__(self):
        super().__init__(timeout=None)
    
    @ui.button(label='Click Me', style=discord.ButtonStyle.primary, custom_id='my_button')
    async def click_me(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_message("Clicked!", ephemeral=True)
```

### Error Handling

- Always wrap async operations in try/except
- Log errors with `print()` or logging module
- Always respond to interactions on error
- Use graceful degradation (e.g., cached server status on ping failure)

### Environment Variables

Store sensitive data in `.env` (never commit):

```
DISCORD_TOKEN=your_token
DISCORD_GUILD_ID=123456789
MC_IP=server.ip.here
MC_PORT=25585
STAFF_ROLE_ID=role_id
TICKET_LOG_CHANNEL_ID=channel_id
TICKET_CATEGORY_ID=category_id
```

## Common Patterns

### Server Status with Caching

```python
CACHE_TTL = 60
_cache = {"data": None, "timestamp": 0}

async def get_server_status(force_refresh: bool = False) -> dict:
    now = time.time()
    if not force_refresh and _cache["data"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["data"]
    # fetch fresh data
    _cache["data"] = result
    _cache["timestamp"] = now
    return result
```

### Checking Permissions

```python
@app_commands.checks.has_permissions(administrator=True)
async def setup(self, interaction: discord.Interaction):
    # admin only command
    pass
```

### Deferred Replies

Always defer before long operations:

```python
await interaction.response.defer()
# ... long operation
await interaction.followup.send("Done!")
```
