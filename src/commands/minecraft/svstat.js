const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerStatus } = require('../../utils/mcServer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hln')
        .setDescription('Check HLN Server Status'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const status = await getServerStatus();

            const playerList = (status?.players?.list && status.players.list.length > 0) 
                ? status.players.list.join('\n') 
                : 'None';

            const playerHeader = `Online Players (${status?.players?.online || 0}/${status?.players?.max || 0})`;

            const embed = new EmbedBuilder()
                .setTitle('KitPvP Status')
                .setColor(0x55FF55) 
                .addFields(
                    {
                        name: '**Server Info**',
                        value: '**IP: soon**\n**PORT: soon**'
                    },
                    {
                        name: 'Version', 
                        value: status?.version || '26.0', 
                        inline: true 
                    },
                    { 
                        name: 'Server Status', 
                        value: status?.online ? '🟢 Online' : '🔴 Offline', 
                        inline: true 
                    },
                    { 
                        name: playerHeader, 
                        value: playerList, 
                        inline: false 
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Error fetching server status.');
        }
    },
};