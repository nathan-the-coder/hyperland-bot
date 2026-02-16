const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription("Makes the bot say something")
        // Close each option with a ")" before starting the next "."
        .addStringOption(o => o.setName('message').setDescription('The message content').setRequired(true))
        .addChannelOption(o => o.setName('channel').setDescription('Where to send it').setRequired(true))
        .addMentionableOption(o => o.setName('mention').setDescription('User or Role to mention'))
        .addRoleOption(o => o.setName('role').setDescription('Additional role to tag')),

    async execute(interaction) {
        const messageText = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel');
        const mentionable = interaction.options.getMentionable('mention');
        const role = interaction.options.getRole('role'); // Fixed: matched the name above

        const embed = new EmbedBuilder()
            .setDescription(messageText)
            .setColor(0x55FF55);
        
        // Construct the ping string safely
        const pings = [mentionable, role].filter(p => p).map(p => p.toString()).join(' ');

        try {
            await channel.send({
                content: pings,
                embeds: [embed],
                allowedMentions: { parse: ['everyone', 'roles', 'users'] }
            });

            // Use ephemeral so only the user sees the confirmation
            await interaction.reply({ content: 'Message sent!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to send message.', ephemeral: true });
        }
    }
}