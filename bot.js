// Callback OAuth
app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/index.html?error=no_code`);
    }

    try {
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

        // Ottieni dati utente
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;
        console.log(`🔐 Tentativo login: ${userData.username}#${userData.discriminator}`);

        // Verifica se è nel server e ha il ruolo Moderatore
        const GUILD_ID = process.env.GUILD_ID || '1224070785325596792'; // Metti qui il tuo GUILD_ID
        const MOD_ROLE_ID = '1224070785325596792';

        try {
            const guild = await client.guilds.fetch(GUILD_ID);
            const member = await guild.members.fetch(userData.id);
            
            // Controlla se ha il ruolo Moderatore
            const hasModRole = member.roles.cache.has(MOD_ROLE_ID);

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
                            body {
                                font-family: 'Inter', sans-serif;
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
                            }
                            .icon { font-size: 5rem; margin-bottom: 1.5rem; }
                            h1 { color: #ef4444; margin-bottom: 1.5rem; font-size: 2.5rem; }
                            p { font-size: 1.2rem; margin-bottom: 2rem; line-height: 1.6; }
                            strong { color: #8b5cf6; }
                            a {
                                display: inline-block;
                                background: linear-gradient(135deg, #8b5cf6, #6366f1);
                                padding: 1.2rem 2.5rem;
                                border-radius: 50px;
                                color: white;
                                text-decoration: none;
                                font-weight: bold;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="error-box">
                            <div class="icon">🚫</div>
                            <h1>Accesso Negato</h1>
                            <p>Devi avere il ruolo <strong>"Moderatore"</strong> nel server Discord per accedere alla dashboard.</p>
                            <a href="https://bless3dd.github.io/discord-bot/index.html">← Torna alla Home</a>
                        </div>
                    </body>
                    </html>
                `);
            }

            // Utente autorizzato - crea JWT
            const JWT_SECRET = process.env.JWT_SECRET || 'chiave-segreta-cambiami';
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
            res.redirect(`https://bless3dd.github.io/discord-bot/dashboard.html?token=${token}`);

        } catch (guildError) {
            console.error('❌ Errore verifica ruolo:', guildError.message);
            return res.status(500).send(`
                <!DOCTYPE html>
                <html lang="it">
                <head>
                    <meta charset="UTF-8">
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
                        }
                        .error-box {
                            background: rgba(239, 68, 68, 0.1);
                            border: 2px solid #ef4444;
                            border-radius: 20px;
                            padding: 3rem;
                            text-align: center;
                            max-width: 600px;
                        }
                        h1 { color: #ef4444; margin-bottom: 1rem; }
                        p { font-size: 1.1rem; margin-bottom: 2rem; }
                        code {
                            background: rgba(0,0,0,0.3);
                            padding: 0.5rem 1rem;
                            border-radius: 8px;
                            display: block;
                            margin: 1rem 0;
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
                        <a href="https://bless3dd.github.io/discord-bot/index.html">← Torna alla Home</a>
                    </div>
                </body>
                </html>
            `);
        }

    } catch (error) {
        console.error('❌ Errore OAuth:', error.response?.data || error.message);
        res.redirect(`https://bless3dd.github.io/discord-bot/index.html?error=auth_failed`);
    }
});
