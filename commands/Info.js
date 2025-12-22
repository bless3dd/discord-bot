const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = [
    {
        data: new SlashCommandBuilder()
            .setName('userinfo')
            .setDescription('Mostra informazioni su un utente')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente di cui vedere le info')
                    .setRequired(false)),

        async execute(interaction) {
            const user = interaction.options.getUser('utente') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📋 Info su ${user.tag}`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'ID', value: user.id },
                    { name: 'Nickname', value: member.nickname || 'Nessuno', inline: true },
                    { name: 'Account creato', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` },
                    { name: 'Entrato nel server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` },
                    { name: 'Ruoli', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'Nessuno' }
                );

            await interaction.reply({ embeds: [embed] });
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('serverinfo')
            .setDescription('Mostra informazioni sul server'),

        async execute(interaction) {
            const guild = interaction.guild;

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📋 Info su ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'ID', value: guild.id },
                    { name: 'Proprietario', value: `<@${guild.ownerId}>`, inline: true },
                    { name: 'Membri', value: `${guild.memberCount}`, inline: true },
                    { name: 'Creato', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` },
                    { name: 'Canali', value: `${guild.channels.cache.size}`, inline: true },
                    { name: 'Ruoli', value: `${guild.roles.cache.size}`, inline: true }
                );

            await interaction.reply({ embeds: [embed] });
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('avatar')
            .setDescription('Mostra l\'avatar di un utente')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente di cui vedere l\'avatar')
                    .setRequired(false)),

        async execute(interaction) {
            const user = interaction.options.getUser('utente') || interaction.user;

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🖼️ Avatar di ${user.tag}`)
                .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }));

            await interaction.reply({ embeds: [embed] });
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Mostra la latenza del bot'),

        async execute(interaction) {
            const ping = interaction.client.ws.ping;
            await interaction.reply(`🏓 Pong! Latenza: ${ping}ms`);
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('help')
            .setDescription('Mostra tutti i comandi disponibili'),

        async execute(interaction) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📚 Comandi Disponibili')
                .addFields(
                    { name: '⚔️ Moderazione', value: '`/ban` `/unban` `/kick` `/timeout` `/warn` `/warnings` `/clear` `/slowmode`' },
                    { name: 'ℹ️ Informativi', value: '`/userinfo` `/serverinfo` `/avatar` `/ping`' },
                    { name: '🎮 Fun', value: '`/poll` `/8ball` `/say`' }
                )
                .setFooter({ text: 'Usa /comando per vedere i dettagli' });

            await interaction.reply({ embeds: [embed] });
        }
    }
];