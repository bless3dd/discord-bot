// events/voiceStatusUpdater.js
const { ActivityType, ChannelType } = require('discord.js');
const { GUILD_ID } = require('../config');

module.exports = (client) => {
    
    // Funzione per aggiornare lo status del bot
    async function updateBotStatus() {
        try {
            console.log('🔍 Tentativo di aggiornare lo status...');
            console.log('🤖 Bot user:', client.user?.tag);
            
            // Usa il GUILD_ID dal config
            const guild = client.guilds.cache.get(GUILD_ID);
            
            if (!guild) {
                console.log('⚠️ Server non trovato! GUILD_ID:', GUILD_ID);
                console.log('📋 Server disponibili:', client.guilds.cache.map(g => `${g.name} (${g.id})`).join(', '));
                return;
            }

            console.log('✅ Server trovato:', guild.name);

            // Conta tutti gli utenti nei canali vocali (esclusi i bot)
            let totalInVoice = 0;
            
            console.log('🎤 Scansione canali vocali...');
            guild.channels.cache.forEach(channel => {
                if (channel.type === ChannelType.GuildVoice) {
                    const voiceMembers = channel.members.filter(member => !member.user.bot);
                    totalInVoice += voiceMembers.size;
                    
                    console.log(`  - ${channel.name}: ${voiceMembers.size} utenti`);
                }
            });

            console.log(`📊 TOTALE utenti in vocale: ${totalInVoice}`);

            // Prova diversi metodi per impostare lo status
            const statusText = `${totalInVoice} utenti in vocale 🎤`;
            
            console.log('🔄 Impostazione status:', statusText);
            
            // Metodo 1: setActivity
            client.user.setActivity(statusText, { 
                type: ActivityType.Watching 
            });
            
            console.log('✅ Status impostato con successo!');
            console.log('👀 Controlla Discord ora!');

        } catch (error) {
            console.error('❌ ERRORE aggiornamento status:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    // Aggiorna quando il bot è pronto
    client.once('ready', async () => {
        console.log('');
        console.log('═══════════════════════════════════');
        console.log('✅ BOT ONLINE E PRONTO!');
        console.log('🤖 Nome:', client.user.tag);
        console.log('🆔 ID:', client.user.id);
        console.log('═══════════════════════════════════');
        console.log('');
        
        // Aspetta 2 secondi per assicurarsi che tutto sia caricato
        setTimeout(async () => {
            console.log('🚀 Avvio primo aggiornamento status...');
            await updateBotStatus();
        }, 2000);
        
        // Aggiorna ogni 30 secondi
        setInterval(async () => {
            console.log('⏰ Aggiornamento automatico status...');
            await updateBotStatus();
        }, 30000);
    });

    // Aggiorna quando qualcuno entra/esce da un canale vocale
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // Solo se qualcuno si connette o disconnette
        if (oldState.channelId !== newState.channelId) {
            const user = newState.member.user;
            if (newState.channelId) {
                console.log(`🎤 ${user.tag} è entrato in vocale`);
            } else {
                console.log(`🔇 ${user.tag} è uscito dalla vocale`);
            }
            await updateBotStatus();
        }
    });
};
