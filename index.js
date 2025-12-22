require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./config');
const eventHandler = require('./events/eventHandler');

// ========================================
// SETUP EXPRESS API
// ========================================
const express = require('express');
const cors = require('cors');
const app = express();

// CORS configurato per permettere richieste da qualsiasi origine
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false
}));

// Headers aggiuntivi per CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

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
// API ENDPOINTS
// ========================================

// Homepage
app.get('/', (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>KyraBot API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #0a0118;
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 20px;
                    border: 1px solid rgba(167, 139, 250, 0.3);
                }
                h1 { color: #a78bfa; }
                a {
                    color: #6366f1;
                    text-decoration: none;
                    margin: 0 10px;
                }
                a:hover { color: #8b5cf6; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ KyraBot API is Running!</h1>
                <p>Available endpoints:</p>
                <div>
                    <a href="/health" target="_blank">/health</a>
                    <a href="/api/stats" target="_blank">/api/stats</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Health check (critico per Railway)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        server_running: true,
        bot_ready: client.isReady(),
        timestamp: new Date().toISOString()
    });
});

// Statistiche bot
app.get('/api/stats', (req, res) => {
    try {
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

        const totalUsers = client.guilds.cache.reduce((acc, guild) => {
            return acc + guild.memberCount;
        }, 0);

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

// ========================================
// AVVIA SERVER EXPRESS (PRIORITÀ)
// ========================================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log(`🔡 API SERVER ATTIVO`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🌐 Railway può connettersi`);
    console.log(`📊 Endpoints disponibili:`);
    console.log(`   → GET /              (homepage)`);
    console.log(`   → GET /health        (health check)`);
    console.log(`   → GET /api/stats     (statistiche bot)`);
    console.log('='.repeat(60));
});

server.on('error', (error) => {
    console.error('❌ ERRORE CRITICO SERVER:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} già in uso!`);
    }
});

// ========================================
// CARICAMENTO BOT DISCORD
// ========================================
console.log('\n🤖 Inizializzazione bot Discord...\n');

// Event handlers
try {
    eventHandler(client);
    console.log('✅ Event handlers caricati');
} catch (error) {
    console.error('⚠️ Errore event handlers:', error.message);
}

// Voice status updater
try {
    const voiceStatusUpdater = require('./events/voiceStatusUpdater');
    voiceStatusUpdater(client);
    console.log('✅ Voice Status Updater caricato');
} catch (error) {
    console.log('⚠️ Voice Status Updater non trovato, skip');
}

// Member events
try {
    const memberEvents = require('./events/memberEvents');
    memberEvents(client);
    console.log('✅ Member Events caricato');
} catch (error) {
    console.log('⚠️ Member Events non trovato, skip');
}

// Command handler
try {
    const commandHandler = require('./events/commandHandler');
    client.on('interactionCreate', async (interaction) => {
        console.log('📢 Interazione ricevuta');
        await commandHandler(interaction);
    });
    console.log('✅ Command Handler registrato');
} catch (error) {
    console.log('⚠️ Command Handler non trovato, skip');
}

// ========================================
// LOGIN BOT
// ========================================
console.log('\n🔐 Connessione a Discord...\n');

client.login(TOKEN)
    .then(() => {
        console.log('✅ Login effettuato con successo!');
    })
    .catch(error => {
        console.error('❌ ERRORE LOGIN DISCORD:', error.message);
        console.error('⚠️ Verifica il TOKEN nelle variabili Railway');
        console.log('ℹ️ API continua a funzionare anche senza bot');
    });

// ========================================
// EVENTI BOT
// ========================================
client.once('ready', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BOT DISCORD ONLINE E OPERATIVO!');
    console.log('='.repeat(60));
    console.log(`👤 Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`🔢 Server: ${client.guilds.cache.size}`);
    console.log(`👥 Utenti totali: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}`);
    console.log(`⚡ Comandi: ${client.commands.size || 16}`);
    console.log(`📡 Ping WebSocket: ${client.ws.ping}ms`);
    console.log('='.repeat(60) + '\n');
});

client.on('error', error => {
    console.error('❌ Errore Discord Client:', error);
});

client.on('warn', info => {
    console.warn('⚠️ Discord Warning:', info);
});

client.on('shardDisconnect', (event, id) => {
    console.warn(`⚠️ Shard ${id} disconnesso`);
});

client.on('shardReconnecting', id => {
    console.log(`🔄 Shard ${id} riconnessione...`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Segnale ${signal} ricevuto - Shutdown...`);
    
    server.close(() => {
        console.log('✅ Server HTTP chiuso');
    });
    
    if (client.isReady()) {
        client.destroy();
        console.log('✅ Bot Discord disconnesso');
    }
    
    setTimeout(() => {
        console.log('👋 Shutdown completato\n');
        process.exit(0);
    }, 2000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
});

console.log('\n✅ Sistema inizializzato - In ascolto eventi...\n');
