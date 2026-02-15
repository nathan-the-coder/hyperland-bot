const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv/config');
const fs = require('fs');
const path = require('path');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
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

client.login(process.env.DISCORD_TOKEN);
