// events/voiceStatusUpdater.js
const { ActivityType, ChannelType } = require('discord.js');

module.exports = (client) => {
    
    // Funzione per aggiornare lo status del bot
    async function updateBotStatus() {
        try {
            // Prendi il primo server (o quello specifico se vuoi)
            const guild = client.guilds.cache.first();
            if (!guild) return;

            // Conta tutti gli utenti nei canali vocali (esclusi i bot)
            let totalInVoice = 0;
            
            guild.channels.cache
                .filter(channel => channel.type === ChannelType.GuildVoice)
                .forEach(channel => {
                    totalInVoice += channel.members.filter(member => !member.user.bot).size;
                });

            // Aggiorna lo status del bot
            client.user.setPresence({
                activities: [{
                    name: `${totalInVoice} ${totalInVoice === 1 ? 'utente' : 'utenti'} in vocale 🎤`,
                    type: ActivityType.Watching // Puoi cambiare con: Playing, Streaming, Listening, Watching, Competing
                }],
                status: 'online' // online, idle, dnd, invisible
            });

            console.log(`🔄 Status aggiornato: ${totalInVoice} utenti in vocale`);

        } catch (error) {
            console.error('❌ Errore aggiornamento status bot:', error);
        }
    }

    // Aggiorna quando il bot è pronto
    client.once('ready', () => {
        console.log('✅ Bot pronto! Avvio aggiornamento status...');
        updateBotStatus();
        
        // Aggiorna ogni 30 secondi per sicurezza
        setInterval(updateBotStatus, 30000);
    });

    // Aggiorna quando qualcuno entra/esce da un canale vocale
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // Solo se qualcuno si connette o disconnette
        if (oldState.channelId !== newState.channelId) {
            await updateBotStatus();
        }
    });

    // Aggiorna quando il bot entra in un nuovo server
    client.on('guildCreate', () => {
        updateBotStatus();
    });
};