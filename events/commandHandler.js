const moderationCommands = require('../commands/moderation');
const infoCommands = require('../commands/info');
const funCommands = require('../commands/fun');

module.exports = (client) => {
    // Crea una mappa di tutti i comandi
    const commands = new Map();
    
    [...moderationCommands, ...infoCommands, ...funCommands].forEach(cmd => {
        commands.set(cmd.data.name, cmd);
    });

    // Gestisci l'esecuzione dei comandi
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = commands.get(interaction.commandName);

        if (!command) {
            console.error(`Comando ${interaction.commandName} non trovato!`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Errore nell'esecuzione del comando ${interaction.commandName}:`, error);
            
            const errorMessage = { content: '❌ Si è verificato un errore durante l\'esecuzione del comando!', ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    });
};