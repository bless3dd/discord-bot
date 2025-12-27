const API_URL = 'https://discord-bot-bot-discord-kira.up.railway.app/api/stats';

// Theme Switcher
const themeBtn = document.getElementById('themeBtn');
const closeBtn = document.getElementById('closeBtn');
const themePanel = document.getElementById('themePanel');
const themeOptions = document.querySelectorAll('.theme-option');

themeBtn.onclick = () => themePanel.classList.toggle('open');
closeBtn.onclick = () => themePanel.classList.remove('open');

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('kyrabot-theme', theme);
    themeOptions.forEach(opt => opt.classList.remove('active'));
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
}

themeOptions.forEach(opt => {
    opt.onclick = () => {
        setTheme(opt.dataset.theme);
        setTimeout(() => themePanel.classList.remove('open'), 300);
    };
});

// Load saved theme
setTheme(localStorage.getItem('kyrabot-theme') || 'purple');

// Fetch Stats with Latency
async function loadStats() {
    const startTime = performance.now();
    
    try {
        const res = await fetch(API_URL);
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        const data = await res.json();
        
        // Update status
        document.getElementById('statusText').textContent = data.online ? 'Online' : 'Offline';
        document.querySelector('.status-dot').style.background = data.online ? '#10b981' : '#ef4444';
        
        // Update latency
        updateLatency(latency);
        
        // Update stats
        animateNumber('servers', data.servers || 0);
        animateNumber('users', data.users || 0);
        animateNumber('commands', data.commands || 0);
    } catch (err) {
        document.getElementById('statusText').textContent = 'Offline';
        document.querySelector('.status-dot').style.background = '#ef4444';
        document.getElementById('latencyText').textContent = 'Non disponibile';
        document.getElementById('latencyDot').className = 'latency-dot high';
    }
}

function updateLatency(latency) {
    const latencyDot = document.getElementById('latencyDot');
    const latencyText = document.getElementById('latencyText');
    
    if (latency < 100) {
        latencyDot.className = 'latency-dot low';
        latencyText.textContent = `${latency}ms - Bassa Latenza`;
    } else if (latency < 250) {
        latencyDot.className = 'latency-dot medium';
        latencyText.textContent = `${latency}ms - Latenza Discreta`;
    } else {
        latencyDot.className = 'latency-dot high';
        latencyText.textContent = `${latency}ms - Latenza Alta`;
    }
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.textContent = target;
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(current);
        }
    }, 30);
}

loadStats();
setInterval(loadStats, 30000);

// Scroll to top
const scrollTop = document.getElementById('scrollTop');
window.onscroll = () => {
    scrollTop.classList.toggle('visible', window.scrollY > 300);
};
scrollTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// Smooth scroll for links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.onclick = (e) => {
        e.preventDefault();
        document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    };
});
