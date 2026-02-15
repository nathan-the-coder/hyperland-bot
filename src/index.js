const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv/config');
const { clientId, guildId, token } = require('../config.json');
const fs = require('fs');
const path = require('path');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandItems = fs.readdirSync(commandsPath);
const commands = [];

for (const item of commandItems) {
    const itemPath = path.join(commandsPath, item);
    
    // 2. Check if the item is a directory (like /minecraft)
    if (fs.lstatSync(itemPath).isDirectory()) {
        const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(itemPath, file);
            loadCommand(filePath);
        }
    } else if (item.endsWith('.js')) {
        // 3. Handle files sitting directly in /commands/
        loadCommand(itemPath);
    }
}

// Helper function to handle the .default logic we discussed
function loadCommand(filePath) {
    let command = require(filePath);
    
    // Unwraps the .default if you use ESM-style exports
    if (command.default) command = command.default;

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" properties.`);
    }
}


const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
        });
    }
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);
