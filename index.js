require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./config');
const eventHandler = require('./events/eventHandler');

// ========================================
// AGGIUNTE PER API STATS
// ========================================
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); // Permette al sito di leggere l'API

// ========================================
// CLIENT DISCORD
// ========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

console.log('🚀 Avvio del bot...');

// Carica gli event handlers standard
eventHandler(client);

// Carica manualmente il voice status updater
try {
    const voiceStatusUpdater = require('./events/voiceStatusUpdater');
    voiceStatusUpdater(client);
    console.log('✅ Voice Status Updater caricato manualmente');
} catch (error) {
    console.log('⚠️ Voice Status Updater non trovato, skip...');
}

// Carica manualmente i member events (per il role swap)
try {
    const memberEvents = require('./events/memberEvents');
    memberEvents(client);
    console.log('✅ Member Events caricato manualmente');
} catch (error) {
    console.log('⚠️ Member Events non trovato, skip...');
}

// Aggiungi manualmente l'evento interactionCreate
try {
    const commandHandler = require('./events/commandHandler');
    client.on('interactionCreate', async (interaction) => {
        console.log('📢 Interazione ricevuta in index.js');
        await commandHandler(interaction);
    });
} catch (error) {
    console.log('⚠️ Command Handler non trovato, skip...');
}

// ========================================
// API ENDPOINT PER STATISTICHE
// ========================================
app.get('/api/stats', (req, res) => {
    try {
        // Verifica che il bot sia pronto
        if (!client.isReady()) {
            return res.status(503).json({
                online: false,
                error: 'Bot is starting...',
                servers: 0,
                users: 0,
                commands: 0,
                ping: 0,
                uptime: 0
            });
        }

        // Conta utenti totali da tutti i server
        const totalUsers = client.guilds.cache.reduce((acc, guild) => {
            return acc + guild.memberCount;
        }, 0);

        // Conta comandi disponibili
        const commandCount = client.commands.size || 16;

        res.json({
            online: true,
            servers: client.guilds.cache.size,
            users: totalUsers,
            commands: commandCount,
            ping: client.ws.ping,
            uptime: Math.floor(client.uptime / 1000)
        });
    } catch (error) {
        console.error('❌ Errore API /api/stats:', error);
        res.status(500).json({
            online: false,
            error: error.message,
            servers: 0,
            users: 0,
            commands: 0,
            ping: 0,
            uptime: 0
        });
    }
});

// Endpoint homepage
app.get('/', (req, res) => {
    res.send('✅ KyraBot API is running! Visit /api/stats for statistics.');
});

// Endpoint di health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        bot_ready: client.isReady(),
        timestamp: new Date().toISOString()
    });
});

// Avvia il server API
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 API Stats attiva su porta ${PORT}`);
    console.log(`🌐 API disponibile su /api/stats`);
});

// Gestione errori del server
server.on('error', (error) => {
    console.error('❌ Errore server Express:', error);
});

// ========================================
// LOGIN DEL BOT
// ========================================
client.login(TOKEN)
    .then(() => {
        console.log('🔐 Login effettuato con successo!');
    })
    .catch(error => {
        console.error('❌ Errore durante il login:', error);
        process.exit(1);
    });

// Event quando il bot è pronto
client.once('ready', () => {
    console.log(`✅ Bot online come ${client.user.tag}`);
    console.log(`📊 Server: ${client.guilds.cache.size}`);
    console.log(`👥 Utenti: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`);
});

// Gestione errori del client Discord
client.on('error', error => {
    console.error('❌ Errore Discord Client:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Arresto del bot...');
    client.destroy();
    server.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Arresto del bot...');
    client.destroy();
    server.close();
    process.exit(0);
});
