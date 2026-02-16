const { EmbedBuilder, OverwriteType, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const TICKET_CATEGORY_ID = '1472502858443133045';
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

function createReasonModal(customId, title, label) {
	const modal = new ModalBuilder()
		.setCustomId(customId)
		.setTitle(title);

	const reasonInput = new TextInputBuilder()
		.setCustomId('reason')
		.setLabel(label)
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true);

	modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
	return modal;
}

function createTicketButtons(action) {
	const baseButtons = {
		claim: { emoji: '🎟️', style: ButtonStyle.Primary },
		close: { emoji: '🔒', style: ButtonStyle.Secondary },
		reopen: { emoji: '🔓', style: ButtonStyle.Success },
		delete: { emoji: '🗑️', style: ButtonStyle.Danger },
	};

	const states = {
		open: { claim: false, close: false, reopen: true, delete: false },
		claimed: { claim: true, close: false, reopen: true, delete: false },
		closed: { claim: true, close: true, reopen: false, delete: false },
		reopened: { claim: false, close: false, reopen: true, delete: false },
	};

	const state = states[action] || states.open;

	const buttons = {
		claim: new ButtonBuilder()
			.setCustomId('claim_ticket')
			.setLabel('Claim')
			.setEmoji(baseButtons.claim.emoji)
			.setStyle(baseButtons.claim.style)
			.setDisabled(state.claim),

		close: new ButtonBuilder()
			.setCustomId('close_ticket')
			.setLabel('Close')
			.setEmoji(baseButtons.close.emoji)
			.setStyle(baseButtons.close.style)
			.setDisabled(state.close),

		reopen: new ButtonBuilder()
			.setCustomId('reopen_ticket')
			.setLabel('Reopen')
			.setEmoji(baseButtons.reopen.emoji)
			.setStyle(baseButtons.reopen.style)
			.setDisabled(state.reopen),

		delete: new ButtonBuilder()
			.setCustomId('delete_ticket')
			.setLabel('Delete')
			.setEmoji(baseButtons.delete.emoji)
			.setStyle(baseButtons.delete.style)
			.setDisabled(state.delete),
	};

	return [
		new ActionRowBuilder().addComponents([buttons.claim, buttons.close]),
		new ActionRowBuilder().addComponents([buttons.reopen, buttons.delete]),
	];
}

async function updateTicketMessage(channel, updates) {
	const fetchedMessages = await channel.messages.fetch({ limit: 10 });
	const ticketMessage = fetchedMessages.find(m => m.embeds[0]?.title?.includes('Ticket'));

	if (!ticketMessage) return null;

	const oldEmbed = ticketMessage.embeds[0];
	const newEmbed = new EmbedBuilder(oldEmbed)
		.setColor(updates.color)
		.spliceFields(2, 1, { name: updates.statusField.name, value: updates.statusField.value, inline: false });

	if (updates.reasonField) {
		newEmbed.addFields(updates.reasonField);
	}

	await ticketMessage.edit({ embeds: [newEmbed], components: updates.components });
	return ticketMessage;
}

async function logTicketAction(interaction, color, channel) {
	const logChannel = interaction.guild.channels.cache.get(process.env.TICKET_LOG_CHANNEL_ID);

	// Create log embed
	const logEmbed = new EmbedBuilder()
		.setTitle('Ticket Action')
		.setColor(color)
		.addFields(
			{ name: 'Action', value: 'claim/close/reopen/delete' },
			{ name: 'User', value: interaction.user.tag },
			{ name: 'Channel', value: channel.name }
		);

	// Send to log channel
	if (logChannel) await logChannel.send({ embeds: [logEmbed] });
}

