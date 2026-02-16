const { EmbedBuilder, ChannelType, PermissionsBitField, OverwriteType } = require('discord.js');

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_PARENT_ID = '1472426931084333261';

module.exports = {
    new: async (guild, user, reason) => {
        const fetchedGuild = await guild.fetch();
        
        const permissionOverwrites = [
            { id: guild.id, type: OverwriteType.Role, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: user.id, type: OverwriteType.Member, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: fetchedGuild.ownerId, type: OverwriteType.Role, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ];
        
        if (STAFF_ROLE_ID) {
            permissionOverwrites.push({ id: STAFF_ROLE_ID, type: OverwriteType.Role, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
        }
        
        const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            parent: TICKET_PARENT_ID,
            permissionOverwrites,
        });
        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket Opened')
            .setDescription(`Hello ${user}, support will be with you shortly.\n**Reason:** ${reason || 'None provided'}`)
            .setColor('Green');
        const staffMention = STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : '';
        await channel.send({ content: `${user} ${staffMention}`.trim(), embeds: [embed] });
        return `Ticket created: ${channel}`;
    },
    help: () => {
        return new EmbedBuilder()
            .setTitle('Ticket Bot Commands')
            .addFields(
                { name: 'User Commands', value: '`/ticket new`, `/ticket help` | `$new`, `$help`' },
                { name: 'Staff / Admin Only', value: '`/ticket close`, `/ticket add`, `/ticket remove`, `/ticket claim`, `/ticket rename`, `/ticket transcript`, `/ticket delete`' }
            )
            .setColor('Blue');
    },
    close: async (channel) => {
        await channel.send('🔒 **Staff is closing this ticket.** Channel will delete in 5 seconds...');
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return 'Ticket closing.';
    },
    add: async (channel, target) => {
        if (!target) return "Please mention a valid user.";
        await channel.permissionOverwrites.edit(target.id, { ViewChannel: true, SendMessages: true });
        return `✅ Added ${target} to the ticket.`;
    },
    remove: async (channel, target) => {
        if (!target) return "Please mention a valid user.";
        await channel.permissionOverwrites.edit(target.id, { ViewChannel: false });
        return `❌ Removed ${target} from the ticket.`;
    },
    claim: async (channel, staff) => {
        return `👮 **Ticket claimed by ${staff}**`;
    },
    rename: async (channel, name) => {
        if (!name) return "Please provide a name.";
        await channel.setName(name);
        return `📝 Ticket renamed to **${name}**`;
    },
    transcript: () => '📄 Transcript generated: [Download Link Placeholder]',
    delete: async (channel) => { await channel.delete().catch(() => {}); }
};