const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerStatus } = require('../../utils/mcServer.js');

const MC_PORT = parseInt(process.env.MC_PORT) || 25585;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('Shows the IP of the minecraft server'),
    async execute(interaction) {
        await interaction.deferReply();
        
        const status = await getServerStatus();

        const embed = new EmbedBuilder()
            .setTitle('🎮 Server IP')
            .setColor(0x55FF55)
            .addFields(
                { name: 'Address', value: `${process.env.MC_IP}:${MC_PORT}`, inline: true },
            );

        if (status) {
            embed.addFields({ name: 'Status', value: status.online ? '🟢 Online' : '🔴 Offline', inline: true });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
