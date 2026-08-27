// ============================================
// 1️⃣ PRELOADER
// ============================================
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('hidden');
                initDashboard();
            }, 400);
        }
        progressBar.style.width = Math.min(progress, 100) + '%';
    }, 150);
});

// ============================================
// 2️⃣ GLOBAL STATE
// ============================================
const state = {
    generatedLinks: [],
    uploadedImages: [],
    rowCounter: 1,
    isLoggedIn: false,
    theme: 'dark'
};

// ============================================
// 3️⃣ DASHBOARD INIT
// ============================================
function initDashboard() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        state.isLoggedIn = true;
        updateStats();
        updateRowCount();
        setupDragAndDrop();
    }
}

// ============================================
// 4️⃣ LOGIN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const errorEl = document.getElementById('loginError');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (username === 'admin' && password === '12345') {
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            sessionStorage.setItem('isLoggedIn', 'true');
            state.isLoggedIn = true;
            errorEl.textContent = '';
            updateStats();
            updateRowCount();
            setupDragAndDrop();
            addHistory('🔐 User logged in');
        } else {
            errorEl.textContent = '❌ Invalid credentials';
        }
    });
});

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const icon = document.querySelector('.toggle-password i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    state.theme = newTheme;
    const icon = document.querySelector('.theme-toggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('active');
    document.getElementById('notificationsDropdown').classList.remove('active');
}

function toggleNotifications() {
    document.getElementById('notificationsDropdown').classList.toggle('active');
    document.getElementById('userMenu').classList.remove('active');
}

function clearNotifications() {
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    document.querySelector('.notif-btn .badge').textContent = '0';
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    state.isLoggedIn = false;
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('userMenu').classList.remove('active');
}

// ============================================
// 5️⃣ DRAG & DROP IMAGE UPLOAD
// ============================================
function setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.parentElement.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.parentElement.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.parentElement.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
        fileInput.value = '';
    });

    // Click to upload
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
}

function handleFiles(files) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach(file => {
        if (!validTypes.includes(file.type)) {
            addHistory(`⚠️ ${file.name}: Unsupported format`);
            return;
        }
        if (file.size > maxSize) {
            addHistory(`⚠️ ${file.name}: Exceeds 10MB limit`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            state.uploadedImages.push(imageUrl);
            addImageToPreview(imageUrl);
            addImageToRow(imageUrl);
            updateStats();
            addHistory(`📸 Uploaded: ${file.name}`);
        };
        reader.readAsDataURL(file);
    });
}

function addImageToPreview(imageUrl) {
    const preview = document.getElementById('uploadPreview');
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
        <img src="${imageUrl}" alt="Uploaded" />
        <button class="remove-image" onclick="this.parentElement.remove();">
            <i class="fas fa-times"></i>
        </button>
    `;
    preview.appendChild(item);
}

function addImageToRow(imageUrl) {
    // Find first row without image or add new row
    const rows = document.querySelectorAll('.link-row');
    let targetRow = null;
    
    for (let row of rows) {
        const imgInput = row.querySelector('.image-input');
        if (!imgInput.value) {
            targetRow = row;
            break;
        }
    }

    if (!targetRow) {
        addRow();
        targetRow = document.querySelector('.link-row:last-child');
    }

    const imgInput = targetRow.querySelector('.image-input');
    imgInput.value = imageUrl;
    
    const preview = targetRow.querySelector('.row-image-preview');
    preview.innerHTML = `<img src="${imageUrl}" alt="Preview" />`;
    
    // Update status
    const linkInput = targetRow.querySelector('.link-input');
    const status = targetRow.querySelector('.row-status');
    if (linkInput.value && imgInput.value) {
        status.className = 'row-status valid';
    }
    updateStats();
}

// ============================================
// 6️⃣ ROW MANAGEMENT
// ============================================
function addRow() {
    state.rowCounter++;
    const container = document.getElementById('linkRowsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'link-row';
    newRow.dataset.row = state.rowCounter;
    newRow.innerHTML = `
        <div class="row-number">
            <span>#${state.rowCounter}</span>
            <span class="row-status"></span>
        </div>
        <div class="row-inputs">
            <div class="input-field">
                <label><i class="fas fa-link"></i> URL</label>
                <input type="url" class="link-input" placeholder="https://example.com" />
            </div>
            <div class="input-field image-upload-field">
                <label><i class="fas fa-image"></i> Image</label>
                <div class="image-input-wrapper">
                    <input type="url" class="image-input" placeholder="Image URL or upload" />
                    <button class="upload-image-btn" onclick="uploadImageForRow(this)" title="Upload image">
                        <i class="fas fa-upload"></i>
                    </button>
                    <input type="file" class="row-file-input" accept="image/*" style="display:none;" />
                </div>
                <div class="row-image-preview"></div>
            </div>
        </div>
        <div class="row-actions">
            <button class="row-btn preview-btn" onclick="previewRowImage(this)" title="Preview">
                <i class="fas fa-eye"></i>
            </button>
            <button class="row-btn duplicate-btn" onclick="duplicateRow(this)" title="Duplicate">
                <i class="fas fa-copy"></i>
            </button>
            <button class="row-btn remove-row" onclick="removeRow(this)" title="Remove">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newRow);
    updateRowCount();
    updateStats();
    addHistory(`📝 Added row #${state.rowCounter}`);
}

