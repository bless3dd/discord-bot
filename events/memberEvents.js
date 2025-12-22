module.exports = (client) => {
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

  // Quando un membro aggiorna il profilo (nickname, ruoli, ecc.)
  client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
      console.log(`📝 ${newMember.user.tag} ha cambiato nickname da "${oldMember.nickname || 'Nessuno'}" a "${newMember.nickname || 'Nessuno'}"`);
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