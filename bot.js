const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ChannelType, AuditLogEvent } = require('discord.js');

// Configurazione del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// Sistema di ruoli automatici
const ROLE_VERIFICATO = '1397004446365384835';
const ROLE_NON_VERIFICATO = '1447612498562777231';

// Canale per i log
const LOG_CHANNEL_ID = '1452627029030731899';

// Token e Client ID del bot
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1219541590620770334';

// Sistema di warnings (in memoria)
const warnings = new Map();

// Funzione per inviare log
async function sendLog(embed) {
    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Errore nell\'invio del log:', error);
    }
}

// Definizione dei comandi slash
const commands = [
    // MODERAZIONE
    new SlashCommandBuilder()
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

    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Rimuove il ban da un utente')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('L\'ID dell\'utente da sbannare')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
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

    new SlashCommandBuilder()
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

    new SlashCommandBuilder()
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

    new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Mostra gli avvisi di un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente di cui vedere gli avvisi')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Cancella messaggi in massa')
        .addIntegerOption(option =>
            option.setName('quantita')
                .setDescription('Numero di messaggi da cancellare')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Imposta la modalità lenta nel canale')
        .addIntegerOption(option =>
            option.setName('secondi')
                .setDescription('Secondi di attesa tra messaggi (0 per disattivare)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // INFORMATIVI
    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Mostra informazioni su un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente di cui vedere le info')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Mostra informazioni sul server'),

    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Mostra l\'avatar di un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente di cui vedere l\'avatar')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mostra la latenza del bot'),

    // FUN
    new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Crea un sondaggio')
        .addStringOption(option =>
            option.setName('domanda')
                .setDescription('La domanda del sondaggio')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opzioni')
                .setDescription('Opzioni separate da virgola (max 10)')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Chiedi alla palla magica 8')
        .addStringOption(option =>
            option.setName('domanda')
                .setDescription('La tua domanda')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Fai dire qualcosa al bot')
        .addStringOption(option =>
            option.setName('messaggio')
                .setDescription('Il messaggio da inviare')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Mostra tutti i comandi disponibili')
].map(command => command.toJSON());

// Registra i comandi slash
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('📄 Registrazione comandi slash...');
        
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        
        console.log('✅ Comandi slash registrati con successo!');
    } catch (error) {
        console.error('❌ Errore nella registrazione dei comandi:', error);
    }
})();

client.once('ready', () => {
    console.log(`✅ Bot online come ${client.user.tag}`);
    client.user.setActivity('/help per aiuto', { type: 3 });
});

// LOGGING: Membro entra nel server
client.on('guildMemberAdd', async (member) => {
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Nuovo Membro')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Utente', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: 'Account creato', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: `Membri totali: ${member.guild.memberCount}` })
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Membro esce dal server
client.on('guildMemberRemove', async (member) => {
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Membro Uscito')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Utente', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: 'Entrato', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: `Membri totali: ${member.guild.memberCount}` })
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Ban
client.on('guildBanAdd', async (ban) => {
    const embed = new EmbedBuilder()
        .setColor('#990000')
        .setTitle('🔨 Utente Bannato')
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Utente', value: `${ban.user.tag} (${ban.user.id})` },
            { name: 'Motivo', value: ban.reason || 'Nessun motivo specificato' }
        )
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Unban
client.on('guildBanRemove', async (ban) => {
    const embed = new EmbedBuilder()
        .setColor('#00cc00')
        .setTitle('🔓 Utente Sbannato')
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Utente', value: `${ban.user.tag} (${ban.user.id})` }
        )
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Ruolo aggiunto/rimosso
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    // Trova i ruoli aggiunti
    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    // Trova i ruoli rimossi
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    // Se è stato aggiunto il ruolo "Verificato"
    if (addedRoles.has(ROLE_VERIFICATO)) {
        // Togli il ruolo "Non Verificato" se ce l'ha
        if (newMember.roles.cache.has(ROLE_NON_VERIFICATO)) {
            try {
                await newMember.roles.remove(ROLE_NON_VERIFICATO);
                console.log(`✅ Rimosso ruolo "Non Verificato" da ${newMember.user.tag}`);
            } catch (error) {
                console.error('Errore nella rimozione del ruolo:', error);
            }
        }
    }

    // Log ruoli aggiunti
    if (addedRoles.size > 0) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎭 Ruolo Aggiunto')
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Utente', value: `${newMember.user.tag}`, inline: true },
                { name: 'Ruoli aggiunti', value: addedRoles.map(r => r.toString()).join(', ') }
            )
            .setTimestamp();
        
        await sendLog(embed);
    }

    // Log ruoli rimossi
    if (removedRoles.size > 0) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('🎭 Ruolo Rimosso')
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Utente', value: `${newMember.user.tag}`, inline: true },
                { name: 'Ruoli rimossi', value: removedRoles.map(r => r.name).join(', ') }
            )
            .setTimestamp();
        
        await sendLog(embed);
    }

    // Log cambio nickname
    if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle('👤 Nickname Cambiato')
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Utente', value: `${newMember.user.tag}`, inline: true },
                { name: 'Vecchio nickname', value: oldMember.nickname || 'Nessuno', inline: true },
                { name: 'Nuovo nickname', value: newMember.nickname || 'Nessuno', inline: true }
            )
            .setTimestamp();
        
        await sendLog(embed);
    }
});

