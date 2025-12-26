const API_URL = 'https://discord-bot-bot-discord-kira.up.railway.app';
let userData = null;

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    };
});

// Check Authentication on Load
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
        localStorage.setItem('kyrabot_token', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        verifyToken();
        return;
    }

    const savedToken = localStorage.getItem('kyrabot_token');
    if (!savedToken) {
        alert('⚠️ Devi effettuare il login per accedere alla dashboard');
        window.location.href = '/';
    } else {
        verifyToken();
    }
};

// Verify Token
async function verifyToken() {
    const token = localStorage.getItem('kyrabot_token');
    
    try {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            userData = await res.json();
            document.getElementById('username').textContent = userData.username;
            document.getElementById('userAvatar').src = userData.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
            loadDashboardData();
        } else {
            localStorage.removeItem('kyrabot_token');
            alert('❌ Sessione scaduta. Effettua nuovamente il login.');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Errore verifica:', error);
        localStorage.removeItem('kyrabot_token');
        window.location.href = '/';
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    await loadStats();
    await loadCommands();
}

// Load Stats
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/api/stats`);
        const data = await res.json();
        
        document.getElementById('dashServers').textContent = data.servers || 0;
        document.getElementById('dashUsers').textContent = data.users || 0;
        document.getElementById('dashCommands').textContent = data.commands || 0;
        document.getElementById('dashStatus').textContent = data.online ? 'Online' : 'Offline';
    } catch (error) {
        console.error('Errore caricamento stats:', error);
    }
}

// Load Commands
async function loadCommands() {
    const token = localStorage.getItem('kyrabot_token');
    
    try {
        const res = await fetch(`${API_URL}/api/commands`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const commandsData = await res.json();
        renderCommands(commandsData);
    } catch (error) {
        console.error('Errore caricamento comandi:', error);
        document.getElementById('commandsList').innerHTML = '<p class="loading">❌ Errore caricamento comandi</p>';
    }
}

// Render Commands List
function renderCommands(commands) {
    const list = document.getElementById('commandsList');
    list.innerHTML = '';

    if (Object.keys(commands).length === 0) {
        list.innerHTML = '<p class="loading">Nessun comando disponibile</p>';
        return;
    }

    Object.keys(commands).forEach(cmd => {
        const item = document.createElement('div');
        item.className = 'command-item';
        item.innerHTML = `
            <div class="command-info">
                <h3>/${cmd}</h3>
                <p>${commands[cmd].description}</p>
            </div>
            <div class="toggle-switch ${commands[cmd].enabled ? 'active' : ''}" data-cmd="${cmd}">
                <div class="toggle-slider"></div>
            </div>
        `;
        list.appendChild(item);
    });

    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.onclick = () => toggleCommand(toggle.dataset.cmd, commands);
    });
}

// Toggle Command
async function toggleCommand(cmd, commands) {
    const toggle = document.querySelector(`[data-cmd="${cmd}"]`);
    const isActive = toggle.classList.contains('active');
    const token = localStorage.getItem('kyrabot_token');

    try {
        const res = await fetch(`${API_URL}/api/commands/${cmd}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled: !isActive })
        });

        if (res.ok) {
            toggle.classList.toggle('active');
            commands[cmd].enabled = !isActive;
        } else {
            alert('❌ Errore nell\'aggiornamento del comando');
        }
    } catch (error) {
        console.error('Errore toggle comando:', error);
        alert('❌ Errore di connessione');
    }
}

// Simple Message Form
document.getElementById('simpleForm').onsubmit = async (e) => {
    e.preventDefault();
    const channel = document.getElementById('simpleChannel').value;
    const message = document.getElementById('simpleMessage').value;
    const token = localStorage.getItem('kyrabot_token');

    try {
        const res = await fetch(`${API_URL}/api/send-message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channelId: channel, message })
        });

        const data = await res.json();
        showAlert('simpleAlert', data.success ? '✅ Messaggio inviato con successo!' : `❌ ${data.error}`, data.success ? 'success' : 'error');
        
        if (data.success) {
            document.getElementById('simpleMessage').value = '';
        }
    } catch (error) {
        showAlert('simpleAlert', `❌ Errore: ${error.message}`, 'error');
    }
};

// Embed Form
document.getElementById('embedForm').onsubmit = async (e) => {
    e.preventDefault();
    const channel = document.getElementById('embedChannel').value;
    const title = document.getElementById('embedTitle').value;
    const description = document.getElementById('embedDesc').value;
    const color = document.getElementById('embedColor').value;
    const token = localStorage.getItem('kyrabot_token');

    try {
        const res = await fetch(`${API_URL}/api/send-embed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channelId: channel,
                embed: {
                    title,
                    description,
                    color: parseInt(color.replace('#', ''), 16),
                    timestamp: new Date().toISOString()
                }
            })
        });

        const data = await res.json();
        showAlert('embedAlert', data.success ? '✅ Embed inviato con successo!' : `❌ ${data.error}`, data.success ? 'success' : 'error');
        
        if (data.success) {
            document.getElementById('embedTitle').value = '';
            document.getElementById('embedDesc').value = '';
        }
    } catch (error) {
        showAlert('embedAlert', `❌ Errore: ${error.message}`, 'error');
    }
};

// Show Alert
function showAlert(id, message, type) {
    const alert = document.getElementById(id);
    alert.textContent = message;
    alert.className = `alert ${type} show`;
    setTimeout(() => alert.classList.remove('show'), 5000);
}

// Logout
document.getElementById('logoutBtn').onclick = () => {
    if (confirm('Sei sicuro di voler uscire?')) {
        localStorage.removeItem('kyrabot_token');
        window.location.href = '/';
    }
};