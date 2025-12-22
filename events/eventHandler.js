const memberEvents = require('./memberEvents');
const messageEvents = require('./messageEvents');
const channelEvents = require('./channelEvents');
const commandHandler = require('./commandHandler');

module.exports = (client) => {
    // Eventi membri
    memberEvents(client);
    
    // Eventi messaggi
    messageEvents(client);
    
    // Eventi canali
    channelEvents(client);
    
    // Gestione comandi slash
    commandHandler(client);
};