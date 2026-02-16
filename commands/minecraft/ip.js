const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerStatus } = require('../../utils/mcServer.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('Shows the IP of the minecraft server'),
    async execute(interaction) {
        const status = await getServerStatus();

        const embed = new EmbedBuilder()
            .setTitle('🎮 Server IP')
            .setColor(0x55FF55)
            .addFields(
                { name: 'Address', value: process.env.MC_IP, inline: true },
            );

        if (status) {
            embed.addFields({ name: 'Status', value: status.online ? '🟢 Online' : '🔴 Offline', inline: true });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
