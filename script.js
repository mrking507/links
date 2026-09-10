// ============================================
// REDIRECT PAGE - SEEDHA REDIRECT (NO SECRET KEY)
// Yeh code SAB SE UPAR hona chahiye!
// ============================================
if (window.location.pathname.includes('redirect.html')) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');

    if (code) {
        const links = JSON.parse(localStorage.getItem('shortLinks')) || [];
        const link = links.find(l => l.code === code);

        if (link) {
            link.clicks = (link.clicks || 0) + 1;
            localStorage.setItem('shortLinks', JSON.stringify(links));
            window.location.replace(link.original);
        } else {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// SIKANDER BALOCH - PROFESSIONAL SHORTLINK
// ============================================

// 🔑 SECRET KEY
const SECRET_KEY = 'abr@2026';

// ============================================
// AUTHENTICATION
// ============================================
function checkAuth() {
    const isAuth = sessionStorage.getItem('shortlink_auth');
    const keyModal = document.getElementById('keyModal');
    const mainContent = document.getElementById('mainContent');

    if (isAuth === 'true') {
        if (keyModal) keyModal.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    } else {
        if (keyModal) keyModal.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
    }
}

function checkSecretKey() {
    const input = document.getElementById('secretKeyInput');
    const error = document.getElementById('keyError');
    const enteredKey = input.value.trim();

    if (enteredKey === SECRET_KEY) {
        sessionStorage.setItem('shortlink_auth', 'true');
        const keyModal = document.getElementById('keyModal');
        const mainContent = document.getElementById('mainContent');
        if (keyModal) keyModal.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        error.textContent = '';
        input.value = '';

        if (window.location.pathname.includes('dashboard.html')) {
            loadDashboard();
        }
    } else {
        error.textContent = '❌ Galat secret key! Dobara try karein.';
        input.value = '';
        input.focus();
    }
}

function logout() {
    if (confirm('Kya aap logout karna chahte hain?')) {
        sessionStorage.removeItem('shortlink_auth');
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('secretKeyInput');
    if (keyInput) {
        keyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkSecretKey();
        });
        setTimeout(() => keyInput.focus(), 300);
    }
});

// ============================================
// STORAGE FUNCTIONS
// ============================================
function getLinks() {
    return JSON.parse(localStorage.getItem('shortLinks')) || [];
}

function saveLinks(links) {
    localStorage.setItem('shortLinks', JSON.stringify(links));
}

function generateCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function getBaseUrl() {
    let path = window.location.pathname;
    path = path.replace('index.html', '')
               .replace('dashboard.html', '')
               .replace('redirect.html', '');
    if (!path.endsWith('/')) {
        path += '/';
    }
    if (path === '/') {
        path = '/links/';
    }
    return window.location.origin + path;
}

// ============================================
// URL SHORTEN
// ============================================
function shortenUrl() {
    const urlInput = document.getElementById('urlInput');
    const result = document.getElementById('result');
    let url = urlInput.value.trim();

    if (!url) {
        result.innerHTML = '❌ Pehle koi URL daalein';
        result.style.color = '#dc3545';
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        new URL(url);
    } catch (e) {
        result.innerHTML = '❌ Galat URL. Dobara check karein.';
        result.style.color = '#dc3545';
        return;
    }

    const links = getLinks();
    const existing = links.find(l => l.original === url);
    if (existing) {
        const shortUrl = `${getBaseUrl()}redirect.html?c=${existing.code}`;
        result.innerHTML = `✅ Yeh link pehle se maujood hai: <br><br><a href="${shortUrl}" target="_blank">${shortUrl}</a>`;
        result.style.color = '#28a745';
        return;
    }

    const code = generateCode();
    const newLink = {
        code: code,
        original: url,
        clicks: 0,
        created: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }),
        createdTimestamp: Date.now()
    };

    links.push(newLink);
    saveLinks(links);

    const shortUrl = `${getBaseUrl()}redirect.html?c=${code}`;
    result.innerHTML = `
        ✅ Short link ban gaya!<br><br>
        <a href="${shortUrl}" target="_blank">${shortUrl}</a>
        <br><br>
        <button class="btn-copy" onclick="copyToClipboard('${shortUrl}')">📋 Copy Link</button>
        <a href="dashboard.html" class="btn-open" style="text-decoration:none;display:inline-block;">📊 Dashboard</a>
    `;
    result.style.color = '#28a745';

    urlInput.value = '';
}

// ============================================
// COPY TO CLIPBOARD
// ============================================
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('✅ Link copy ho gaya!');
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('✅ Link copy ho gaya!');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #28a745;
        color: white;
        padding: 12px 25px;
        border-radius: 8px;
        font-size: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ============================================
// DASHBOARD
// ============================================
let allLinks = [];

function loadDashboard() {
    const links = getLinks();
    allLinks = links;

    const tbody = document.getElementById('linkBody');
    const emptyMsg = document.getElementById('emptyMsg');
    const totalLinks = document.getElementById('totalLinks');
    const totalClicks = document.getElementById('totalClicks');

    const totalClicksCount = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    totalLinks.textContent = links.length;
    totalClicks.textContent = totalClicksCount;

    if (links.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';
    renderLinks(links);
}

function renderLinks(links) {
    const tbody = document.getElementById('linkBody');
    tbody.innerHTML = '';

    const sortedLinks = [...links].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

    sortedLinks.forEach((link, index) => {
        const shortUrl = `${getBaseUrl()}redirect.html?c=${link.code}`;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><a href="${link.original}" target="_blank">${link.original.substring(0, 45)}${link.original.length > 45 ? '...' : ''}</a></td>
            <td><a href="${shortUrl}" target="_blank">${shortUrl}</a></td>
            <td><strong>${link.clicks || 0}</strong></td>
            <td>${link.created}</td>
            <td>
                <button class="btn-copy" onclick="copyToClipboard('${shortUrl}')">📋 Copy</button>
                <button class="btn-open" onclick="window.open('${shortUrl}', '_blank')">🔗 Open</button>
                <button class="btn-delete" onclick="deleteLink('${link.code}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchLinks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allLinks.filter(link =>
        link.original.toLowerCase().includes(query) ||
        link.code.toLowerCase().includes(query)
    );
    renderLinks(filtered);
}

function deleteLink(code) {
    if (!confirm('Kya aap yeh link delete karna chahte hain?')) return;

    let links = getLinks();
    links = links.filter(l => l.code !== code);
    saveLinks(links);
    allLinks = links;

    const totalClicksCount = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    document.getElementById('totalLinks').textContent = links.length;
    document.getElementById('totalClicks').textContent = totalClicksCount;

    if (links.length === 0) {
        document.getElementById('emptyMsg').style.display = 'block';
    }

    renderLinks(links);
    showToast('🗑️ Link delete ho gaya');
}

// ============================================
// DIRECT REDIRECT (fallback — upar wala code already redirect kar chuka hoga)
// ============================================
function directRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');

    if (!code) {
        window.location.href = 'index.html';
        return;
    }

    const links = getLinks();
    const link = links.find(l => l.code === code);

    if (!link) {
        window.location.href = 'index.html';
        return;
    }

    link.clicks = (link.clicks || 0) + 1;
    link.lastClick = new Date().toISOString();
    saveLinks(links);

    window.location.replace(link.original);
}

// ============================================
// TOAST ANIMATION
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translate(-50%, 20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
`;
document.head.appendChild(style);
