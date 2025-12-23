const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { warnings, STAFF_ROLE_ID } = require('../config'); // 🆕 Importato STAFF_ROLE_ID
const { sendLog } = require('../utils/logger');

module.exports = [
    {
        data: new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Banna un utente dal server')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente da bannare')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('motivo')
                    .setDescription('Il motivo del ban')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const user = interaction.options.getUser('utente');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const reason = interaction.options.getString('motivo') || 'Nessun motivo';

            if (!member) {
                return interaction.reply({ content: '❌ Utente non trovato!', ephemeral: true });
            }

            if (!member.bannable) {
                return interaction.reply({ content: '❌ Non posso bannare questo utente!', ephemeral: true });
            }

            try {
                await user.send(`🔨 Sei stato bannato da **${interaction.guild.name}**\nMotivo: ${reason}`).catch(() => {});
                await member.ban({ reason: reason });

                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🔨 Utente Bannato')
                    .addFields(
                        { name: 'Utente', value: `${user.tag}`, inline: true },
                        { name: 'Bannato da', value: interaction.user.tag, inline: true },
                        { name: 'Motivo', value: reason }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                await interaction.reply({ content: '❌ Errore durante il ban!', ephemeral: true });
            }
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Rimuove il ban da un utente')
            .addStringOption(option =>
                option.setName('user_id')
                    .setDescription('L\'ID dell\'utente da sbannare')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const userId = interaction.options.getString('user_id');

            try {
                await interaction.guild.members.unban(userId);
                await interaction.reply(`✅ Utente con ID ${userId} sbannato!`);
            } catch (error) {
                await interaction.reply({ content: '❌ Errore durante lo sban!', ephemeral: true });
            }
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Espelle un utente dal server')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente da espellere')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('motivo')
                    .setDescription('Il motivo dell\'espulsione')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const user = interaction.options.getUser('utente');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const reason = interaction.options.getString('motivo') || 'Nessun motivo';

            if (!member || !member.kickable) {
                return interaction.reply({ content: '❌ Non posso espellere questo utente!', ephemeral: true });
            }

            try {
                await user.send(`💢 Sei stato espulso da **${interaction.guild.name}**\nMotivo: ${reason}`).catch(() => {});
                await member.kick(reason);

                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('💢 Utente Espulso')
                    .addFields(
                        { name: 'Utente', value: `${user.tag}`, inline: true },
                        { name: 'Espulso da', value: interaction.user.tag, inline: true },
                        { name: 'Motivo', value: reason }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                await interaction.reply({ content: '❌ Errore durante l\'espulsione!', ephemeral: true });
            }
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('timeout')
            .setDescription('Mette un utente in timeout')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente da mettere in timeout')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('durata')
                    .setDescription('Durata in minuti')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(40320))
            .addStringOption(option =>
                option.setName('motivo')
                    .setDescription('Il motivo del timeout')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const user = interaction.options.getUser('utente');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const duration = interaction.options.getInteger('durata');
            const reason = interaction.options.getString('motivo') || 'Nessun motivo';

            if (!member || !member.moderatable) {
                return interaction.reply({ content: '❌ Non posso mettere in timeout questo utente!', ephemeral: true });
            }

            try {
                await member.timeout(duration * 60 * 1000, reason);

                const embed = new EmbedBuilder()
                    .setColor('#ffcc00')
                    .setTitle('⏰ Timeout Applicato')
                    .addFields(
                        { name: 'Utente', value: `${user.tag}`, inline: true },
                        { name: 'Durata', value: `${duration} minuti`, inline: true },
                        { name: 'Moderatore', value: interaction.user.tag, inline: true },
                        { name: 'Motivo', value: reason }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                await sendLog(interaction.client, embed);
            } catch (error) {
                await interaction.reply({ content: '❌ Errore durante il timeout!', ephemeral: true });
            }
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Avvisa un utente')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente da avvisare')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('motivo')
                    .setDescription('Il motivo dell\'avviso')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const user = interaction.options.getUser('utente');
            const reason = interaction.options.getString('motivo');

            const key = `${interaction.guild.id}-${user.id}`;
            if (!warnings.has(key)) {
                warnings.set(key, []);
            }

            warnings.get(key).push({
                reason: reason,
                moderator: interaction.user.tag,
                timestamp: Date.now()
            });

            try {
                await user.send(`⚠️ Hai ricevuto un avviso in **${interaction.guild.name}**\nMotivo: ${reason}`).catch(() => {});
            } catch {}

            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('⚠️ Avviso Dato')
                .addFields(
                    { name: 'Utente', value: `${user.tag}`, inline: true },
                    { name: 'Totale avvisi', value: `${warnings.get(key).length}`, inline: true },
                    { name: 'Moderatore', value: interaction.user.tag, inline: true },
                    { name: 'Motivo', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.client, embed);
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('warnings')
            .setDescription('Mostra gli avvisi di un utente')
            .addUserOption(option =>
                option.setName('utente')
                    .setDescription('L\'utente di cui vedere gli avvisi')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const user = interaction.options.getUser('utente');
            const key = `${interaction.guild.id}-${user.id}`;
            const userWarnings = warnings.get(key) || [];

            if (userWarnings.length === 0) {
                return interaction.reply(`✅ ${user.tag} non ha avvisi!`);
            }

            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle(`⚠️ Avvisi di ${user.tag}`)
                .setDescription(`Totale: ${userWarnings.length} avvisi`);

            userWarnings.slice(-5).forEach((w, i) => {
                const date = new Date(w.timestamp).toLocaleString('it-IT');
                embed.addFields({
                    name: `Avviso ${i + 1}`,
                    value: `**Motivo:** ${w.reason}\n**Da:** ${w.moderator}\n**Data:** ${date}`
                });
            });

            await interaction.reply({ embeds: [embed] });
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Cancella messaggi in massa')
            .addIntegerOption(option =>
                option.setName('quantita')
                    .setDescription('Numero di messaggi da cancellare')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const amount = interaction.options.getInteger('quantita');

            try {
                const deleted = await interaction.channel.bulkDelete(amount, true);
                await interaction.reply({ content: `🗑️ Cancellati ${deleted.size} messaggi!`, ephemeral: true });

                const embed = new EmbedBuilder()
                    .setColor('#ff6600')
                    .setTitle('🗑️ Messaggi Cancellati in Massa')
                    .addFields(
                        { name: 'Moderatore', value: interaction.user.tag, inline: true },
                        { name: 'Canale', value: `${interaction.channel}`, inline: true },
                        { name: 'Quantità', value: `${deleted.size} messaggi`, inline: true }
                    )
                    .setTimestamp();

                await sendLog(interaction.client, embed);
            } catch (error) {
                await interaction.reply({ content: '❌ Errore durante la cancellazione!', ephemeral: true });
            }
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('slowmode')
            .setDescription('Imposta la modalità lenta nel canale')
            .addIntegerOption(option =>
                option.setName('secondi')
                    .setDescription('Secondi di attesa tra messaggi (0 per disattivare)')
                    .setRequired(true)
                    .setMinValue(0)
                    .setMaxValue(21600))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        async execute(interaction) {
            // 🆕 CONTROLLO RUOLO STAFF
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Devi avere il ruolo Staff per usare questo comando!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const seconds = interaction.options.getInteger('secondi');

            try {
                await interaction.channel.setRateLimitPerUser(seconds);
                if (seconds === 0) {
                    await interaction.reply('✅ Modalità lenta disattivata!');
                } else {
                    await interaction.reply(`✅ Modalità lenta impostata a ${seconds} secondi!`);
                }

                const embed = new EmbedBuilder()
                    .setColor('#00aaff')
                    .setTitle('⏱️ Slowmode Modificato')
                    .addFields(
                        { name: 'Moderatore', value: interaction.user.tag, inline: true },
                        { name: 'Canale', value: `${interaction.channel}`, inline: true },
                        { name: 'Durata', value: seconds === 0 ? 'Disattivato' : `${seconds} secondi`, inline: true }
                    )
                    .setTimestamp();

                await sendLog(interaction.client, embed);
            } catch (error) {
                await interaction.reply({ content: '❌ Errore!', ephemeral: true });
            }
        }
    }
];
