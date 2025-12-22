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
const voiceStatusUpdater = require('./events/voiceStatusUpdater');
voiceStatusUpdater(client);
console.log('✅ Voice Status Updater caricato manualmente');

// Carica manualmente i member events (per il role swap)
const memberEvents = require('./events/memberEvents');
memberEvents(client);
console.log('✅ Member Events caricato manualmente');

// Aggiungi manualmente l'evento interactionCreate
const commandHandler = require('./events/commandHandler');

client.on('interactionCreate', async (interaction) => {
    console.log('📢 Interazione ricevuta in index.js');
    await commandHandler(interaction);
});

// ========================================
// API ENDPOINT PER STATISTICHE
// ========================================
app.get('/api/stats', (req, res) => {
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
});

// Endpoint homepage
app.get('/', (req, res) => {
    res.send('✅ KyraBot API is running! Visit /api/stats for statistics.');
});

// Avvia il server API
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`📡 API Stats attiva su porta ${PORT}`);
    console.log(`🌐 API disponibile su /api/stats`);
});

// ========================================
// LOGIN DEL BOT
// ========================================
client.login(TOKEN).then(() => {
    console.log('🔐 Login effettuato con successo!');
}).catch(error => {
    console.error('❌ Errore durante il login:', error);
});
```

4. Scroll giù → **Commit changes**
5. ✅ Fatto!

---

### **STEP 2: Railway fa il deploy automatico** 🚂

Dopo aver fatto i commit su GitHub:

1. **Railway rileva i cambiamenti automaticamente** (ci vogliono 10-30 secondi)
2. **Railway fa il re-deploy del bot** (ci vogliono 1-2 minuti)
3. **Installa le nuove dipendenze** (`express` e `cors`)
4. **Riavvia il bot con l'API attiva**

**Dove vedere il progresso:**
- Vai su **Railway Dashboard**
- Clicca sul tuo progetto bot
- Vedrai "Deploying..." e poi "Active" ✅

---

### **STEP 3: Trova l'URL di Railway** 🌐

1. Nel **Railway Dashboard**, clicca sul tuo progetto bot
2. Vai su **Settings** (in alto)
3. Clicca su **Networking** o **Domains**
4. Copia l'URL che vedi (sarà tipo):
   - `kyrabot-production.up.railway.app`
   - `discord-bot.railway.app`
   - O simile

---

### **STEP 4: Testa che funzioni** ✅

Apri il browser e vai su:
```
https://TUO-URL.railway.app/api/stats
