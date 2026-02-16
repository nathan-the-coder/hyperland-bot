const { Events, EmbedBuilder, ChannelType, TextDisplayBuilder } = require('discord.js');
const actions = require('../utils/ticket_actions');
const { getServerStatus } = require('../utils/mcServer');

const PREFIX = '!'; // Your ticket prefix
const ALT_PREFIX = '.'; // Your status/say prefix
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

module.exports = {
    name: Events.MessageCreate,
    async execute(msg) {
        if (msg.author.bot) return;

        const content = msg.content.toLowerCase();

        // 1. Handle Hyperland Status (.hln)
        if (content === '.hln') {
            try {
                const status = await getServerStatus();
                // ... (Your existing status logic is fine here)
                const embed = new EmbedBuilder().setTitle('Hyperland Status').setColor(0x55FF55); 
                return await msg.reply({ embeds: [embed] });
            } catch (e) { return console.error(e); }
        }

        // 2. Handle Say Command (.say #channel <message>)
        if (content.startsWith('.say')) {
            const args = msg.content.split(' '); // Split by space
            const targetChannel = msg.mentions.channels.first();
            const messageText = args.slice(2).join(' '); // Skip ".say" and "#channel"

            if (!targetChannel || !messageText) {
                return msg.reply("Usage: `.say #channel My message here` Paisano!");
            }
			
            try {
                await targetChannel.send({ content: messageText });
                return await msg.reply(`✅ Message sent to ${targetChannel}`);
            } catch (e) {
                return msg.reply("I don't have permission to post there.");
            }
        }

        // 3. Handle Ticket Commands (!command)
        if (msg.content.startsWith(PREFIX)) {
            if (!msg.channel.name.startsWith('ticket-')) return;

            const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();
            const isStaff = msg.member.roles.cache.has(STAFF_ROLE_ID);

            const staffOnly = ['close', 'add', 'remove', 'claim', 'rename', 'transcript', 'delete'];
            if (staffOnly.includes(cmd) && !isStaff) return msg.reply('❌ Staff only.');

            try {
                // Your existing ticket logic...
                if (cmd === 'new') await actions.new(msg.guild, msg.author, args.join(' '));
                // ... etc
            } catch (error) {
                console.error(error);
                await msg.reply('Error executing ticket command.');
            }
        }
    },
};