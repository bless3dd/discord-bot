// events/ready.js
module.exports = (client) => {
    console.log(`✅ Bot online come ${client.user.tag}`);
    console.log(`📊 Server: ${client.guilds.cache.size}`);
    console.log(`👥 Utenti: ${client.users.cache.size}`);
};