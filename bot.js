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

client.on('ready', () => {
    console.log(`✅ Bot connesso come ${client.user.tag}`);
});

// ========================
// EXPRESS WEB SERVER
// ========================
const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://discord-bot-bot-discord-kira.up.railway.app/api/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bless3dd.github.io/discord-bot';
const JWT_SECRET = process.env.JWT_SECRET || 'chiave-segreta-cambiami';
const GUILD_ID = process.env.GUILD_ID;
const MOD_ROLE_ID = '1224070785325596792'; // ID del ruolo Moderatore

app.use(cors());
app.use(express.json());

// Serve file statici dalla cartella docs
app.use(express.static(path.join(__dirname, 'docs')));

// ========================
// API ENDPOINTS
// ========================

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'KyraBot API Online', 
        version: '1.0.0',
        bot: client.isReady() ? 'Online' : 'Offline'
    });
});

// Stats pubbliche
app.get('/api/stats', (req, res) => {
    try {
        res.json({
            servers: client.guilds.cache.size,
            users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            commands: client.commands.size,
            online: client.isReady()
        });
    } catch (error) {
        console.error('Errore stats:', error);
        res.status(500).json({ 
            servers: 0,
            users: 0,
            commands: 0,
            online: false,
            error: 'Errore nel recupero delle statistiche'
        });
    }
});

