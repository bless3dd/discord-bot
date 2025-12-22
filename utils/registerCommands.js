const { REST, Routes } = require('discord.js');
const { CLIENT_ID, GUILD_ID, TOKEN } = require('../config');
const fs = require('fs');
const path = require('path');

async function registerCommands(client) {
    try {
        console.log('📋 Registrazione comandi slash...');

        const commands = [];
        const commandsPath = path.join(__dirname, '..', 'commands');
        
        // Leggi tutti i file .js nella cartella commands
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        console.log('File trovati:', commandFiles);
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const commandModule = require(filePath);
            
            if (Array.isArray(commandModule)) {
                commands.push(...commandModule.map(cmd => cmd.data.toJSON()));
            }
        }

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
