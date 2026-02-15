const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerStatus } = require('../../utils/mcServer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('online')
        .setDescription('Shows who is currently playing on the server'),
    async execute(interaction) {
        const status = await getServerStatus();

        if (!status || !status.players) {
            return interaction.reply({ content: '❌ Server is currently offline!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 Server Status')
            .setColor(0x55FF55)
            .addFields(
                { name: 'Status', value: '🟢 Online', inline: true },
                { name: 'Players', value: `${status.players.online}/${status.players.max}`, inline: true }
            );

        if (status.players.list && status.players.list.length > 0) {
            const playerList = status.players.list.map(p => p.name).join(', ');
            embed.setDescription(`**Current Players:**\n${playerList}`);
        }

        await interaction.reply({ embeds: [embed] });
    },
};