// Callback OAuth (CON CONTROLLO RUOLO MODERATORE)
app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        console.log('❌ Callback senza code');
        return res.redirect(`${FRONTEND_URL}/index.html?error=no_code`);
    }

    try {
        console.log('🔐 Tentativo di login OAuth...');

        // Ottieni access token
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
        console.log('✅ Access token ottenuto');

        // Ottieni dati utente
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;
        console.log(`🔐 Tentativo login: ${userData.username}#${userData.discriminator} (${userData.id})`);

        // Verifica se è nel server e ha il ruolo Moderatore
        if (!GUILD_ID) {
            console.error('❌ GUILD_ID non configurato nelle variabili d\'ambiente!');
            return res.status(500).send(`
                <!DOCTYPE html>
                <html lang="it">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Errore Configurazione - KyraBot</title>
                    <style>
                        body {
                            font-family: 'Inter', sans-serif;
                            background: #0a0118;
                            color: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 2rem;
                            margin: 0;
                        }
                        .error-box {
                            background: rgba(239, 68, 68, 0.1);
                            border: 2px solid #ef4444;
                            border-radius: 20px;
                            padding: 3rem;
                            text-align: center;
                            max-width: 600px;
                        }
                        h1 { color: #ef4444; margin-bottom: 1rem; font-size: 2rem; }
                        p { font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6; }
                        a {
                            display: inline-block;
                            background: linear-gradient(135deg, #8b5cf6, #6366f1);
                            padding: 1rem 2rem;
                            border-radius: 50px;
                            color: white;
                            text-decoration: none;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-box">
                        <h1>⚙️ Errore di Configurazione</h1>
                        <p>Il server non è configurato correttamente. GUILD_ID mancante.</p>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Contatta l'amministratore del sistema.</p>
                        <a href="${FRONTEND_URL}/index.html">← Torna alla Home</a>
                    </div>
                </body>
                </html>
            `);
        }

        try {
            const guild = await client.guilds.fetch(GUILD_ID);
            const member = await guild.members.fetch(userData.id);
            
            // Controlla se ha il ruolo Moderatore
            const hasModRole = member.roles.cache.has(MOD_ROLE_ID);

            console.log(`🔍 Verifica ruolo per ${userData.username}:`);
            console.log(`   - Nel server: ✅`);
            console.log(`   - Ha ruolo Moderatore (${MOD_ROLE_ID}): ${hasModRole ? '✅' : '❌'}`);

            if (!hasModRole) {
                console.log(`❌ Accesso negato: ${userData.username} non ha il ruolo Moderatore`);
                return res.status(403).send(`
                    <!DOCTYPE html>
                    <html lang="it">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Accesso Negato - KyraBot</title>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                                font-family: 'Inter', 'Segoe UI', sans-serif;
                                background: #0a0118;
                                color: white;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                padding: 2rem;
                            }
                            .error-box {
                                background: rgba(239, 68, 68, 0.1);
                                border: 2px solid rgba(239, 68, 68, 0.5);
                                border-radius: 20px;
                                padding: 3rem;
                                text-align: center;
                                max-width: 600px;
                                backdrop-filter: blur(10px);
                                animation: slideIn 0.5s ease;
                            }
                            @keyframes slideIn {
                                from { opacity: 0; transform: translateY(-30px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .icon { font-size: 5rem; margin-bottom: 1.5rem; }
                            h1 { color: #ef4444; margin-bottom: 1.5rem; font-size: 2.5rem; }
                            p { font-size: 1.2rem; margin-bottom: 2rem; line-height: 1.6; opacity: 0.9; }
                            strong { color: #8b5cf6; }
                            a {
                                display: inline-block;
                                background: linear-gradient(135deg, #8b5cf6, #6366f1);
                                padding: 1.2rem 2.5rem;
                                border-radius: 50px;
                                color: white;
                                text-decoration: none;
                                font-weight: bold;
                                font-size: 1.1rem;
                                transition: all 0.3s ease;
                                box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
                            }
                            a:hover {
                                transform: translateY(-5px);
                                box-shadow: 0 15px 40px rgba(139, 92, 246, 0.5);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="error-box">
                            <div class="icon">🚫</div>
                            <h1>Accesso Negato</h1>
                            <p>Devi avere il ruolo <strong>"Moderatore"</strong> nel server Discord per accedere alla dashboard.</p>
                            <p style="font-size: 1rem; opacity: 0.7;">Contatta un amministratore del server se pensi che questo sia un errore.</p>
                            <a href="${FRONTEND_URL}/index.html">← Torna alla Home</a>
                        </div>
                    </body>
                    </html>
                `);
            }

            // Utente autorizzato - crea JWT
            const token = jwt.sign(
                {
                    id: userData.id,
                    username: userData.username,
                    discriminator: userData.discriminator,
                    avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            console.log(`✅ Accesso autorizzato: ${userData.username}#${userData.discriminator}`);
            res.redirect(`${FRONTEND_URL}/dashboard.html?token=${token}`);

        } catch (guildError) {
            console.error('❌ Errore verifica ruolo:', guildError.message);
            return res.status(500).send(`
                <!DOCTYPE html>
                <html lang="it">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Errore - KyraBot</title>
                    <style>
                        body {
                            font-family: 'Inter', sans-serif;
                            background: #0a0118;
                            color: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 2rem;
                            margin: 0;
                        }
                        .error-box {
                            background: rgba(239, 68, 68, 0.1);
                            border: 2px solid #ef4444;
                            border-radius: 20px;
                            padding: 3rem;
                            text-align: center;
                            max-width: 600px;
                        }
                        h1 { color: #ef4444; margin-bottom: 1rem; font-size: 2rem; }
                        p { font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6; }
                        code {
                            background: rgba(0,0,0,0.3);
                            padding: 0.5rem 1rem;
                            border-radius: 8px;
                            display: block;
                            margin: 1rem 0;
                            font-size: 0.9rem;
                            color: #fbbf24;
                        }
                        a {
                            display: inline-block;
                            background: linear-gradient(135deg, #8b5cf6, #6366f1);
                            padding: 1rem 2rem;
                            border-radius: 50px;
                            color: white;
                            text-decoration: none;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-box">
                        <h1>❌ Errore</h1>
                        <p>Non sei nel server Discord o il bot non può verificare il tuo ruolo.</p>
                        <code>${guildError.message}</code>
                        <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 1rem;">
                            Assicurati di essere nel server Discord e che il bot abbia i permessi necessari.
                        </p>
                        <a href="${FRONTEND_URL}/index.html">← Torna alla Home</a>
                    </div>
                </body>
                </html>
            `);
        }

    } catch (error) {
        console.error('❌ Errore OAuth completo:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/index.html?error=auth_failed`);
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
        avatar: req.user.avatar
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
    const indexPath = path.join(__dirname, 'docs', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

// Avvia server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server web avviato sulla porta ${PORT}`);
    console.log(`📡 Redirect URI: ${DISCORD_REDIRECT_URI}`);
    console.log(`🌍 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🛡️  Ruolo Moderatore ID: ${MOD_ROLE_ID}`);
    console.log(`🤖 Bot Discord in avvio...`);
});
