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

    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" properties.`);
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
