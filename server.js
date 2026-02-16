const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv/config');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hyperland Bot is running!');
});

server.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});

if (process.env.DEPLOY_COMMANDS === 'true') {
    require('./deploy-commands.js');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
    makeCache: (name) => {
        if (name === 'MessageManager' || name === 'GuildMemberManager') {
            return new Collection({ maxSize: 10 });
        }
        if (name === 'PresenceManager' || name === 'VoiceStateManager') {
            return new Collection({ maxSize: 0 });
        }
        return null;
    },
    sweepers: {
        messages: { interval: 300, filter: () => msg => Date.now() - msg.createdTimestamp > 300000 },
        users: { interval: 300, filter: () => user => Date.now() - user.createdTimestamp > 300000 }
    }
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandItems = fs.readdirSync(commandsPath);

for (const item of commandItems) {
    const itemPath = path.join(commandsPath, item);

    if (fs.lstatSync(itemPath).isDirectory()) {
        const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(itemPath, file);
            loadCommand(filePath);
        }
    }
    else if (item.endsWith('.js')) {
        loadCommand(itemPath);
    }
}

function loadCommand(filePath) {
    let command = require(filePath);

    if (command.default) command = command.default;

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" properties.`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

client.login(process.env.DISCORD_TOKEN);
