const fs = require('fs');
const path = require('path');

// Carica tutti i comandi dinamicamente
const commands = new Map();
const commandsPath = path.join(__dirname, '..', 'commands');

// Leggi tutti i file .js nella cartella commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = require(filePath);
    
    if (Array.isArray(commandModule)) {
        commandModule.forEach(cmd => {
            commands.set(cmd.data.name, cmd);
        });
    }
}

module.exports = async (client, interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`Comando ${interaction.commandName} non trovato`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Errore durante l\'esecuzione del comando:', error);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Si è verificato un errore durante l\'esecuzione del comando!',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ Si è verificato un errore durante l\'esecuzione del comando!',
                ephemeral: true
            });
        }
    }
};
