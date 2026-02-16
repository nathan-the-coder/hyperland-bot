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

            const playerList = (status?.sample && status.sample.length > 0) 
                ? status.sample.map(p => p.name).join('\n') 
                : 'None';

            console.log(status);

            const playerHeader = `Online Players (${status.players || 0}/${status?.maxPlayers || 100})`;

            const embed = new EmbedBuilder()
                .setTitle('Hyperland Status')
                .setColor(0x55FF55) 
                .addFields(
                    {
                        name: '**Server Info**',
                        value: '**IP: hyperlandnetwork.play.hosting**\n**PORT: 20951**'
                    },
                    {
                        name: 'Version', 
                        value: status?.version || '1.21.x', 
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