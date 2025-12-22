require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { TOKEN } = require('./config');
const { registerCommands } = require('./utils/registerCommands');
const eventHandler = require('./events/eventHandler');

// Configurazione del client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates // Aggiunto per monitorare le voice chat
    ]
});

// Funzione per contare utenti in voice
function updateVoiceStatus() {
    let totalVoiceUsers = 0;
    
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if (channel.isVoiceBased()) {
                totalVoiceUsers += channel.members.size;
            }
        });
    });
    
    client.user.setActivity(`${totalVoiceUsers} utenti in voice`, { 
        type: ActivityType.Watching 
    });
}

// Registra tutti gli eventi
eventHandler(client);

// Quando il bot è pronto
client.once('ready', async () => {
    console.log(`✅ Bot online come ${client.user.tag}`);
    
    // Aggiorna subito il conteggio
    updateVoiceStatus();
    
    // Aggiorna ogni 30 secondi
    setInterval(updateVoiceStatus, 30000);
    
    // Registra i comandi slash
    await registerCommands(client);
});

// Aggiorna quando qualcuno entra/esce da una voice
client.on('voiceStateUpdate', () => {
    updateVoiceStatus();
});

// Login
client.login(TOKEN);