const ticketActions = {
	claim: {
		handler: async (interaction) => {
			const channel = interaction.channel;
			const user = interaction.user;
			const color = 0xFFA500;

			await updateTicketMessage(channel, {
				color: color,
				statusField: { name: '⏳ Status', value: `Claimed by ${user}` },
				components: createTicketButtons('claimed'),
			});

			logTicketAction(interaction, color, channel);

			await interaction.reply({ content: `✅ Ticket claimed by ${user}!` });
		},
	},
	close: {
		modal: () => createReasonModal('close_reason_modal', 'Close Ticket', 'Reason for closing?'),
		handler: async (interaction) => {
			const reason = interaction.fields.getTextInputValue('reason');
			const channel = interaction.channel;
			const color = 0xFF0000;
			await updateTicketMessage(channel, {
				color: color,
				statusField: { name: '🔴 Status', value: 'Closed' },
				reasonField: { name: '📝 Close Reason', value: reason },
				components: createTicketButtons('closed'),
			});

			
			if (channel.name.startsWith('ticket-')) {
				await channel.setName(`closed-${channel.name.slice(7)}`);
			}

			logTicketAction(interaction, color, channel);

			await interaction.editReply({ content: `✅ Ticket closed! Reason: ${reason}` });
		},
	},
	reopen: {
		modal: () => createReasonModal('reopen_reason_modal', 'Reopen Ticket', 'Why are you reopening this ticket?'),
		handler: async (interaction) => {
			const reason = interaction.fields.getTextInputValue('reason');
			const channel = interaction.channel;
			const color = 0xFFA500;
			
			await updateTicketMessage(channel, {
				color: 0xFFA500,
				statusField: { name: '🟡 Status', value: 'Reopened' },
				reasonField: { name: '📝 Reopen Reason', value: reason },
				components: createTicketButtons('reopened'),
			});
			
			if (channel.name.startsWith('closed-')) {
				await channel.setName(`ticket-${channel.name.slice(7)}`);
			}

			logTicketAction(interaction, color, channel);

			await interaction.editReply({ content: `✅ Ticket reopened! Reason: ${reason}` });
		},
	},
	delete: {
		modal: () => createReasonModal('delete_reason_modal', 'Delete Ticket', 'Reason for deleting?'),
		handler: async (interaction) => {
			const reason = interaction.fields.getTextInputValue('reason');
			const channel = interaction.channel;
			const user = interaction.user;

			logTicketAction(interaction, 0xFF0000, channel);

			await channel.send(`🗑️ Ticket deleted by ${user}. Reason: ${reason}`);
			await channel.delete();
		},
	},
};

module.exports = {
	name: 'interactionCreate',
	async execute(interaction, client) {
		if (interaction.isButton()) {
			const channel = interaction.channel;
			const ticketButtons = ['claim_ticket', 'close_ticket', 'reopen_ticket', 'delete_ticket'];

			if (interaction.customId === 'create_ticket') {
				const modal = createReasonModal('ticket_reason_modal', 'Create Ticket', 'What do you need help with?');
				await interaction.showModal(modal);
				return;
			}

			if (ticketButtons.includes(interaction.customId)) {
				if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('closed-')) {
					await interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
					return;
				}
				const action = interaction.customId.replace('_ticket', '');
				
				if (action === 'claim') {
					await ticketActions.claim.handler(interaction);
				} else {
					const modal = ticketActions[action].modal();
					await interaction.showModal(modal);
				}
				return;
			}
		}

		if (interaction.isModalSubmit()) {
			if (interaction.customId === 'ticket_reason_modal') {
				await interaction.deferReply({ ephemeral: true });

				const reason = interaction.fields.getTextInputValue('reason');
				const { guild, user } = interaction;
				const fetchedGuild = await guild.fetch();

				const permissionOverwrites = [
					{ id: guild.id, type: OverwriteType.Role, deny: [PermissionsBitField.Flags.ViewChannel] },
					{ id: user.id, type: OverwriteType.Member, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
					{ id: fetchedGuild.ownerId, type: OverwriteType.Member, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
				];

				if (STAFF_ROLE_ID) {
					permissionOverwrites.push({ id: STAFF_ROLE_ID, type: OverwriteType.Role, allow: ['ViewChannel', 'SendMessages'] });
				}

				const channel = await guild.channels.create({
					name: `ticket-${user.username}`,
					type: 0,
					parent: TICKET_CATEGORY_ID,
					permissionOverwrites,
				});

				const embed = new EmbedBuilder()
					.setTitle('🎫 Ticket Opened')
					.setColor('Green')
					.addFields(
						{ name: '👤 Requester', value: `${user}`, inline: true },
						{ name: '📝 Reason', value: `${reason || 'None provided'}`, inline: true },
						{ name: '⏳ Status', value: 'Awaiting Staff...', inline: false },
					)
					.setFooter({ text: 'Hyperland Network • Support System' })
					.setTimestamp();

				const staffMention = STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : '';
				await channel.send({
					content: `${user} ${staffMention}`.trim(),
					embeds: [embed],
					components: createTicketButtons('open'),
				});

				await interaction.editReply({ content: `Ticket created: ${channel}` });
				return;
			}

			const actionKey = Object.keys(ticketActions).find(key => interaction.customId === `${key}_reason_modal`);
			if (actionKey) {
				await interaction.deferReply({ ephemeral: true });
				await ticketActions[actionKey].handler(interaction);
				return;
			}
		}

		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			const ticketSubcommands = ['close', 'add', 'remove', 'claim', 'rename', 'transcript', 'delete'];
			const sub = interaction.options.getSubcommand(false);

			if (interaction.commandName === 'ticket' && ticketSubcommands.includes(sub)) {
				const channel = interaction.channel;
				const isInCategory = channel.parentId === TICKET_CATEGORY_ID;
				const hasTicketPrefix = channel.name.startsWith('ticket-');

				if (!isInCategory && !hasTicketPrefix) {
					return interaction.reply({
						content: '❌ This command can only be used inside an active ticket channel.',
						ephemeral: true,
					});
				}
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				await interaction.reply({
					content: 'There was an error while executing this command!',
					ephemeral: true,
				});
			}
		}
	},
};
