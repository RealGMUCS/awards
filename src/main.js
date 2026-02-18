import { loadFaculty } from './data.js';
import './style.css';

let allFaculty = [];
let awardIndex = new Map();
let activeAward = null;

async function init() {
    const data = await loadFaculty();
    allFaculty = data.faculty;
    awardIndex = data.awardIndex;

    setupSearch();
    setupAwardBanner();
    setupThemeToggle();
    restoreFromUrl();
    render();

    window.addEventListener('popstate', () => {
        restoreFromUrl();
        render();
    });
}


function updateUrl() {
    const params = new URLSearchParams();
    const q = document.getElementById('main-search').value.trim();
    if (q) params.set('q', q);
    if (activeAward) params.set('award', activeAward);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? '?' + qs : '');
    history.replaceState(null, '', url);
}

function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) {
        document.getElementById('main-search').value = params.get('q');
    }
    if (params.has('award')) {
        activeAward = params.get('award');
        document.getElementById('active-filter').style.display = 'flex';
        document.getElementById('active-filter-text').textContent = `Award: ${activeAward}`;
    }
}

// Search

function setupSearch() {
    document.getElementById('main-search').addEventListener('input', () => render());
}

function setupAwardBanner() {
    document.getElementById('clear-filter').addEventListener('click', () => {
        activeAward = null;
        document.getElementById('active-filter').style.display = 'none';
        document.getElementById('main-search').value = '';
        render();
    });
}

function getFiltered() {
    const query = document.getElementById('main-search').value.trim().toLowerCase();

    // Only show faculty who have at least one award
    let list = allFaculty.filter(f => f.awards.length > 0);

    // Award tag filter
    if (activeAward) {
        list = (awardIndex.get(activeAward) || []).filter(f => f.awards.length > 0);
    }

    // Search query
    if (query) {
        list = list.filter(f => {
            const fields = [
                f.firstName, f.lastName, `${f.firstName} ${f.lastName}`,
                f.email, ...f.awards
            ];
            return fields.some(v => v && v.toLowerCase().includes(query));
        });
    }

    return list;
}

// Rendering

function render() {
    const filtered = getFiltered();
    const grid = document.getElementById('faculty-results');
    const countEl = document.getElementById('faculty-count');

    countEl.textContent = `${filtered.length} faculty`;
    grid.innerHTML = filtered.map(renderCard).join('');
    updateUrl();
}

function renderCard(f) {
    const fullName = `${f.firstName} ${f.lastName}`;
    const peopleUrl = `https://realgmucs.github.io/people/?q=${encodeURIComponent(f.firstName + ' ' + f.lastName)}`;

    const awardTags = f.awards.map(a => `<span class="award-tag" data-award="${a}">${a}</span>`).join('');

    const details = [];
    if (f.email) details.push(detailRow('Email', `<span class="email-text">${f.email}</span>`));

    const links = [];
    if (f.email) links.push(`<button class="card-link copy-email-btn" data-email="${f.email}">Email</button>`);

    return `
    <div class="card">
      <div class="card-header" onclick="toggleCard(this, event)">
        <h2><a href="${peopleUrl}" target="_blank" class="faculty-name-link">${fullName}</a></h2>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="card-subtitle">${f.awards.length} award${f.awards.length > 1 ? 's' : ''}</div>
      <div class="card-content">
        <div class="faculty-details">${details.join('')}</div>
        ${links.length ? `<div class="card-links">${links.join('')}</div>` : ''}
        <div class="award-tags">${awardTags}</div>
      </div>
    </div>
  `;
}

function detailRow(label, value) {
    return `<div class="faculty-detail"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
}

// Card expand/collapse
window.toggleCard = function (header, e) {
    if (e && e.target.closest('.faculty-name-link')) return;
    header.closest('.card').classList.toggle('collapsed');
};

// Click an award tag to filter
document.addEventListener('click', e => {
    // Copy email to clipboard
    const emailBtn = e.target.closest('.copy-email-btn');
    if (emailBtn) {
        e.preventDefault();
        const email = emailBtn.dataset.email;
        navigator.clipboard.writeText(email).then(() => {
            const original = emailBtn.textContent;
            emailBtn.textContent = '✓ Copied!';
            emailBtn.classList.add('copied');
            setTimeout(() => {
                emailBtn.textContent = original;
                emailBtn.classList.remove('copied');
            }, 1500);
        });
        return;
    }

    const tag = e.target.closest('.award-tag');
    if (!tag) return;
    const award = tag.dataset.award;
    activeAward = award;
    document.getElementById('active-filter').style.display = 'flex';
    document.getElementById('active-filter-text').textContent = `Award: ${award}`;
    document.getElementById('main-search').value = '';
    render();
});

// Theme Toggle

function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme-awards', next);
    });
}

init();
