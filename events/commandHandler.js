const fs = require('fs');
const path = require('path');

// Carica tutti i comandi dinamicamente
const commands = new Map();
const commandsPath = path.join(__dirname, '..', 'commands');

// Leggi tutti i file .js nella cartella commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📂 Caricamento comandi da commandHandler...');

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = require(filePath);
    
    if (Array.isArray(commandModule)) {
        commandModule.forEach(cmd => {
            commands.set(cmd.data.name, cmd);
            console.log(`✅ Comando caricato: ${cmd.data.name}`);
        });
    }
}

module.exports = async (interaction) => {
    console.log('🔔 Interazione ricevuta:', interaction.type);
    
    if (!interaction.isCommand()) {
        console.log('❌ Non è un comando');
        return;
    }

    console.log('📝 Comando richiesto:', interaction.commandName);

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ Comando ${interaction.commandName} non trovato nella mappa`);
        console.log('Comandi disponibili:', Array.from(commands.keys()));
        return;
    }

    console.log('✅ Comando trovato, esecuzione...');

    try {
        await command.execute(interaction);
        console.log('✅ Comando eseguito con successo');
    } catch (error) {
        console.error('❌ Errore durante l\'esecuzione del comando:', error);
        
        try {
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
        } catch (replyError) {
            console.error('❌ Errore anche nel rispondere:', replyError);
        }
    }
};
