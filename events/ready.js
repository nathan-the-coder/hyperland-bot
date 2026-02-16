const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { guildId } = require('../config.json');
const { getServerStatus, clearCache } = require('../utils/mcServer.js');

async function showSupportTicket(client) {
    const TICKET_CHANNEL_ID = '1472504353964298373';
    const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription('Need help? Create a ticket and our staff will assist you!')
        .setColor('Blurple');

    const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');

    const row = new ActionRowBuilder().addComponents(button);

    const messages = await channel.messages.fetch({ limit: 10 });
    const existingTicket = messages.find(m => m.author.id === client.user.id);

    if (existingTicket) {
        // EDIT instead of DELETE/SEND. This keeps the original timestamp!
        await existingTicket.edit({ embeds: [embed], components: [row] });
        console.log("Ticket message updated (edited).");
    } else {
        // Only delete and send if the bot's message is missing
        if (messages.size > 0) await channel.bulkDelete(messages);
        await channel.send({ embeds: [embed], components: [row] });
        console.log("New ticket message sent.");
    }
}

const CHANNELS = {
	MEMBERS: '1472544108995154071',
	PLAYERS: '1472546850270875776',
	IP: '1472547148389154937',
};

async function updateStats(client) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) return;

	try {
		const memberCount = guild.memberCount;
		const memberChannel = guild.channels.cache.get(CHANNELS.MEMBERS);
		if (memberChannel) await memberChannel.setName(`👥 Members: ${memberCount.toLocaleString()}`);

		const serverStatus = await getServerStatus();

		const playerChannel = guild.channels.cache.get(CHANNELS.PLAYERS);
		if (playerChannel) {
			const onlinePlayers = serverStatus?.players ?? 0;
			await playerChannel.setName(`🎮 Players: ${onlinePlayers}`);
		}

		const ipChannel = guild.channels.cache.get(CHANNELS.IP);
		if (ipChannel) {
			const ip = process.env.MC_IP || 'Soon';
			await ipChannel.setName(`🔗 IP: ${ip}`);
		}
	} catch (error) {
		console.error('Error updating stats:', error.message);
	}
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		await showSupportTicket(client);

		setInterval(() => {
			updateStats(client);
			clearCache();
		}, 600000);

		setInterval(() => {
			if (global.gc) global.gc();
			const mem = process.memoryUsage();
			console.log(`Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
		}, 300000);

		await updateStats(client);
	},
};
