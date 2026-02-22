const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TICKET_MSG_FILE = path.join(__dirname, '../../ticketMessageId.json');

function storeTicketMessageId(messageId) {
    fs.writeFileSync(TICKET_MSG_FILE, JSON.stringify({ messageId }));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the ticket panel message'),
    async execute(interaction) {
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

        const messages = await interaction.channel.messages.fetch({ limit: 20 });
        const oldTicketMessages = messages.filter(m => 
            m.author.id === interaction.client.user.id && 
            m.embeds[0]?.title?.includes('Support Tickets')
        );
        if (oldTicketMessages.size > 0) {
            await interaction.channel.bulkDelete(oldTicketMessages);
        }

        const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
        storeTicketMessageId(msg.id);
        await interaction.reply({ content: 'Ticket panel sent!', ephemeral: true });
    },
};
