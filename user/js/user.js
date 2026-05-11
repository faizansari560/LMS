// =============================================
// LMS User Website JavaScript
// =============================================
const API = '../backend/';
let allCases = [];
let currentFilter = '';

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadCases();
  loadStats();
  setupNavScroll();
  setupFilterBtns();
  setupSmoothScroll();
});

// ─── SESSION CHECK ───
async function checkSession() {
  try {
    const res  = await fetch(API + 'session.php?action=check');
    const data = await res.json();
    if (data.logged_in) {
      document.getElementById('userNavInfo').style.display = 'flex';
      document.getElementById('navUserName').textContent  = '👋 ' + data.name.split(' ')[0];
    }
  } catch(e) {}
}

// ─── STATS ───
async function loadStats() {
  try {
    const res  = await fetch(API + 'cases.php?action=stats');
    const data = await res.json();
    if (data.success) {
      animateNum('heroTotal', data.data.total_cases);
      animateNum('heroWon',   data.data.won_cases);
    }
  } catch(e) {}
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el || !target) return;
  let curr = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    curr = Math.min(curr + step, target);
    el.textContent = curr + '+';
    if (curr >= target) clearInterval(timer);
  }, 50);
}

// ─── CASES ───
async function loadCases() {
  try {
    const res  = await fetch(API + 'cases.php?action=get_all');
    const data = await res.json();
    allCases   = data.success ? data.data : [];
    renderCases(allCases);
  } catch(e) {
    document.getElementById('publicCasesGrid').innerHTML = '<div class="loading-msg">Could not load cases. Check server.</div>';
  }
}

function renderCases(cases) {
  const grid = document.getElementById('publicCasesGrid');
  if (!cases.length) {
    grid.innerHTML = '<div class="loading-msg">No cases found.</div>';
    return;
  }
  grid.innerHTML = cases.map(c => {
    const imgSrc = c.image && c.image !== 'default-case.png' ? `../assets/uploads/${c.image}` : null;
    return `
    <div class="pub-case-card" onclick="openCaseDetail(${c.id})">
      <div class="pcc-img">
        ${imgSrc ? `<img src="${imgSrc}" alt="${escHtml(c.case_title)}" loading="lazy">` : `<i class="fas fa-briefcase"></i>`}
      </div>
      <div class="pcc-body">
        <div class="pcc-type">${escHtml(c.case_type||'General')}</div>
        <div class="pcc-title">${escHtml(c.case_title)}</div>
        <div class="pcc-meta">
          <span><i class="fas fa-user"></i>${escHtml(c.client_name||'—')}</span>
          <span><i class="fas fa-gavel"></i>${escHtml(c.lawyer_name||'—')}</span>
          ${c.hearing_date ? `<span><i class="fas fa-calendar"></i>${c.hearing_date}</span>` : ''}
        </div>
        <div class="pcc-foot">
          <span class="pcc-fee">PKR ${Number(c.fee||0).toLocaleString()}</span>
          ${badgeHtml(c.status)}
        </div>
      </div>
    </div>`;
  }).join('');
}

function setupFilterBtns() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      const filtered = currentFilter ? allCases.filter(c => c.status === currentFilter) : allCases;
      renderCases(filtered);
    });
  });
}

// ─── CASE DETAIL ───
async function openCaseDetail(id) {
  const c = allCases.find(x => x.id == id);
  if (!c) return;
  const imgSrc = c.image && c.image !== 'default-case.png' ? `../assets/uploads/${c.image}` : null;
  document.getElementById('caseDetailContent').innerHTML = `
    <div class="detail-img">
      ${imgSrc ? `<img src="${imgSrc}" alt="${escHtml(c.case_title)}">` : `<i class="fas fa-briefcase"></i>`}
    </div>
    <div class="detail-body">
      <div class="detail-type">${escHtml(c.case_type||'General')} Case</div>
      <h2 class="detail-title">${escHtml(c.case_title)}</h2>
      ${badgeHtml(c.status)}
      <p class="detail-desc" style="margin-top:16px">${escHtml(c.description||'No description available.')}</p>
      <div class="detail-info">
        <div class="dinfo-item"><div class="dinfo-label">Case Number</div><div class="dinfo-val">${escHtml(c.case_number||'N/A')}</div></div>
        <div class="dinfo-item"><div class="dinfo-label">Client Name</div><div class="dinfo-val">${escHtml(c.client_name||'—')}</div></div>
        <div class="dinfo-item"><div class="dinfo-label">Lawyer</div><div class="dinfo-val">${escHtml(c.lawyer_name||'—')}</div></div>
        <div class="dinfo-item"><div class="dinfo-label">Legal Fee</div><div class="dinfo-val" style="color:var(--green)">PKR ${Number(c.fee||0).toLocaleString()}</div></div>
        <div class="dinfo-item"><div class="dinfo-label">Filed Date</div><div class="dinfo-val">${c.filed_date||'—'}</div></div>
        <div class="dinfo-item"><div class="dinfo-label">Hearing Date</div><div class="dinfo-val">${c.hearing_date||'—'}</div></div>
      </div>
    </div>`;
  document.getElementById('caseDetailOverlay').classList.add('open');
}

function closeCaseDetail(e) {
  if (!e || e.target === document.getElementById('caseDetailOverlay')) {
    document.getElementById('caseDetailOverlay').classList.remove('open');
  }
}

// ─── CONTACT FORM ───
function submitContact(e) {
  e.preventDefault();
  showToast('Message sent! We will contact you soon.', 'success');
  e.target.reset();
}

// ─── LOGOUT / SWITCH ───
async function doLogout() {
  const fd = new FormData(); fd.append('action','logout');
  await fetch(API + 'auth.php', { method: 'POST', body: fd });
  window.location.href = '../index.html';
}

async function switchUser() {
  const fd = new FormData(); fd.append('action','logout');
  await fetch(API + 'auth.php', { method: 'POST', body: fd });
  window.location.href = '../index.html';
}

// ─── NAV ───
function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

function setupNavScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
      document.getElementById('navLinks').classList.remove('open');
    });
  });
  // Active nav highlight
  const sections = ['home','cases','about','contact'];
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(id => {
      const sec = document.getElementById(id);
      if (sec && window.scrollY >= sec.offsetTop - 100) current = id;
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });
}

// ─── TOAST ───
let toastTimer;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✓ ' : '✗ ') + msg;
  t.className   = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 3200);
}

// ─── HELPERS ───
function badgeHtml(status) {
  const map = { open:'badge-open', closed:'badge-closed', pending:'badge-pending', won:'badge-won', lost:'badge-lost' };
  return `<span class="badge ${map[status]||'badge-closed'}">${status}</span>`;
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
