const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send a green announcement with a custom ping')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Where to send it')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('Announcement text')
                .setRequired(true))
        .addMentionableOption(option =>
            option.setName('ping')
                .setDescription('Role or user to ping')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('channel');
        const messageText = interaction.options.getString('message');
        const mentionable = interaction.options.getMentionable('ping');

        const embed = new EmbedBuilder()
            .setTitle('📢 Hyperland Announcement')
            .setDescription(messageText)
            .setColor(0x55FF55)
            .setTimestamp()
            .setFooter({ 
                text: `Sent by ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        try {
            const pingContent = mentionable ? `${mentionable}` : '';
            
            await channel.send({ 
                content: pingContent, 
                embeds: [embed],
                allowedMentions: { parse: ['everyone', 'roles', 'users'] } 
            });

            await interaction.editReply({ content: `Announcement successfully sent to ${channel}!` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Error: Failed to send. Check my permissions in that channel.' });
        }
    },
};