// server.js - Backend con MongoDB
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Discord OAuth Config
const DISCORD_CONFIG = {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
    scope: 'identify guilds'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID || '1234567890';
const GUILD_ID = process.env.GUILD_ID || '1234567890';

// Middleware autenticazione
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token mancante' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token non valido' });
        }
        req.user = user;
        next();
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Discord OAuth
app.get('/auth/discord', (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CONFIG.clientId}&redirect_uri=${encodeURIComponent(DISCORD_CONFIG.redirectUri)}&response_type=code&scope=${DISCORD_CONFIG.scope}`;
    res.redirect(authUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    try {
        // Scambia code per access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: DISCORD_CONFIG.clientId,
                client_secret: DISCORD_CONFIG.clientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_CONFIG.redirectUri
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token } = tokenResponse.data;

        // Ottieni info utente
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const user = userResponse.data;

        // Verifica server membership
        const guildsResponse = await axios.get(`https://discord.com/api/users/@me/guilds`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const isInGuild = guildsResponse.data.some(guild => guild.id === GUILD_ID);
        
        if (!isInGuild) {
            return res.redirect(`${process.env.FRONTEND_URL}?error=not_in_guild`);
        }

        // Verifica ruolo
        const memberResponse = await axios.get(
            `https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`,
            {
                headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            }
        );

        const member = memberResponse.data;

        if (!member.roles.includes(REQUIRED_ROLE_ID)) {
            return res.redirect(`${process.env.FRONTEND_URL}?error=insufficient_permissions`);
        }

        // Determina ruolo
        let userRole = 'Moderatore';
        if (member.roles.includes(process.env.ADMIN_ROLE_ID)) {
            userRole = 'Amministratore';
        } else if (member.roles.includes(process.env.MANAGER_ROLE_ID)) {
            userRole = 'Manager';
        }

        // Crea JWT
        const jwtToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
                role: userRole
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?token=${jwtToken}`);

    } catch (error) {
        console.error('Errore OAuth:', error.response?.data || error.message);
        res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
    }
});

// API: Verifica token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json(req.user);
});

// API: Stats
app.get('/api/stats', async (req, res) => {
    try {
        const commands = await db.getAllCommands();
        res.json({
            online: true,
            servers: 150,
            users: 50000,
            commands: Object.keys(commands).length
        });
    } catch (error) {
        res.status(500).json({ error: 'Errore caricamento stats' });
    }
});

// API: Get Commands
app.get('/api/commands', authenticateToken, async (req, res) => {
    try {
        const commands = await db.getAllCommands();
        res.json(commands);
    } catch (error) {
        res.status(500).json({ error: 'Errore caricamento comandi' });
    }
});

// API: Update Command
app.put('/api/commands/:command', authenticateToken, async (req, res) => {
    const { command } = req.params;
    const { enabled } = req.body;

    try {
        const success = await db.updateCommand(command, enabled);
        
        if (!success) {
            return res.status(404).json({ error: 'Comando non trovato' });
        }

        res.json({ success: true, command, enabled });
    } catch (error) {
        res.status(500).json({ error: 'Errore aggiornamento comando' });
    }
});

// API: Get Settings
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await db.getAllSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Errore caricamento settings' });
    }
});

// API: Save Settings
app.post('/api/settings', authenticateToken, async (req, res) => {
    const { type, value } = req.body;

    try {
        let success;
        
        switch(type) {
            case 'prefix':
                success = await db.updateSetting('prefix', value);
                break;
            case 'welcome':
                await db.updateSetting('welcomeChannel', value.channel);
                success = await db.updateSetting('welcomeMessage', value.message);
                break;
            default:
                return res.status(400).json({ error: 'Tipo impostazione non valido' });
        }

        if (success) {
            res.json({ success: true, type, value });
        } else {
            res.status(500).json({ error: 'Errore salvataggio' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Errore salvataggio settings' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
async function startServer() {
    try {
        await db.connectDB();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server avviato su porta ${PORT}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
            console.log(`🔗 OAuth Redirect: ${DISCORD_CONFIG.redirectUri}`);
        });
    } catch (error) {
        console.error('❌ Errore avvio server:', error);
        process.exit(1);
    }
}

startServer();

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Errore interno del server' });
});
