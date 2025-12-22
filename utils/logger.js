const { LOG_CHANNEL_ID } = require('../config');

async function sendLog(client, embed) {
    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Errore nell\'invio del log:', error);
    }
}

module.exports = { sendLog };