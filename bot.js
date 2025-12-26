require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// ========================
// DISCORD BOT SETUP
// ========================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Carica comandi
const commandsPath = path.join(__dirname, 'src', 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Carica eventi
const eventsPath = path.join(__dirname, 'src', 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

// Login bot Discord
client.login(process.env.DISCORD_TOKEN).catch(console.error);

// ========================
// EXPRESS WEB SERVER
// ========================
const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `https://discord-bot-bot-discord-kira.up.railway.app/api/auth/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bless3dd.github.io/discord-bot';
const JWT_SECRET = process.env.JWT_SECRET || 'chiave-segreta-cambiami';
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];

app.use(cors());
app.use(express.json());

// Serve file statici dalla cartella docs
app.use(express.static(path.join(__dirname, 'docs')));

// ========================
// API ENDPOINTS
// ========================

// Login OAuth Discord
app.get('/api/auth/login', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds`;
    res.redirect(discordAuthUrl);
});

// Callback OAuth
app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${FRONTEND_URL}?error=no_code`);
    }

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI
            }), 
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;

        // Verifica admin
        if (!ADMIN_IDS.includes(userData.id)) {
            return res.redirect(`${FRONTEND_URL}?error=unauthorized`);
        }

        const token = jwt.sign(
            {
                id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.redirect(`${FRONTEND_URL}/dashboard.html?token=${token}`);
    } catch (error) {
        console.error('Errore OAuth:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}?error=auth_failed`);
    }
});

// Middleware JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token mancante' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token non valido' });
        req.user = user;
        next();
    });
}

// Verifica token
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({
        id: req.user.id,
        username: req.user.username,
        discriminator: req.user.discriminator,
        avatar: req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : null
    });
});

// Stats
app.get('/api/stats', (req, res) => {
    res.json({
        servers: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        commands: client.commands.size,
        online: client.isReady()
    });
});

// Comandi
app.get('/api/commands', verifyToken, (req, res) => {
    const commands = {};
    client.commands.forEach((cmd, name) => {
        commands[name] = {
            description: cmd.data.description,
            enabled: true
        };
    });
    res.json(commands);
});

// Aggiorna comando
app.put('/api/commands/:commandName', verifyToken, (req, res) => {
    const { commandName } = req.params;
    const { enabled } = req.body;
    
    console.log(`Comando ${commandName} ${enabled ? 'attivato' : 'disattivato'}`);
    res.json({ success: true, command: commandName, enabled });
});

// Invia messaggio
app.post('/api/send-message', verifyToken, async (req, res) => {
    const { channelId, message } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ success: false, error: 'Canale non trovato' });
        }

        await channel.send(message);
        res.json({ success: true, message: 'Messaggio inviato con successo' });
    } catch (error) {
        console.error('Errore invio messaggio:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Invia embed
app.post('/api/send-embed', verifyToken, async (req, res) => {
    const { channelId, embed } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ success: false, error: 'Canale non trovato' });
        }

        await channel.send({ embeds: [embed] });
        res.json({ success: true, message: 'Embed inviato con successo' });
    } catch (error) {
        console.error('Errore invio embed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback per SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Avvia server
app.listen(PORT, () => {
    console.log(`🌐 Server web avviato sulla porta ${PORT}`);
    console.log(`🤖 Bot Discord in avvio...`);
});
