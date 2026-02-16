const { Events, EmbedBuilder } = require('discord.js');
const actions = require('../utils/ticket_actions');
const { getServerStatus } = require('../utils/mcServer');
const PREFIX = '!';
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

module.exports = {
	name: Events.MessageCreate,
	async execute(msg) {
		// Handle .hln prefix command (works in any channel)
		if (!msg.author.bot) {

		if (msg.content.toLowerCase() === '.hln') {
			try {
				const status = await getServerStatus();

			const playerList = (status?.sample && status.sample.length > 0) 
				? status.sample.map(p => p.name).join('\n') 
				: 'None';

				const playerHeader = `Online Players (${status.players || 0}/${status?.maxPlayers || 100})`;

				const embed = new EmbedBuilder()
					.setTitle('Hyperland Status')
					.setColor(0x55FF55)
					.addFields(
						{ name: '**Server Info**', value: '**IP: hyperlandnetwork.play.hosting**\n**PORT: 20951**' },
						{ name: 'Version', value: status?.version || '1.21.x', inline: true },
						{ name: 'Server Status', value: status?.online ? '🟢 Online' : '🔴 Offline', inline: true },
						{ name: playerHeader, value: playerList, inline: false }
					)
					.setTimestamp();

				await msg.reply({ embeds: [embed] });
			} catch (error) {
				console.error(error);
				await msg.reply('Error fetching server status.');
			}
			return;
		}
		}

		// Ticket prefix commands (only in ticket channels)
		if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
		if (!msg.channel.name.startsWith('ticket-')) return;

		const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
		const cmd = args.shift().toLowerCase();
		const isStaff = msg.member.roles.cache.has(STAFF_ROLE_ID);

		const staffOnly = ['close', 'add', 'remove', 'claim', 'rename', 'transcript', 'delete'];
		if (staffOnly.includes(cmd) && !isStaff) return msg.reply('❌ Staff only.');

		try {
			if (cmd === 'new') await actions.new(msg.guild, msg.author, args.join(' '));
			if (cmd === 'help') await msg.channel.send({ embeds: [actions.help()] });
			if (cmd === 'close') await msg.channel.send(await actions.close(msg.channel));
			if (cmd === 'add') await msg.channel.send(await actions.add(msg.channel, msg.mentions.users.first()));
			if (cmd === 'remove') await msg.channel.send(await actions.remove(msg.channel, msg.mentions.users.first()));
			if (cmd === 'claim') await msg.channel.send(await actions.claim(msg.channel, msg.author));
			if (cmd === 'rename') await msg.channel.send(await actions.rename(msg.channel, args[0]));
			if (cmd === 'transcript') await msg.channel.send(actions.transcript());
			if (cmd === 'delete') await actions.delete(msg.channel);
		} catch (error) {
			console.error(error);
			await msg.reply('Error executing command.');
		}
	},
};
