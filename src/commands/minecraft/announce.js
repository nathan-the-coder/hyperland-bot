const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement (Staff only)')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to send to').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('Announcement message').setRequired(true))
        .addRoleOption(o => o.setName('ping').setDescription('Role to ping (optional)')),

    async execute(interaction) {
        const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
        const guild = await interaction.guild.fetch();
        const isOwner = guild.ownerId === interaction.user.id;

        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !isOwner) {
            await interaction.reply({ content: '❌ Staff only.', ephemeral: true });
            return;
        }

        const channel = interaction.options.getChannel('channel');
        const messageText = interaction.options.getString('message');
        const role = interaction.options.getRole('ping');

        const embed = new EmbedBuilder()
            .setTitle('📢 Hyperland Announcement')
            .setDescription(messageText)
            .setColor(0x55FF55)
            .setTimestamp();

        try {
            const pingContent = role ? role.toString() : '';
            await channel.send({
                content: pingContent,
                embeds: [embed],
                allowedMentions: { parse: ['everyone', 'roles', 'users'] }
            });

            await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error: Failed to send announcement.', ephemeral: true });
        }
    },
};
