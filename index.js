require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./config');
const eventHandler = require('./events/eventHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,  // IMPORTANTE per memberEvents!
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

// Login del bot
client.login(TOKEN).then(() => {
    console.log('🔐 Login effettuato con successo!');
}).catch(error => {
    console.error('❌ Errore durante il login:', error);
});