function removeRow(btn) {
    const row = btn.closest('.link-row');
    if (document.querySelectorAll('.link-row').length <= 1) {
        addHistory('⚠️ Cannot remove last row');
        return;
    }
    const rowNum = row.dataset.row;
    row.remove();
    updateRowCount();
    updateStats();
    addHistory(`🗑️ Removed row #${rowNum}`);
}

function duplicateRow(btn) {
    const row = btn.closest('.link-row');
    const newRow = row.cloneNode(true);
    state.rowCounter++;
    newRow.dataset.row = state.rowCounter;
    newRow.querySelector('.row-number span:first-child').textContent = `#${state.rowCounter}`;
    newRow.querySelector('.link-input').value = row.querySelector('.link-input').value;
    newRow.querySelector('.image-input').value = row.querySelector('.image-input').value;
    const preview = newRow.querySelector('.row-image-preview');
    if (row.querySelector('.row-image-preview img')) {
        preview.innerHTML = row.querySelector('.row-image-preview').innerHTML;
    }
    document.getElementById('linkRowsContainer').appendChild(newRow);
    updateRowCount();
    updateStats();
    addHistory(`📋 Duplicated row #${row.dataset.row}`);
}

function updateRowCount() {
    const count = document.querySelectorAll('.link-row').length;
    document.getElementById('rowCount').textContent = count;
    document.getElementById('linkCounter').textContent = `${count} links`;
}

// ============================================
// 7️⃣ IMAGE UPLOAD FOR ROW
// ============================================
function uploadImageForRow(btn) {
    const row = btn.closest('.link-row');
    const fileInput = row.querySelector('.row-file-input');
    fileInput.click();
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            addHistory('⚠️ Unsupported image format');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const imageUrl = ev.target.result;
            const imgInput = row.querySelector('.image-input');
            imgInput.value = imageUrl;
            
            const preview = row.querySelector('.row-image-preview');
            preview.innerHTML = `<img src="${imageUrl}" alt="Preview" />`;
            
            const linkInput = row.querySelector('.link-input');
            const status = row.querySelector('.row-status');
            if (linkInput.value && imgInput.value) {
                status.className = 'row-status valid';
            }
            updateStats();
            addHistory(`📸 Image uploaded for row #${row.dataset.row}`);
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    };
}

function previewRowImage(btn) {
    const row = btn.closest('.link-row');
    const imgInput = row.querySelector('.image-input');
    const imageUrl = imgInput.value.trim();
    if (imageUrl) {
        window.open(imageUrl, '_blank');
    } else {
        addHistory('⚠️ No image to preview');
    }
}

