const { Events } = require("discord.js");
const actions = require('../utils/ticket_actions.js');
const PREFIX = '!';

module.exports = {
    name: 'messageCreate',
    async execute(msg) {
        if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
        
        // CHECK: Is this a ticket channel?
        if (!msg.channel.name.startsWith('ticket-')) return;

        // If it is a cticket, treat every message like a potential command
        if (!msg.content.startsWith(PREFIX)) return;

        const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();
        const isStaff = msg.member.roles.cache.has(STAFF_ROLE_ID);

        const staffOnly = ['close', 'add', 'remove', 'claim', 'rename', 'transcript', 'delete'];
        if (staffOnly.includes(cmd) && !isStaff) return msg.reply('❌ Staff only.');

        if (cmd === 'new') await actions.new(msg.guild, msg.author, args.join(' '));
        if (cmd === 'help') await msg.channel.send({ embeds: [actions.help()] });
        if (cmd === 'close') await actions.close(msg.channel);
        if (cmd === 'add') await msg.channel.send(await actions.add(msg.channel, msg.mentions.users.first()));
        if (cmd === 'remove') await msg.channel.send(await actions.remove(msg.channel, msg.mentions.users.first()));
        if (cmd === 'claim') await msg.channel.send(await actions.claim(msg.channel, msg.author));
        if (cmd === 'rename') await msg.channel.send(await actions.rename(msg.channel, args[0]));
        if (cmd === 'transcript') await msg.channel.send(actions.transcript());
        if (cmd === 'delete') await actions.delete(msg.channel);

    }
}