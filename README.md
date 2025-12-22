# 🤖 KyraBot - Discord Bot

<div align="center">

![KyraBot Avatar](https://media.discordapp.net/attachments/1321974148917887008/1452750406001365075/avatar.gif?ex=694af2bf&is=6949a13f&hm=2d8512db321860e698252a68a94f1d9a3454fdccce51eb8b9c90f380d3dab439&=)

**Bot Discord privato per moderazione e gestione server**

[![Status](https://img.shields.io/badge/status-online-brightgreen?style=for-the-badge)](https://github.com/bless3dd/discord-bot)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge&logo=discord)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node.js-v18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-private-red?style=for-the-badge)](LICENSE)

[🌐 Visualizza Sito Web](#) • [📋 Comandi](#-comandi) • [⚙️ Installazione](#️-installazione)

</div>

---

## 🌐 Sito Web

Visualizza tutte le informazioni del bot sul sito ufficiale:

**👉 [Clicca qui per visitare il sito](https://bless3dd.github.io/discord-bot/)**

### 📸 Anteprima Sito

<div align="center">

![Website Preview](https://via.placeholder.com/800x450/667eea/ffffff?text=KyraBot+Website+Preview)

*Design moderno con animazioni e status in tempo reale*

</div>

---

## ✨ Funzionalità

### 🛡️ **Moderazione Avanzata**
- Ban/Unban utenti
- Kick membri
- Timeout temporanei
- Sistema di warn con tracking
- Gestione avvertimenti

### 🎤 **Voice Tracking**
- Monitoraggio utenti in vocale in tempo reale
- Status bot aggiornato automaticamente
- Contatore visibile: "Watching X in VC"

### 💬 **Gestione Server**
- Pulizia messaggi bulk (clear)
- Slow mode configurabile
- Informazioni server dettagliate
- Informazioni utente

### 🎮 **Utilità & Divertimento**
- Sondaggi interattivi
- 8ball magica
- Visualizzatore avatar
- Comando say
- Sistema di benvenuto/addio

---

## 📋 Comandi

<table>
<tr>
<th>Comando</th>
<th>Descrizione</th>
<th>Categoria</th>
</tr>

<tr>
<td><code>/ping</code></td>
<td>Controlla la latenza del bot</td>
<td>⚙️ Utilità</td>
</tr>

<tr>
<td><code>/help</code></td>
<td>Mostra tutti i comandi disponibili</td>
<td>⚙️ Utilità</td>
</tr>

<tr>
<td><code>/ban</code></td>
<td>Banna un utente dal server</td>
<td>🛡️ Moderazione</td>
</tr>

<tr>
<td><code>/unban</code></td>
<td>Rimuove il ban a un utente</td>
<td>🛡️ Moderazione</td>
</tr>

<tr>
<td><code>/kick</code></td>
<td>Espelle un utente dal server</td>
<td>🛡️ Moderazione</td>
</tr>

<tr>
<td><code>/timeout</code></td>
<td>Mette in timeout un utente</td>
<td>🛡️ Moderazione</td>
</tr>

<tr>
<td><code>/warn</code></td>
<td>Avverte un utente</td>
<td>🛡️ Moderazione</td>
</tr>

<tr>
<td><code>/warnings</code></td>
<td>Visualizza gli avvertimenti di un utente</td>
<td>🛡️ Moderazione</td>
</tr>

<tr>
<td><code>/clear</code></td>
<td>Elimina messaggi in bulk</td>
<td>💬 Gestione</td>
</tr>

<tr>
<td><code>/slowmode</code></td>
<td>Imposta la modalità lenta in un canale</td>
<td>💬 Gestione</td>
</tr>

<tr>
<td><code>/poll</code></td>
<td>Crea un sondaggio interattivo</td>
<td>🎮 Fun</td>
</tr>

<tr>
<td><code>/8ball</code></td>
<td>Consulta la palla magica per una risposta</td>
<td>🎮 Fun</td>
</tr>

<tr>
<td><code>/say</code></td>
<td>Fai ripetere un messaggio al bot</td>
<td>🎮 Fun</td>
</tr>

<tr>
<td><code>/userinfo</code></td>
<td>Visualizza informazioni su un utente</td>
<td>📊 Info</td>
</tr>

<tr>
<td><code>/serverinfo</code></td>
<td>Visualizza informazioni sul server</td>
<td>📊 Info</td>
</tr>

<tr>
<td><code>/avatar</code></td>
<td>Mostra l'avatar di un utente</td>
<td>📊 Info</td>
</tr>

</table>

---

## ⚙️ Installazione

### Prerequisiti
- Node.js v18 o superiore
- Account Discord Developer
- Token bot Discord

### Setup

1. **Clona la repository**
```bash
git clone https://github.com/bless3dd/discord-bot.git
cd discord-bot
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura le variabili d'ambiente**
Crea un file `.env` nella root:
```env
TOKEN=il_tuo_token_discord
CLIENT_ID=il_tuo_client_id
```

4. **Avvia il bot**
```bash
node index.js
```

---

## 🏗️ Struttura del Progetto

```
discord-bot/
├── commands/          # Slash commands del bot
├── events/            # Event handlers
│   ├── channelEvents.js
│   ├── commandHandler.js
│   ├── eventHandler.js
│   ├── memberEvents.js
│   ├── messageEvents.js
│   ├── ready.js
│   └── voiceStatusUpdater.js
├── utils/             # Funzioni di utilità
├── config.js          # Configurazione bot
├── index.js           # Entry point
└── package.json       # Dipendenze
```

---

## 📊 Statistiche

<div align="center">

| Statistica | Valore |
|:----------:|:------:|
| 🖥️ **Server** | 1 |
| 👥 **Utenti** | 60+ |
| ⚡ **Comandi** | 15+ |
| 📅 **Attivo dal** | 2024 |

</div>

---

## 🔧 Tecnologie Utilizzate

- **[Discord.js v14](https://discord.js.org)** - Libreria per interagire con Discord API
- **[Node.js](https://nodejs.org)** - Runtime JavaScript
- **[dotenv](https://www.npmjs.com/package/dotenv)** - Gestione variabili d'ambiente

---

## 🎨 Features Speciali

### 🎤 Voice Status Updater
Il bot monitora costantemente i canali vocali e aggiorna il suo status mostrando quanti utenti sono attualmente in voice chat.

```
Watching 5 in VC
```

### 👋 Sistema Benvenuto/Addio
Messaggi automatici personalizzati per:
- Nuovi membri che entrano nel server
- Membri che lasciano il server

### 🔄 Role Swap Automatico
Sistema automatico che gestisce i ruoli di verifica:
- Quando un utente riceve il ruolo "Verificato"
- Viene automaticamente rimosso il ruolo "Non Verificato"

---

## 📝 Note

- Questo è un **bot privato** non disponibile per invito pubblico
- Sviluppato specificamente per la gestione di un server privato
- Sistema di moderazione personalizzato e ottimizzato

---

## 👨‍💻 Sviluppatore

Sviluppato con ❤️ da **bless3dd**

---

## 📄 License

Questo progetto è privato e non è disponibile per uso pubblico.

---

<div align="center">

**[⬆ Torna su](#-kyrabot---discord-bot)**

Made with 💜 and Discord.js

</div>
