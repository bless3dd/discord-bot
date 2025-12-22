// events/voiceStatusUpdater.js
const { ActivityType, ChannelType } = require('discord.js');

module.exports = (client) => {
    console.log('[VOICE STATUS] ✅ Modulo caricato');
    
    // Funzione per aggiornare lo status del bot
    async function updateBotStatus() {
        try {
            let totalInVoice = 0;
            
            // Conta utenti in TUTTI i server dove il bot è presente
            client.guilds.cache.forEach(guild => {
                guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildVoice)
                    .forEach(channel => {
                        totalInVoice += channel.members.filter(m => !m.user.bot).size;
                    });
            });

            // Aggiorna lo status del bot
            await client.user.setPresence({
                activities: [{
                    name: `${totalInVoice} in VC`,
                    type: ActivityType.Watching
                }],
                status: 'online'
            });

            console.log(`[VOICE STATUS] ✅ Status aggiornato: Watching ${totalInVoice} in VC`);

        } catch (error) {
            console.error('[VOICE STATUS] ❌ Errore:', error.message);
        }
    }
    
    // Aspetta che il bot sia pronto
    client.once('ready', () => {
        console.log('[VOICE STATUS] 🚀 Bot pronto! Avvio updater...');
        
        // Primo aggiornamento dopo 3 secondi
        setTimeout(() => {
            updateBotStatus();
            
            // Poi aggiorna ogni 30 secondi
            setInterval(updateBotStatus, 30000);
            console.log('[VOICE STATUS] ⏰ Aggiornamento automatico attivo (ogni 30s)');
        }, 3000);
    });

    // Aggiorna quando qualcuno entra/esce da un canale vocale
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (oldState.channelId !== newState.channelId) {
            console.log('[VOICE STATUS] 🎤 Voice state cambiato, aggiorno...');
            updateBotStatus();
        }
    });
    
    console.log('[VOICE STATUS] ✅ Listener registrati con successo');
};