require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./config');
const eventHandler = require('./events/eventHandler');
const path = require('path');

// ========================================
// SETUP EXPRESS API
// ========================================
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';
const DISCORD_CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const GUILD_ID = process.env.GUILD_ID || '1219541590620770334';
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

// CORS configurato
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static('docs')); // ✅ CORRETTO: cartella docs

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
global.botClient = client;

// ========================================
// FUNZIONE VERIFICA RUOLO
// ========================================
async function hasAdminRole(userId) {
    try {
        if (!client.isReady()) {
            console.log('⚠️ Bot non ancora pronto');
            return false;
        }

        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);
        const hasRole = member.roles.cache.has(ADMIN_ROLE_ID);
        
        console.log(`🔐 Verifica ruolo per ${member.user.tag}: ${hasRole ? '✅' : '❌'}`);
        return hasRole;
    } catch (error) {
        console.error('❌ Errore verifica ruolo:', error);
        return false;
    }
}

// ========================================
// MIDDLEWARE AUTH
// ========================================
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token mancante' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token non valido' });
    }
};

const verifyAdmin = async (req, res, next) => {
    const hasRole = await hasAdminRole(req.user.id);
    
    if (!hasRole) {
        return res.status(403).json({ error: 'Accesso negato - Ruolo Moderatore richiesto' });
    }
    next();
};

// ========================================
// API ENDPOINTS PUBBLICI
// ========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html')); // ✅ CORRETTO: docs/index.html
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        server_running: true,
        bot_ready: client.isReady(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/stats', (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(200).json({
                online: false,
                message: 'Bot is starting',
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

        res.status(200).json({
            online: true,
            servers: client.guilds.cache.size,
            users: totalUsers,
            commands: client.commands.size || 15,
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
            commands: 0
        });
    }
});

// ========================================
// API ENDPOINTS AUTH
// ========================================

app.get('/api/auth/login', (req, res) => {
    const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `https://discord-bot-bot-discord-kira.up.railway.app/api/auth/callback`;
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify+guilds.members.read`;
    res.redirect(authUrl);
});

app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bless3dd.github.io/discord-bot';

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/?error=no_code`);
    }

    try {
        const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `https://discord-bot-bot-discord-kira.up.railway.app/api/auth/callback`;

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI,
                scope: 'identify guilds.members.read'
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            return res.redirect(`${FRONTEND_URL}/?error=no_token`);
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        const hasRole = await hasAdminRole(userData.id);
        
        if (!hasRole) {
            return res.redirect(`${FRONTEND_URL}/?error=not_admin`);
        }

        const jwtToken = jwt.sign(
            {
                id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.redirect(`${FRONTEND_URL}/dashboard.html?token=${jwtToken}`);
    } catch (error) {
        console.error('❌ Errore OAuth:', error);
        res.redirect(`${FRONTEND_URL}/?error=auth_failed`);
    }
});

app.get('/api/auth/verify', verifyToken, async (req, res) => {
    const hasRole = await hasAdminRole(req.user.id);
    
    if (!hasRole) {
        return res.status(403).json({ error: 'Ruolo Moderatore rimosso' });
    }
    
    res.json({
        id: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar,
    });
});

// ========================================
// API ENDPOINTS DASHBOARD (PROTETTI)
// ========================================

app.get('/api/commands', verifyToken, verifyAdmin, (req, res) => {
    const commandsData = {};
    
    client.commands.forEach((cmd, name) => {
        commandsData[name] = {
            description: cmd.data?.description || 'Nessuna descrizione',
            enabled: cmd.enabled !== false
        };
    });

    res.json(commandsData);
});

app.put('/api/commands/:commandName', verifyToken, verifyAdmin, (req, res) => {
    const { commandName } = req.params;
    const { enabled } = req.body;

    const command = client.commands.get(commandName);
    
    if (!command) {
        return res.status(404).json({ error: 'Comando non trovato' });
    }

    command.enabled = enabled;
    
    res.json({ success: true, command: commandName, enabled });
});

app.post('/api/send-message', verifyToken, verifyAdmin, async (req, res) => {
    const { channelId, message } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Canale non trovato' });
        }

        if (!channel.isTextBased()) {
            return res.status(400).json({ success: false, error: 'Non è un canale di testo' });
        }

        await channel.send(message);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Errore invio messaggio:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/send-embed', verifyToken, verifyAdmin, async (req, res) => {
    const { channelId, embed } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Canale non trovato' });
        }

        if (!channel.isTextBased()) {
            return res.status(400).json({ success: false, error: 'Non è un canale di testo' });
        }

        await channel.send({ embeds: [embed] });
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Errore invio embed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// AVVIA SERVER EXPRESS
// ========================================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log(`🌐 API SERVER ATTIVO`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🛡️ Ruolo Admin: ${ADMIN_ROLE_ID || '⚠️ NON CONFIGURATO!'}`);
    console.log(`📊 Endpoints disponibili:`);
    console.log(`   → GET  /                      (homepage)`);
    console.log(`   → GET  /dashboard.html        (dashboard admin)`);
    console.log(`   → GET  /health                (health check)`);
    console.log(`   → GET  /api/stats             (statistiche bot)`);
    console.log(`   → GET  /api/auth/login        (login)`);
    console.log(`   → GET  /api/auth/callback     (OAuth callback)`);
    console.log(`   → GET  /api/commands          (lista comandi)`);
    console.log(`   → POST /api/send-message      (invia messaggio)`);
    console.log(`   → POST /api/send-embed        (invia embed)`);
    console.log('='.repeat(60));
});

server.on('error', (error) => {
    console.error('❌ ERRORE CRITICO SERVER:', error);
});

// ========================================
// CARICAMENTO BOT DISCORD
// ========================================
console.log('\n🤖 Inizializzazione bot Discord...\n');

try {
    eventHandler(client);
    console.log('✅ Event handlers caricati');
} catch (error) {
    console.error('⚠️ Errore event handlers:', error.message);
}

try {
    const voiceStatusUpdater = require('./events/voiceStatusUpdater');
    voiceStatusUpdater(client);
    console.log('✅ Voice Status Updater caricato');
} catch (error) {
    console.log('⚠️ Voice Status Updater non trovato');
}

try {
    const memberEvents = require('./events/memberEvents');
    memberEvents(client);
    console.log('✅ Member Events caricato');
} catch (error) {
    console.log('⚠️ Member Events non trovato');
}

try {
    const commandHandler = require('./events/commandHandler');
    client.on('interactionCreate', async (interaction) => {
        await commandHandler(interaction);
    });
    console.log('✅ Command Handler registrato');
} catch (error) {
    console.log('⚠️ Command Handler non trovato');
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
    });

client.once('ready', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BOT DISCORD ONLINE E OPERATIVO!');
    console.log('='.repeat(60));
    console.log(`👤 Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`📢 Server: ${client.guilds.cache.size}`);
    console.log(`👥 Utenti totali: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}`);
    console.log(`⚡ Comandi: ${client.commands.size}`);
    console.log(`📡 Ping: ${client.ws.ping}ms`);
    console.log('='.repeat(60) + '\n');
});

client.on('error', error => {
    console.error('❌ Errore Discord Client:', error);
});

client.on('warn', info => {
    console.warn('⚠️ Discord Warning:', info);
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