// ============================================
// 8️⃣ BULK IMPORT
// ============================================
function bulkImport() {
    const area = document.getElementById('bulkImportArea');
    area.style.display = area.style.display === 'none' ? 'block' : 'none';
}

function closeBulk() {
    document.getElementById('bulkImportArea').style.display = 'none';
}

function processBulk() {
    const text = document.getElementById('bulkText').value.trim();
    if (!text) {
        alert('Please paste links and images');
        return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    const container = document.getElementById('linkRowsContainer');
    container.innerHTML = '';

    let count = 0;
    lines.forEach((line, index) => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 2) {
            count++;
            const row = document.createElement('div');
            row.className = 'link-row';
            row.dataset.row = count;
            row.innerHTML = `
                <div class="row-number">
                    <span>#${count}</span>
                    <span class="row-status valid"></span>
                </div>
                <div class="row-inputs">
                    <div class="input-field">
                        <label><i class="fas fa-link"></i> URL</label>
                        <input type="url" class="link-input" value="${parts[0]}" />
                    </div>
                    <div class="input-field image-upload-field">
                        <label><i class="fas fa-image"></i> Image</label>
                        <div class="image-input-wrapper">
                            <input type="url" class="image-input" value="${parts[1]}" />
                            <button class="upload-image-btn" onclick="uploadImageForRow(this)" title="Upload image">
                                <i class="fas fa-upload"></i>
                            </button>
                            <input type="file" class="row-file-input" accept="image/*" style="display:none;" />
                        </div>
                        <div class="row-image-preview">
                            <img src="${parts[1]}" alt="Preview" onerror="this.style.display='none'" />
                        </div>
                    </div>
                </div>
                <div class="row-actions">
                    <button class="row-btn preview-btn" onclick="previewRowImage(this)" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="row-btn duplicate-btn" onclick="duplicateRow(this)" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="row-btn remove-row" onclick="removeRow(this)" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
        }
    });

    state.rowCounter = count;
    updateRowCount();
    updateStats();
    addHistory(`📦 Bulk imported ${count} rows`);
    closeBulk();
    document.getElementById('bulkText').value = '';
}

// ============================================
// 9️⃣ UPLOAD MULTIPLE IMAGES
// ============================================
function uploadMultipleImages() {
    document.getElementById('fileInput').click();
}

// ============================================
// 🔟 CLEAR ALL
// ============================================
function clearAll() {
    if (confirm('Clear all rows and inputs?')) {
        const container = document.getElementById('linkRowsContainer');
        container.innerHTML = `
            <div class="link-row" data-row="1">
                <div class="row-number">
                    <span>#1</span>
                    <span class="row-status"></span>
                </div>
                <div class="row-inputs">
                    <div class="input-field">
                        <label><i class="fas fa-link"></i> URL</label>
                        <input type="url" class="link-input" placeholder="https://example.com" />
                    </div>
                    <div class="input-field image-upload-field">
                        <label><i class="fas fa-image"></i> Image</label>
                        <div class="image-input-wrapper">
                            <input type="url" class="image-input" placeholder="Image URL or upload" />
                            <button class="upload-image-btn" onclick="uploadImageForRow(this)" title="Upload image">
                                <i class="fas fa-upload"></i>
                            </button>
                            <input type="file" class="row-file-input" accept="image/*" style="display:none;" />
                        </div>
                        <div class="row-image-preview"></div>
                    </div>
                </div>
                <div class="row-actions">
                    <button class="row-btn preview-btn" onclick="previewRowImage(this)" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="row-btn duplicate-btn" onclick="duplicateRow(this)" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="row-btn remove-row" onclick="removeRow(this)" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        state.rowCounter = 1;
        document.getElementById('uploadPreview').innerHTML = '';
        state.uploadedImages = [];
        updateRowCount();
        updateStats();
        addHistory('🧹 Cleared all');
    }
}

// ============================================
// 1️⃣1️⃣ GENERATE LINKS
// ============================================
function generateLinks() {
    const rows = document.querySelectorAll('.link-row');
    const results = [];
    let hasError = false;

    rows.forEach((row, index) => {
        const linkInput = row.querySelector('.link-input');
        const imageInput = row.querySelector('.image-input');
        const statusDot = row.querySelector('.row-status');
        const link = linkInput.value.trim();
        const image = imageInput.value.trim();

        if (!link || !image) {
            hasError = true;
            statusDot.className = 'row-status invalid';
            row.style.borderColor = '#ff6b6b';
            setTimeout(() => {
                row.style.borderColor = '';
                statusDot.className = 'row-status';
            }, 2000);
            return;
        }

        statusDot.className = 'row-status valid';
        let finalLink = link;
        if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
            finalLink = 'https://' + finalLink;
        }

        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 6) + index;
        const generatedUrl = `https://linkpro.io/share/${uniqueId}`;
        
        results.push({
            id: uniqueId,
            originalLink: finalLink,
            imageUrl: image,
            generatedUrl: generatedUrl,
            timestamp: new Date().toLocaleString()
        });
    });

    if (hasError) {
        addHistory('⚠️ Some rows have missing data');
        return;
    }

    if (results.length === 0) {
        addHistory('⚠️ No valid rows to generate');
        return;
    }

    state.generatedLinks = results;
    displayResults(results);
    updateStats();
    addHistory(`🤖 Generated ${results.length} links`);
}

