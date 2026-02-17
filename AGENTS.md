# AGENTS.md - Hyperland Bot Developer Guide

## Overview

A Discord bot for Hyperland Network that manages server status, tickets, and Discord integration. Built with discord.js v14, Node.js, and uses CommonJS modules.

## Project Structure

```
.
├── server.js              # Main entry point, client setup, command/event loading
├── deploy-commands.js    # Slash command deployment
├── config.json           # Bot configuration (guild IDs)
├── package.json
├── eslint.config.js
├── commands/
│   └── minecraft/        # Discord slash commands
│       ├── svstat.js
│       ├── online.js
│       ├── ip.js
│       ├── setup.js
│       ├── ticket.js
│       ├── announce.js
│       └── say.js
├── events/               # Discord event handlers
│   ├── ready.js          # Client ready, stats updates, ticket message
│   ├── messageCreate.js  # Message commands (.hln, .say, !ticket)
│   └── interactionsCreate.js
├── utils/
│   ├── mcServer.js       # Minecraft server ping with caching
│   ├── ticket_actions.js
│   └── announcement.js
└── .env                  # Environment variables (tokens, IPs)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the bot (runs server.js) |
| `npm run deploy` | Deploy slash commands to Discord |
| `npx eslint .` | Run ESLint on all files |

### Running a Single Test

There are no tests defined in this project. To add tests, install a testing framework like Jest:

```bash
npm install --save-dev jest
```

Then add to package.json:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Code Style Guidelines

### General Conventions

- **Language**: JavaScript (Node.js) with CommonJS (`require`/`module.exports`)
- **Indentation**: 4 spaces (consistent with codebase)
- **Semicolons**: Use at end of statements (preferred for consistency)
- **Line length**: Keep lines under 120 characters when reasonable

### File Organization

```javascript
// 1. External imports (discord.js, node built-ins)
const { Client, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 2. Local imports (utils, config)
const { getServerStatus } = require('../utils/mcServer');
const { guildId } = require('../config.json');

// 3. Module exports at bottom of file
module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // implementation
    },
};
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `mcServer.js`, `ticket-actions.js` |
| Commands | lowercase | `svstat.js`, `online.js` |
| Functions | camelCase | `getServerStatus()`, `clearCache()` |
| Constants | UPPER_SNAKE_CASE | `CACHE_TTL`, `PREFIX` |
| Discord IDs | Uppercase with suffix | `TICKET_CHANNEL_ID`, `STAFF_ROLE_ID` |

### Slash Commands

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('command-name')
        .setDescription('Description'),
    
    async execute(interaction) {
        await interaction.deferReply();
        try {
            // logic
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Error message.');
        }
    },
};
```

### Event Handlers

```javascript
const { Events } = require('discord.js');

module.exports = {
    name: Events.EventName,
    once: true,  // optional: set true for 'once' events
    async execute(...args, client) {
        // args depend on event, client passed as last arg
    },
};
```

### Error Handling

- Always wrap async operations in try/catch
- Log errors with `console.error(error)`
- Always reply to interactions on error (deferReply first if needed)
- Use graceful degradation (e.g., cached server status on ping failure)

```javascript
async execute(interaction) {
    await interaction.deferReply();
    try {
        const result = await someAsyncOperation();
        await interaction.editReply(result);
    } catch (error) {
        console.error(error);
        await interaction.editReply('An error occurred.');
    }
}
```

### Discord.js Patterns

- Use `EmbedBuilder` for rich embeds
- Use `ActionRowBuilder` + `ButtonBuilder` for buttons
- Always check if channel/user exists before interacting
- Use partials when needed: `partials: [Partials.Channel]`
- Cache management via `makeCache` and `sweepers` options in Client

### Environment Variables

Store sensitive data in `.env` (never commit):

```
DISCORD_TOKEN=your_token
MC_IP=server.ip.here
STAFF_ROLE_ID=role_id
PORT=3000
DEPLOY_COMMANDS=true
```

### Linting

ESLint is configured with recommended rules. Run before commits:

```bash
npx eslint .
```

The config disables `no-undef` and `no-unused-vars` for flexibility.

## Common Patterns

### Server Status with Caching

```javascript
const CACHE_TTL = 60000;
let cache = { data: null, timestamp: 0 };

async function getData(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cache.data && (now - cache.timestamp) < CACHE_TTL) {
        return cache.data;
    }
    // fetch fresh data
    cache = { data: result, timestamp: now };
    return result;
}
```

### Checking Permissions

```javascript
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID);
if (!isStaff) return message.reply('Staff only.');
```

### Deferred Replies

Always defer before long operations:

```javascript
await interaction.deferReply();
// ... long operation
await interaction.editReply({ content: 'Done!' });
```
