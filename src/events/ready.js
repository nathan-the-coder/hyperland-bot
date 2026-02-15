const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { guildId } = require('../../config.json');
const { getServerStatus } = require('../utils/mcServer.js');

async function showSupportTicket(client) {
	const TICKET_CHANNEL_ID = '1472504353964298373';
	const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

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

	const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
	if (channel) {
		const messages = await channel.messages.fetch();
		if (messages.size > 0) {
			await channel.bulkDelete(messages);
		}
		await channel.send({ embeds: [embed], components: [row] });
	}
}

// async function showServerInfo(client) {
// 	const SERVER_INFO_CHANNEL_ID = '1472424023932665937';

// 	const embed = new EmbedBuilder()
// 		.setTitle('ℹ️ Server Information')
// 		.setDescription('')
// }

const CHANNELS = {
	MEMBERS: '1472544108995154071',
	PLAYERS: '1472546850270875776',
	IP: '1472547148389154937',
};


async function updateStats(client) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) return;

	// 1. Update Member Count
	const memberCount = guild.memberCount;
	const memberChannel = guild.channels.cache.get(CHANNELS.MEMBERS);
	if (memberChannel) await memberChannel.setName(`👥 Members: ${memberCount.toLocaleString()}`);

	// Fetch Server Status
	const serverStatus = await getServerStatus();

	// 2. Update Minecraft Players
	const playerChannel = guild.channels.cache.get(CHANNELS.PLAYERS);
	if (playerChannel) {
		// If server is offline or online is undefined, it defaults to 0
		const onlinePlayers = serverStatus?.players?.online ?? 0;
		await playerChannel.setName(`🎮 Players: ${onlinePlayers}`);
	}

	// 3. Update IP Channel
	const ipChannel = guild.channels.cache.get(CHANNELS.IP);
	if (ipChannel) {
		// Falls back to a default IP if the environment variable is missing
		const ip = process.env.MC_IP || 'hyperland.mcpro.io';
		await ipChannel.setName(`🔗 IP: ${ip}`);
	}
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		await showSupportTicket(client);

		setInterval(updateStats, 600000);
		updateStats(client);
	},
};