// ============================================
// 1️⃣2️⃣ DISPLAY RESULTS
// ============================================
let currentTab = 'links';

function displayResults(results) {
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.add('active');
    
    document.getElementById('totalLinks').textContent = results.length;
    document.getElementById('totalGenerated').textContent = results.length;
    document.getElementById('conversionRate').textContent = (Math.random() * 15 + 5).toFixed(1) + '%';
    
    renderTab(currentTab, results);
}

function renderTab(tab, results) {
    const content = document.getElementById('resultContent');
    
    if (!results || results.length === 0) {
        content.innerHTML = `
            <div class="result-placeholder">
                <i class="fas fa-magic" style="font-size: 48px; opacity: 0.3;"></i>
                <p>No links generated yet</p>
            </div>
        `;
        return;
    }

    if (tab === 'links') {
        renderLinksTab(content, results);
    } else if (tab === 'gallery') {
        renderGalleryTab(content, results);
    }
}

function renderLinksTab(content, results) {
    let html = `<div class="result-content">`;
    results.forEach((item, index) => {
        html += `
            <div class="result-item">
                <div class="result-header">
                    <span class="result-index">#${index + 1}</span>
                    <span class="result-link"><i class="fas fa-link"></i> ${item.generatedUrl}</span>
                    <button class="copy-btn-sm" onclick="copyLink('${item.generatedUrl}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="result-meta">
                    <span><i class="fas fa-arrow-right"></i> ${item.originalLink}</span>
                    <span><i class="fas fa-image"></i> <img src="${item.imageUrl}" alt="Preview" onerror="this.style.display='none'" /></span>
                    <span><i class="fas fa-clock"></i> ${item.timestamp}</span>
                </div>
            </div>
        `;
    });

    html += `
        <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap;">
            <button onclick="exportLinks('csv')" class="generate-btn small">
                <i class="fas fa-file-csv"></i> Export CSV
            </button>
            <button onclick="exportLinks('json')" class="generate-btn small" style="background: var(--info);">
                <i class="fas fa-file-code"></i> Export JSON
            </button>
        </div>
    `;
    html += `</div>`;
    content.innerHTML = html;
}

