// ============================================
// SHORTLINK - MAIN JAVASCRIPT (FINAL FIXED)
// ============================================

// localStorage se links load karein
function getLinks() {
    return JSON.parse(localStorage.getItem('shortLinks')) || [];
}

// localStorage mein links save karein
function saveLinks(links) {
    localStorage.setItem('shortLinks', JSON.stringify(links));
}

// Random short code generate karein
function generateCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ✅ FIXED: Base URL detect karein (GitHub Pages ka /links/ folder bhi handle karega)
function getBaseUrl() {
    let path = window.location.pathname;

    // Filename hata dein
    path = path.replace('index.html', '')
               .replace('dashboard.html', '')
               .replace('redirect.html', '');

    // Agar path '/' par khatam nahi hota toh '/' add karein
    if (!path.endsWith('/')) {
        path += '/';
    }

    // ✅ AGAR PATH SIRF '/' HAI (repo name missing) TOH 'links/' ADD KAREIN
    if (path === '/') {
        path = '/links/';
    }

    return window.location.origin + path;
}

// ============================================
// URL SHORTEN KARNE KA FUNCTION
// ============================================
function shortenUrl() {
    const urlInput = document.getElementById('urlInput');
    const result = document.getElementById('result');
    let url = urlInput.value.trim();

    if (!url) {
        result.innerHTML = '❌ Please enter a URL';
        result.style.color = '#dc3545';
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        new URL(url);
    } catch (e) {
        result.innerHTML = '❌ Invalid URL. Please check and try again.';
        result.style.color = '#dc3545';
        return;
    }

    const links = getLinks();
    const existing = links.find(l => l.original === url);
    if (existing) {
        const shortUrl = `${getBaseUrl()}redirect.html?c=${existing.code}`;
        result.innerHTML = `✅ Already exists: <a href="${shortUrl}" target="_blank">${shortUrl}</a>`;
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
        ✅ Short link created!<br><br>
        <a href="${shortUrl}" target="_blank">${shortUrl}</a>
        <br><br>
        <button class="btn-copy" onclick="copyToClipboard('${shortUrl}')">📋 Copy</button>
        <a href="dashboard.html" class="btn-copy" style="text-decoration:none;display:inline-block;">📊 Dashboard</a>
    `;
    result.style.color = '#28a745';

    urlInput.value = '';
}

// ============================================
// COPY TO CLIPBOARD
// ============================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Link copied to clipboard!');
    }).catch(() => {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('✅ Link copied!');
    });
}

// ============================================
// DASHBOARD LOAD KARNE KA FUNCTION
// ============================================
function loadDashboard() {
    const links = getLinks();
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
    tbody.innerHTML = '';

    const sortedLinks = [...links].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

    sortedLinks.forEach((link, index) => {
        const shortUrl = `${getBaseUrl()}redirect.html?c=${link.code}`;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><a href="${link.original}" target="_blank">${link.original.substring(0, 50)}${link.original.length > 50 ? '...' : ''}</a></td>
            <td><a href="${shortUrl}" target="_blank">${shortUrl}</a></td>
            <td><strong>${link.clicks || 0}</strong></td>
            <td>${link.created}</td>
            <td>
                <button class="btn-copy" onclick="copyToClipboard('${shortUrl}')">📋 Copy</button>
                <button class="btn-delete" onclick="deleteLink('${link.code}')">🗑️ Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// LINK DELETE KARNE KA FUNCTION
// ============================================
function deleteLink(code) {
    if (!confirm('Are you sure you want to delete this link?')) return;

    let links = getLinks();
    links = links.filter(l => l.code !== code);
    saveLinks(links);
    loadDashboard();
}

// ============================================
// DIRECT REDIRECT - NO WAIT
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

    // ✅ Click count badhayein (background mein)
    link.clicks = (link.clicks || 0) + 1;
    link.lastClick = new Date().toISOString();
    saveLinks(links);

    // ✅ Turant original site open karein
    window.location.replace(link.original);
}

// ============================================
// ENTER KEY SE SHORTEN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') shortenUrl();
        });
    }
});
