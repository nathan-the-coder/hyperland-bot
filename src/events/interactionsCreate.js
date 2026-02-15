const { EmbedBuilder, OverwriteType, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction, client) {
		// Handle button interactions
		if (interaction.isButton() && interaction.customId === 'create_ticket') {
			const modal = new ModalBuilder()
				.setCustomId('ticket_reason_modal')
				.setTitle('Create Ticket');

			const reasonInput = new TextInputBuilder()
				.setCustomId('reason')
				.setLabel('What do you need help with?')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
			await interaction.showModal(modal);
			return;
		}

		// Handle modal submission
		if (interaction.isModalSubmit() && interaction.customId === 'ticket_reason_modal') {
			await interaction.deferReply({ ephemeral: true });

			const reason = interaction.fields.getTextInputValue('reason');
			const { guild, user } = interaction;
			const staffRoleId = process.env.STAFF_ROLE_ID;

			const fetchedGuild = await guild.fetch();

			const permissionOverwrites = [
				{
					id: guild.id,
					type: OverwriteType.Role,
					deny: [PermissionsBitField.Flags.ViewChannel],
				},
				{
					id: user.id,
					type: OverwriteType.Member,
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
				},
				{
					id: fetchedGuild.ownerId,
					type: OverwriteType.Member,
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
				},
			];


			if (staffRoleId) {
				permissionOverwrites.push({ id: staffRoleId, type: OverwriteType.Role, allow: ['ViewChannel', 'SendMessages'] });
			}

			const channel = await guild.channels.create({
				name: `ticket-${user.username}`,
				type: 0,
				parent: '1472502858443133045',
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


			const claim_button = new ButtonBuilder()
				.setCustomId('claim_ticket')
				.setLabel('Claim')
				.setEmoji('🎟️')
				.setStyle(ButtonStyle.Primary);

			const close_button = new ButtonBuilder()
				.setCustomId('close_ticket')
				.setLabel('Close')
				.setEmoji('🔒')
				.setStyle(ButtonStyle.Secondary)
				;

			const reopen_button = new ButtonBuilder()
				.setCustomId('reopen_ticket')
				.setLabel('Reopen')
				.setEmoji('🔓')
				.setDisabled(true)
				.setStyle(ButtonStyle.Success);

			const delete_button = new ButtonBuilder()
				.setCustomId('delete_ticket')
				.setLabel('Delete')
				.setEmoji('🗑️')
				.setStyle(ButtonStyle.Danger);

			const staffMention = staffRoleId ? `<@&${staffRoleId}>` : '';
			await channel.send({
				content: `${user} ${staffMention}`.trim(), embeds: [embed], components: [
					new ActionRowBuilder()
						.addComponents([claim_button, close_button]),
					new ActionRowBuilder()
						.addComponents([reopen_button, delete_button]),
				],
			});
			await interaction.editReply({ content: `Ticket created: ${channel}` });
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		// --- TICKET VALIDATION START ---
		const ticketSubcommands = ['close', 'add', 'remove', 'claim', 'rename', 'transcript', 'delete'];
		const sub = interaction.options.getSubcommand(false);

		if (interaction.commandName === 'ticket' && ticketSubcommands.includes(sub)) {
			const TICKET_CATEGORY_ID = '1472502858443133045';
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
		// --- TICKET VALIDATION END ---

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	},
};