function renderGalleryTab(content, results) {
    let html = `<div class="result-content"><div class="gallery-grid">`;
    results.forEach((item, index) => {
        html += `
            <div class="gallery-item">
                <img src="${item.imageUrl}" alt="Image ${index+1}" onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'" />
                <div class="gallery-link">
                    <a href="${item.generatedUrl}" target="_blank" style="color: var(--accent); font-size:12px; text-decoration:none;">
                        ${item.generatedUrl.substring(0, 30)}...
                    </a>
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                    🔗 ${item.originalLink.substring(0, 30)}...
                </div>
            </div>
        `;
    });
    html += `</div></div>`;
    content.innerHTML = html;
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.result-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.result-tab[data-tab="${tab}"]`).classList.add('active');
    renderTab(tab, state.generatedLinks);
}

// ============================================
// 1️⃣3️⃣ COPY LINK
// ============================================
function copyLink(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btns = document.querySelectorAll('.copy-btn-sm');
        btns.forEach(btn => {
            if (btn.textContent.includes('Copy')) {
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.style.background = '#00b894';
                btn.style.color = '#fff';
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            }
        });
        addHistory(`📋 Copied: ${text.substring(0, 30)}...`);
    });
}

// ============================================
// 1️⃣4️⃣ EXPORT
// ============================================
function exportLinks(format) {
    if (state.generatedLinks.length === 0) {
        alert('No links to export');
        return;
    }

    const data = state.generatedLinks;
    let content = '';
    let filename = `links_${Date.now()}`;

    if (format === 'csv') {
        content = 'ID,Original Link,Generated Link,Image URL,Timestamp\n';
        data.forEach(item => {
            content += `"${item.id}","${item.originalLink}","${item.generatedUrl}","${item.imageUrl}","${item.timestamp}"\n`;
        });
        filename += '.csv';
    } else if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename += '.json';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    addHistory(`📤 Exported ${data.length} links as ${format.toUpperCase()}`);
}

// ============================================
// 1️⃣5️⃣ SEARCH
// ============================================
function searchLinks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const items = document.querySelectorAll('.result-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}

// ============================================
// 1️⃣6️⃣ UPDATE STATS
// ============================================
function updateStats() {
    const rows = document.querySelectorAll('.link-row');
    const totalLinks = rows.length;
    document.getElementById('totalLinks').textContent = totalLinks;
    document.getElementById('totalImages').textContent = state.uploadedImages.length + 
        document.querySelectorAll('.row-image-preview img').length;
    
    let filled = 0;
    rows.forEach(row => {
        const link = row.querySelector('.link-input').value.trim();
        const image = row.querySelector('.image-input').value.trim();
        if (link && image) filled++;
    });
    document.getElementById('totalGenerated').textContent = filled;
}

// ============================================
// 1️⃣7️⃣ HISTORY
// ============================================
function addHistory(message) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (historyList.querySelector('.empty-history')) {
        historyList.innerHTML = '';
    }

    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString();
    li.innerHTML = `
        <i class="fas fa-clock"></i>
        <span>${message}</span>
        <span class="history-time">${time}</span>
    `;
    historyList.prepend(li);

    while (historyList.children.length > 30) {
        historyList.removeChild(historyList.lastChild);
    }
}

// ============================================
// 1️⃣8️⃣ KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    const dashboard = document.getElementById('dashboardContainer');
    if (dashboard.style.display === 'none') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateLinks();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        addRow();
    }
    if (e.key === 'Escape') {
        document.getElementById('notificationsDropdown').classList.remove('active');
        document.getElementById('userMenu').classList.remove('active');
    }
});

// ============================================
// 1️⃣9️⃣ AUTO-UPDATE STATS
// ============================================
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('link-input') || e.target.classList.contains('image-input')) {
        updateStats();
        const row = e.target.closest('.link-row');
        if (row) {
            const link = row.querySelector('.link-input').value.trim();
            const image = row.querySelector('.image-input').value.trim();
            const status = row.querySelector('.row-status');
            if (link && image) {
                status.className = 'row-status valid';
            } else {
                status.className = 'row-status';
            }
        }
    }
});

console.log('🚀 LinkPro Enterprise v3.5.0 loaded');
console.log('💡 Shortcuts: Ctrl+Enter=Generate, Ctrl+Shift+A=Add Row');