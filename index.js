require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./config');
const eventHandler = require('./events/eventHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();

// Carica gli event handlers
eventHandler(client);

// Aggiungi manualmente l'evento interactionCreate
const commandHandler = require('./events/commandHandler');

client.on('interactionCreate', async (interaction) => {
    console.log('🔔 Interazione ricevuta in index.js');
    await commandHandler(interaction);
});

client.login(TOKEN);
