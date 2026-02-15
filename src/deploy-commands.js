const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../config.json');
const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const commandItems = fs.readdirSync(commandsPath);
const commands = [];

for (const item of commandItems) {
    const itemPath = path.join(commandsPath, item);
    
    if (fs.lstatSync(itemPath).isDirectory()) {
        const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(itemPath, file);
            loadCommand(filePath);
        }
    } else if (item.endsWith('.js')) {
        loadCommand(itemPath);
    }
}

function loadCommand(filePath) {
    let command = require(filePath);
    if (command.default) command = command.default;

    // Check if the file exports an array (like your ticket.js) or a single object
    const commandData = Array.isArray(command.data) ? command.data : [command.data];

    for (const data of commandData) {
        if (data && (data.name || (data.toJSON && data.toJSON().name))) {
            // Only call toJSON() if it's a Builder instance; otherwise use as is
            commands.push(typeof data.toJSON === 'function' ? data.toJSON() : data);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
        }
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Registering ${commands.length} slash commands...`);
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();
