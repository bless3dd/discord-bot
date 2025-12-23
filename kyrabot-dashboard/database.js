// database.js - MongoDB Connection
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('kyrabot');
        console.log('✅ Database connesso');
        
        // Inizializza collezioni
        await initializeCollections();
    } catch (error) {
        console.error('❌ Errore database:', error);
        process.exit(1);
    }
}

async function initializeCollections() {
    // Crea indici se non esistono
    await db.collection('commands').createIndex({ name: 1 }, { unique: true });
    await db.collection('settings').createIndex({ key: 1 }, { unique: true });
    
    // Inizializza comandi default se il database è vuoto
    const commandsCount = await db.collection('commands').countDocuments();
    if (commandsCount === 0) {
        const defaultCommands = [
            { name: 'ping', enabled: true, description: 'Controlla la latenza del bot' },
            { name: 'help', enabled: true, description: 'Mostra tutti i comandi disponibili' },
            { name: 'ban', enabled: true, description: 'Banna un utente dal server' },
            { name: 'unban', enabled: true, description: 'Rimuove il ban a un utente' },
            { name: 'kick', enabled: true, description: 'Espelle un utente dal server' },
            { name: 'timeout', enabled: true, description: 'Mette in timeout un utente' },
            { name: 'warn', enabled: true, description: 'Avverte un utente' },
            { name: 'warnings', enabled: true, description: 'Visualizza gli avvertimenti' },
            { name: 'clear', enabled: true, description: 'Elimina messaggi in bulk' },
            { name: 'slowmode', enabled: true, description: 'Imposta la modalità lenta' },
            { name: 'poll', enabled: true, description: 'Crea un sondaggio interattivo' },
            { name: '8ball', enabled: true, description: 'Consulta la palla magica' },
            { name: 'say', enabled: true, description: 'Fai ripetere un messaggio al bot' },
            { name: 'userinfo', enabled: true, description: 'Info dettagliate su un utente' },
            { name: 'serverinfo', enabled: true, description: 'Info complete sul server' },
            { name: 'avatar', enabled: true, description: 'Mostra l\'avatar di un utente' }
        ];
        
        await db.collection('commands').insertMany(defaultCommands);
        console.log('✅ Comandi inizializzati');
    }
    
    // Inizializza settings default
    const settingsCount = await db.collection('settings').countDocuments();
    if (settingsCount === 0) {
        const defaultSettings = [
            { key: 'prefix', value: '/' },
            { key: 'welcomeChannel', value: null },
            { key: 'welcomeMessage', value: 'Benvenuto {user}!' }
        ];
        
        await db.collection('settings').insertMany(defaultSettings);
        console.log('✅ Settings inizializzate');
    }
}

// Commands
async function getAllCommands() {
    const commands = await db.collection('commands').find({}).toArray();
    const commandsObj = {};
    commands.forEach(cmd => {
        commandsObj[cmd.name] = {
            enabled: cmd.enabled,
            description: cmd.description
        };
    });
    return commandsObj;
}

async function updateCommand(name, enabled) {
    const result = await db.collection('commands').updateOne(
        { name },
        { $set: { enabled } }
    );
    return result.modifiedCount > 0;
}

async function isCommandEnabled(name) {
    const command = await db.collection('commands').findOne({ name });
    return command ? command.enabled : false;
}

// Settings
async function getSetting(key) {
    const setting = await db.collection('settings').findOne({ key });
    return setting ? setting.value : null;
}

async function updateSetting(key, value) {
    const result = await db.collection('settings').updateOne(
        { key },
        { $set: { value } },
        { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
}

async function getAllSettings() {
    const settings = await db.collection('settings').find({}).toArray();
    const settingsObj = {};
    settings.forEach(s => {
        settingsObj[s.key] = s.value;
    });
    return settingsObj;
}

module.exports = {
    connectDB,
    getAllCommands,
    updateCommand,
    isCommandEnabled,
    getSetting,
    updateSetting,
    getAllSettings
};
