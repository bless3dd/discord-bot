module.exports = (client) => {
  // Quando viene inviato un messaggio
  client.on('messageCreate', (message) => {
    // Ignora i messaggi dei bot
    if (message.author.bot) return;
    
    // Log dei messaggi (opzionale)
    console.log(`💬 ${message.author.tag} in #${message.channel.name}: ${message.content}`);
    
    // Esempio: risposta automatica a parole specifiche
    // if (message.content.toLowerCase().includes('ciao')) {
    //   message.reply('Ciao! 👋');
    // }
  });

  // Quando un messaggio viene eliminato
  client.on('messageDelete', (message) => {
    if (message.partial) return;
    console.log(`🗑️ Messaggio eliminato in #${message.channel.name}: ${message.content}`);
  });

  // Quando un messaggio viene modificato
  client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.content === newMessage.content) return;
    
    console.log(`✏️ Messaggio modificato in #${newMessage.channel.name}:`);
    console.log(`   Prima: ${oldMessage.content}`);
    console.log(`   Dopo: ${newMessage.content}`);
  });
};