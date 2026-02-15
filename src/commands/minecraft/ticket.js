const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require('discord.js');
const actions = require('../../utils/ticket_actions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket commands')
        .addSubcommand(s => s.setName('new').setDescription('Open a ticket').addStringOption(o => o.setName('reason').setDescription('Reason')))
        .addSubcommand(s => s.setName('help').setDescription('View help'))
        .addSubcommand(s => s.setName('close').setDescription('Close ticket (Staff Only)'))
        .addSubcommand(s => s.setName('claim').setDescription('Claim ticket (Staff Only)'))
        .addSubcommand(s => s.setName('delete').setDescription('Delete channel (Staff Only)'))
        .addSubcommand(s => s.setName('transcript').setDescription('Generate transcript (Staff Only)'))
        .addSubcommand(s => s.setName('rename').setDescription('Rename ticket (Staff Only)').addStringOption(o => o.setName('name').setDescription('New name').setRequired(true)))
        .addSubcommand(s => s.setName('add').setDescription('Add user (Staff Only)').addUserOption(o => o.setName('target').setDescription('User').setRequired(true)))
        .addSubcommand(s => s.setName('remove').setDescription('Remove user (Staff Only)').addUserOption(o => o.setName('target').setDescription('User').setRequired(true))),

    async execute(interaction) {
        // Identify which subcommand was used
        const sub = interaction.options.getSubcommand();
        const { guild, channel, user, options } = interaction;

        // Acknowledge the interaction
        // Some actions take seconds so defer or reply immediately

        try {
            let result;

            // Map subcommands to actions object
            switch (sub) {
                case 'new':
                    {
                        const reason = options.getString('reason');
                        result = await actions.new(guild, user, reason);
                        break;
                    }

                case 'help':
                    result = actions.help();
                    break;

                case 'close':
                    result = await actions.close(channel);
                    break;

                case 'add':
                case 'remove':
                    {
                        const target = options.getString('name');
                        result = await actions[sub](channel, target); // Dynamic call
                        break;
                    }

                case 'rename':
                    {
                        const newName = options.getString('name');
                        result = await actions.rename(channel, newName);
                        break;
                    }

                case 'claim':
                    result = await actions.claim(channel, user);
                    break;

                case 'transcript':
                    result = actions.transcript();
                    break;

                case 'delete':
                    await actions.delete(channel);
                    return; // no reply needed if chnnael is gone

                default:
                    result = "Unknown subcommand.";
            }


            // Send the result back to discord
            if (result instanceof EmbedBuilder) {
                await interaction.reply({ embeds: [result] });
            } else {
                await interaction.reply({ content: result, ephemeral: true });
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true })
        }
    }
}
