const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const eventsPath = path.join(__dirname);
    const eventFiles = fs.readdirSync(eventsPath).filter(file => 
        file.endsWith('.js') && file !== 'eventHandler.js'
    );

    console.log('📋 Caricamento event handlers...');

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const eventHandler = require(filePath);
        const eventName = file.split('.')[0];

        console.log(`✅ Event handler caricato: ${eventName}`);

        if (eventName === 'interactionCreate') {
            client.on(eventName, async (interaction) => {
                await eventHandler(interaction);
            });
        } else if (eventName === 'ready') {
            client.once(eventName, () => eventHandler(client));
        } else {
            client.on(eventName, (...args) => eventHandler(client, ...args));
        }
    }
};
