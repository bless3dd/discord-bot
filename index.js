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
app.use(express.json());

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

// ========================================
// API ENDPOINT PER STATISTICHE
// ========================================
app.get('/api/stats', (req, res) => {
    try {
        // Verifica che il bot sia pronto
        if (!client.isReady()) {
            return res.status(200).json({
                online: false,
                message: 'Bot is starting or offline',
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

        res.status(200).json({
            online: true,
            servers: client.guilds.cache.size,
            users: totalUsers,
            commands: commandCount,
            ping: client.ws.ping,
            uptime: Math.floor(client.uptime / 1000)
        });
    } catch (error) {
        console.error('❌ Errore API /api/stats:', error);
        res.status(200).json({
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
    res.status(200).send('✅ KyraBot API is running! Visit /api/stats for statistics.');
});

// Endpoint di health check (CRITICO PER RAILWAY)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        server_running: true,
        bot_ready: client.isReady(),
        timestamp: new Date().toISOString()
    });
});

// ========================================
// AVVIA IL SERVER API SUBITO (PRIORITÀ)
// ========================================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔡 API Stats attiva su porta ${PORT}`);
    console.log(`🌐 Server HTTP pronto - Railway può connettersi`);
    console.log(`📊 Endpoint disponibili:`);
    console.log(`   - GET / (homepage)`);
    console.log(`   - GET /health (health check)`);
    console.log(`   - GET /api/stats (statistiche bot)`);
});

// Gestione errori del server
server.on('error', (error) => {
    console.error('❌ Errore critico server Express:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} già in uso!`);
    }
});

// ========================================
// CARICAMENTO BOT DISCORD (DOPO IL SERVER)
// ========================================
console.log('🚀 Avvio del bot Discord...');

// Carica gli event handlers standard
try {
    eventHandler(client);
    console.log('✅ Event handlers caricati');
} catch (error) {
    console.error('⚠️ Errore caricamento event handlers:', error);
}

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
    console.log('✅ Command Handler registrato');
} catch (error) {
    console.log('⚠️ Command Handler non trovato, skip...');
}

// ========================================
// LOGIN DEL BOT DISCORD
// ========================================
client.login(TOKEN)
    .then(() => {
        console.log('🔐 Login Discord effettuato con successo!');
    })
    .catch(error => {
        console.error('❌ ERRORE LOGIN DISCORD:', error);
        console.error('⚠️ Verifica che il TOKEN sia corretto nelle variabili Railway');
        console.log('ℹ️ API continuerà a funzionare anche senza bot attivo');
        // NON TERMINARE IL PROCESSO - Railway ha bisogno che il server resti attivo
    });

// Event quando il bot è pronto
client.once('ready', () => {
    console.log('='.repeat(50));
    console.log(`✅ BOT DISCORD ONLINE`);
    console.log(`👤 Username: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`🔢 Server: ${client.guilds.cache.size}`);
    console.log(`👥 Utenti: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`);
    console.log(`⚡ Comandi: ${client.commands.size || 16}`);
    console.log('='.repeat(50));
});

// Gestione errori del client Discord
client.on('error', error => {
    console.error('❌ Errore Discord Client:', error);
    // Non terminare il processo - lascia il server API attivo
});

// Gestione warning Discord
client.on('warn', info => {
    console.warn('⚠️ Discord Warning:', info);
});

// Gestione disconnessioni Discord
client.on('shardDisconnect', (event, id) => {
    console.warn(`⚠️ Shard ${id} disconnesso:`, event);
});

client.on('shardReconnecting', (id) => {
    console.log(`🔄 Shard ${id} riconnessione in corso...`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Ricevuto segnale ${signal} - Arresto graceful...`);
    
    // Chiudi il server HTTP
    server.close(() => {
        console.log('✅ Server HTTP chiuso');
    });
    
    // Disconnetti il bot Discord
    if (client.isReady()) {
        client.destroy();
        console.log('✅ Bot Discord disconnesso');
    }
    
    // Attendi 2 secondi e poi termina
    setTimeout(() => {
        console.log('👋 Shutdown completato');
        process.exit(0);
    }, 2000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Gestione errori non catturati (evita crash completo)
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Non terminare il processo - logga solo l'errore
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Non terminare il processo - logga solo l'errore
});

console.log('✅ Index.js completamente caricato - In attesa eventi...');
