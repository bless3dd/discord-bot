const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

// Configurazione del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Token e Client ID del bot
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1219541590620770334'; // ID del tuo server

// Definizione dei comandi slash
const commands = [
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
        .setName('help')
        .setDescription('Mostra i comandi disponibili')
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

// Evento quando il bot è pronto
client.once('ready', () => {
    console.log(`✅ Bot online come ${client.user.tag}`);
    client.user.setActivity('/help per aiuto', { type: 3 }); // type 3 = WATCHING
});

// Gestione delle interazioni (slash commands)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // Comando /ban
    if (commandName === 'ban') {
        // Verifica permessi dell'utente
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ 
                content: '❌ Non hai i permessi per bannare membri!', 
                ephemeral: true 
            });
        }

        // Verifica permessi del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ 
                content: '❌ Non ho i permessi per bannare membri!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('utente');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const reason = interaction.options.getString('motivo') || 'Nessun motivo specificato';

        if (!member) {
            return interaction.reply({ 
                content: '❌ Utente non trovato nel server!', 
                ephemeral: true 
            });
        }

        // Verifica se l'utente è bannabile
        if (!member.bannable) {
            return interaction.reply({ 
                content: '❌ Non posso bannare questo utente! (ruolo troppo alto o proprietario del server)', 
                ephemeral: true 
            });
        }

        try {
            // Invia DM all'utente prima del ban
            await user.send(`🔨 Sei stato bannato da **${interaction.guild.name}**\nMotivo: ${reason}`).catch(() => {
                console.log('Non è stato possibile inviare DM all\'utente');
            });

            // Esegui il ban
            await member.ban({ reason: reason });

            // Embed di conferma
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Utente Bannato')
                .setDescription(`**${user.tag}** è stato bannato dal server`)
                .addFields(
                    { name: 'Utente', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Bannato da', value: interaction.user.tag, inline: true },
                    { name: 'Motivo', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: interaction.guild.name });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ Si è verificato un errore durante il ban!', 
                ephemeral: true 
            });
        }
    }

    // Comando /unban
    if (commandName === 'unban') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ 
                content: '❌ Non hai i permessi per sbannare membri!', 
                ephemeral: true 
            });
        }

        const userId = interaction.options.getString('user_id');

        try {
            await interaction.guild.members.unban(userId);
            await interaction.reply(`✅ Utente con ID ${userId} è stato sbannato!`);
        } catch (error) {
            await interaction.reply({ 
                content: '❌ Errore durante lo sban. Verifica che l\'ID sia corretto e che l\'utente sia bannato.', 
                ephemeral: true 
            });
        }
    }

    // Comando /help
    if (commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Comandi del Bot')
            .setDescription('Lista dei comandi disponibili:')
            .addFields(
                { name: '/ban @utente [motivo]', value: 'Banna un utente dal server' },
                { name: '/unban <user_id>', value: 'Rimuove il ban da un utente' },
                { name: '/help', value: 'Mostra questo messaggio' }
            )
            .setFooter({ text: 'Bot di moderazione' });

        await interaction.reply({ embeds: [helpEmbed] });
    }
});

// Login del bot
client.login(TOKEN);