// LOGGING: Messaggio cancellato
client.on('messageDelete', async (message) => {
    if (message.author.bot) return;
    if (!message.content) return;

    const embed = new EmbedBuilder()
        .setColor('#ff3333')
        .setTitle('🗑️ Messaggio Cancellato')
        .addFields(
            { name: 'Autore', value: `${message.author.tag}`, inline: true },
            { name: 'Canale', value: `${message.channel}`, inline: true },
            { name: 'Contenuto', value: message.content.substring(0, 1024) || 'Nessun contenuto testuale' }
        )
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Messaggio modificato
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;
    if (!oldMessage.content || !newMessage.content) return;

    const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('✏️ Messaggio Modificato')
        .addFields(
            { name: 'Autore', value: `${newMessage.author.tag}`, inline: true },
            { name: 'Canale', value: `${newMessage.channel}`, inline: true },
            { name: 'Prima', value: oldMessage.content.substring(0, 1024) },
            { name: 'Dopo', value: newMessage.content.substring(0, 1024) }
        )
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Canale creato
client.on('channelCreate', async (channel) => {
    const embed = new EmbedBuilder()
        .setColor('#00ffcc')
        .setTitle('📢 Canale Creato')
        .addFields(
            { name: 'Nome', value: channel.name, inline: true },
            { name: 'Tipo', value: channel.type.toString(), inline: true },
            { name: 'ID', value: channel.id }
        )
        .setTimestamp();
    
    await sendLog(embed);
});

// LOGGING: Canale eliminato
client.on('channelDelete', async (channel) => {
    const embed = new EmbedBuilder()
        .setColor('#cc0000')
        .setTitle('📢 Canale Eliminato')
        .addFields(
            { name: 'Nome', value: channel.name, inline: true },
            { name: 'Tipo', value: channel.type.toString(), inline: true },
            { name: 'ID', value: channel.id }
        )
        .setTimestamp();
    
    await sendLog(embed);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // BAN
    if (commandName === 'ban') {
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

    // UNBAN
    if (commandName === 'unban') {
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

    // KICK
    if (commandName === 'kick') {
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

    // TIMEOUT
    if (commandName === 'timeout') {
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
            await sendLog(embed);
        } catch (error) {
            await interaction.reply({ content: '❌ Errore durante il timeout!', ephemeral: true });
        }
    }

    // WARN
    if (commandName === 'warn') {
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
        await sendLog(embed);
    }

    // WARNINGS
    if (commandName === 'warnings') {
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

    // CLEAR
    if (commandName === 'clear') {
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

            await sendLog(embed);
        } catch (error) {
            await interaction.reply({ content: '❌ Errore durante la cancellazione!', ephemeral: true });
        }
    }

    // SLOWMODE
    if (commandName === 'slowmode') {
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

            await sendLog(embed);
        } catch (error) {
            await interaction.reply({ content: '❌ Errore!', ephemeral: true });
        }
    }

    // USERINFO
    if (commandName === 'userinfo') {
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

    // SERVERINFO
    if (commandName === 'serverinfo') {
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
                { name: 'Ruoli', value: `${guil
