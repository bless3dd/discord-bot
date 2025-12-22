const { REST, Routes } = require('discord.js');
const { CLIENT_ID, GUILD_ID, TOKEN } = require('../config');
const moderationCommands = require('../commands/moderation.js');
const infoCommands = require('../commands/info.js');
const funCommands = require('../commands/fun.js');

async function registerCommands(client) {
    try {
        console.log('📋 Registrazione comandi slash...');

        const commands = [
            ...moderationCommands.map(cmd => cmd.data.toJSON()),
            ...infoCommands.map(cmd => cmd.data.toJSON()),
            ...funCommands.map(cmd => cmd.data.toJSON())
        ];

        const rest = new REST({ version: '10' }).setToken(TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log('✅ Comandi slash registrati con successo!');
    } catch (error) {
        console.error('❌ Errore nella registrazione dei comandi:', error);
    }
}

module.exports = { registerCommands };
