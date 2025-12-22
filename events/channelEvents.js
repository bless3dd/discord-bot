module.exports = (client) => {
  // Quando viene creato un canale
  client.on('channelCreate', (channel) => {
    console.log(`➕ Nuovo canale creato: #${channel.name} (${channel.type})`);
  });

  // Quando viene eliminato un canale
  client.on('channelDelete', (channel) => {
    console.log(`➖ Canale eliminato: #${channel.name}`);
  });

  // Quando viene aggiornato un canale
  client.on('channelUpdate', (oldChannel, newChannel) => {
    if (oldChannel.name !== newChannel.name) {
      console.log(`📝 Canale rinominato: #${oldChannel.name} → #${newChannel.name}`);
    }
  });

  // Quando i pin di un canale vengono aggiornati
  client.on('channelPinsUpdate', (channel, time) => {
    console.log(`📌 Pin aggiornati in #${channel.name}`);
  });
};