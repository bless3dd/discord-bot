// events/memberEvents.js

// ID RUOLI HARDCODED
const ROLE_VERIFICATO = '1397004446365384835';      // Ruolo Verificato da aggiungere
const ROLE_NON_VERIFICATO = '1447612498562777231';  // Ruolo Non Verificato da rimuovere

module.exports = (client) => {
  console.log('✅ memberEvents.js caricato con role swap automatico');
  console.log(`🔑 ROLE_VERIFICATO: ${ROLE_VERIFICATO}`);
  console.log(`🔑 ROLE_NON_VERIFICATO: ${ROLE_NON_VERIFICATO}`);

  // Quando un nuovo membro entra nel server
  client.on('guildMemberAdd', async (member) => {
    console.log(`✅ ${member.user.tag} è entrato nel server ${member.guild.name}`);
    
    const welcomeChannelId = '1320536953761828876';
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    
    if (welcomeChannel) {
      welcomeChannel.send(`Benvenuto ${member} nel server! 🎉`);
    }
  });

  // Quando un membro lascia il server
  client.on('guildMemberRemove', (member) => {
    console.log(`❌ ${member.user.tag} ha lasciato il server ${member.guild.name}`);
    
    const goodbyeChannelId = '1414715884882104370';
    const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);
    
    if (goodbyeChannel) {
      goodbyeChannel.send(`${member.user.tag} ha lasciato il server. Addio! 👋`);
    }
  });

  // 🔥 ROLE SWAP AUTOMATICO - Quando un membro aggiorna il profilo
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    console.log(`\n📢 === guildMemberUpdate per ${newMember.user.tag} ===`);
    
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    console.log(`📋 Ruoli vecchi (${oldRoles.size}):`);
    oldRoles.forEach(r => console.log(`   - ${r.name} (${r.id})`));
    
    console.log(`📋 Ruoli nuovi (${newRoles.size}):`);
    newRoles.forEach(r => console.log(`   - ${r.name} (${r.id})`));

    // Trova i ruoli aggiunti
    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    console.log(`➕ Ruoli aggiunti: ${addedRoles.size}`);
    addedRoles.forEach(r => console.log(`   ✨ ${r.name} (${r.id})`));

    // 🎯 CONTROLLO: È stato aggiunto il ruolo "Verificato"?
    console.log(`\n🔍 Controllo se è stato aggiunto il ruolo Verificato (${ROLE_VERIFICATO})...`);
    
    if (addedRoles.has(ROLE_VERIFICATO)) {
      console.log(`\n✅✅✅ TROVATO! Ruolo Verificato aggiunto a ${newMember.user.tag}`);
      
      // Controlla se ha ancora il ruolo "Non Verificato"
      console.log(`🔍 Controllo se ha ancora il ruolo Non Verificato (${ROLE_NON_VERIFICATO})...`);
      
      if (newMember.roles.cache.has(ROLE_NON_VERIFICATO)) {
        console.log(`\n🔄🔄🔄 RIMOZIONE IN CORSO del ruolo Non Verificato da ${newMember.user.tag}...`);
        
        try {
          await newMember.roles.remove(ROLE_NON_VERIFICATO);
          console.log(`✅✅✅ SUCCESSO! Rimosso ruolo Non Verificato da ${newMember.user.tag}\n`);
        } catch (error) {
          console.error('❌❌❌ ERRORE nella rimozione del ruolo Non Verificato:', error);
        }
      } else {
        console.log(`ℹ️ ${newMember.user.tag} NON ha il ruolo Non Verificato da rimuovere\n`);
      }
    } else {
      console.log(`ℹ️ Nessun ruolo Verificato aggiunto in questo update\n`);
    }

    // Log cambio nickname
    if (oldMember.nickname !== newMember.nickname) {
      console.log(`📝 Cambio nickname da "${oldMember.nickname || 'Nessuno'}" a "${newMember.nickname || 'Nessuno'}"`);
    }
  });

  // Quando un membro viene bannato
  client.on('guildBanAdd', (ban) => {
    console.log(`🔨 ${ban.user.tag} è stato bannato dal server`);
  });

  // Quando un ban viene rimosso
  client.on('guildBanRemove', (ban) => {
    console.log(`✅ Il ban di ${ban.user.tag} è stato rimosso`);
  });
};