const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const MC_PORT = parseInt(process.env.MC_PORT) || 25585;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('Shows the IP of the minecraft server'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Server IP')
            .setColor(0x55FF55)
            .setDescription(`**${process.env.MC_IP}:${MC_PORT}**`)
            .setFooter({ text: 'Hyperland Network' });

        await interaction.reply({ embeds: [embed] });
    },
};
