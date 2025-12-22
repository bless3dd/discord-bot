const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');

// Configurazione del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Sistema di ruoli automatici
const ROLE_VERIFICATO = '1397004446365384835';
const ROLE_NON_VERIFICATO = '1447612498562777231';

// Token e Client ID del bot
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1219541590620770334';

// Sistema di warnings (in memoria)
const warnings = new Map();

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
        console.log('🔄 Registrazione comandi slash...');
        
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
    updateVoiceStatus();
    // Aggiorna lo status ogni 30 secondi
    setInterval(updateVoiceStatus, 30000);
});

// Funzione per contare membri in vocale
function updateVoiceStatus() {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    let voiceCount = 0;
    guild.channels.cache.forEach(channel => {
        if (channel.isVoiceBased()) {
            voiceCount += channel.members.size;
        }
    });

    client.user.setActivity(`${voiceCount} in vocale`, { type: 3 }); // type 3 = WATCHING
}

// Aggiorna quando qualcuno entra/esce dalle vocali
client.on('voiceStateUpdate', () => {
    updateVoiceStatus();
});

// Sistema automatico di scambio ruoli
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    // Trova i ruoli aggiunti
    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));

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
            await user.send(`👢 Sei stato espulso da **${interaction.guild.name}**\nMotivo: ${reason}`).catch(() => {});
            await member.kick(reason);

            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('👢 Utente Espulso')
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
                    { name: 'Motivo', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
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
                { name: 'Motivo', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
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
                { name: 'Ruoli', value: `${guild.roles.cache.size}`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }

    // AVATAR
    if (commandName === 'avatar') {
        const user = interaction.options.getUser('utente') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Avatar di ${user.tag}`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));

        await interaction.reply({ embeds: [embed] });
    }

    // POLL
    if (commandName === 'poll') {
        const question = interaction.options.getString('domanda');
        const optionsStr = interaction.options.getString('opzioni');
        const options = optionsStr.split(',').map(o => o.trim()).slice(0, 10);

        if (options.length < 2) {
            return interaction.reply({ content: '❌ Servono almeno 2 opzioni!', ephemeral: true });
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📊 Sondaggio')
            .setDescription(`**${question}**\n\n${options.map((o, i) => `${emojis[i]} ${o}`).join('\n')}`)
            .setFooter({ text: `Creato da ${interaction.user.tag}` });

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
            await msg.react(emojis[i]);
        }
    }

    // 8BALL
    if (commandName === '8ball') {
        const question = interaction.options.getString('domanda');
        const responses = [
            'Sì, decisamente!', 'È certo!', 'Senza dubbio!', 'Puoi contarci!',
            'Come la vedo io, sì', 'Molto probabile', 'Sembra buono',
            'Non è chiaro, riprova', 'Chiedi di nuovo più tardi', 'Meglio non dirtelo ora',
            'Non ci contare', 'La mia risposta è no', 'Le mie fonti dicono di no',
            'Le prospettive non sono buone', 'Molto dubbioso'
        ];

        const answer = responses[Math.floor(Math.random() * responses.length)];

        const embed = new EmbedBuilder()
            .setColor('#9900ff')
            .setTitle('🎱 Palla Magica 8')
            .addFields(
                { name: 'Domanda', value: question },
                { name: 'Risposta', value: answer }
            );

        await interaction.reply({ embeds: [embed] });
    }

    // SAY
    if (commandName === 'say') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
        }

        const message = interaction.options.getString('messaggio');
        await interaction.channel.send(message);
        await interaction.reply({ content: '✅ Messaggio inviato!', ephemeral: true });
    }

    // HELP
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Comandi del Bot')
            .setDescription('Ecco tutti i comandi disponibili:')
            .addFields(
                { name: '🛡️ Moderazione', value: '`/ban` `/unban` `/kick` `/timeout` `/warn` `/warnings` `/clear` `/slowmode`' },
                { name: 'ℹ️ Informativi', value: '`/userinfo` `/serverinfo` `/avatar`' },
                { name: '🎉 Divertimento', value: '`/poll` `/8ball` `/say`' },
                { name: '❓ Aiuto', value: '`/help`' }
            )
            .setFooter({ text: 'Bot di moderazione completo' });

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
