// =============================================
// LMS Admin JavaScript
// =============================================
const API = '../backend/';

let allCases = [];
let allUsers = [];

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  loadStats();
  loadRecentCases();
  loadUsers();
  loadCases();

  // Nav clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
});

async function checkSession() {
  try {
    const res  = await fetch(API + 'session.php?action=check');
    const data = await res.json();
    if (!data.logged_in) { window.location.href = '../index.html'; return; }
    if (data.role !== 'admin') { window.location.href = '../user/index.html'; return; }
    document.getElementById('adminName').textContent = data.name;
    document.getElementById('greetName').textContent = data.name.split(' ')[0];
  } catch(e) {
    // XAMPP not running - still show page
  }
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('pageTitle').textContent = page.charAt(0).toUpperCase() + page.slice(1);
  if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── STATS ───
async function loadStats() {
  try {
    const res  = await fetch(API + 'cases.php?action=stats');
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      document.getElementById('st-total').textContent   = s.total_cases;
      document.getElementById('st-open').textContent    = s.open_cases;
      document.getElementById('st-won').textContent     = s.won_cases;
      document.getElementById('st-users').textContent   = s.total_users;
      document.getElementById('st-revenue').textContent = 'PKR ' + Number(s.total_revenue || 0).toLocaleString();
    }
  } catch(e) {}
}

// ─── RECENT CASES ───
async function loadRecentCases() {
  try {
    const res  = await fetch(API + 'cases.php?action=get_all');
    const data = await res.json();
    const tbody = document.querySelector('#recentCasesTable tbody');
    if (!data.success || !data.data.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No cases found.</td></tr>';
      return;
    }
    const recent = data.data.slice(0, 5);
    tbody.innerHTML = recent.map(c => `
      <tr>
        <td><strong>${escHtml(c.case_title)}</strong><br><small style="color:var(--muted)">${escHtml(c.case_number||'')}</small></td>
        <td>${escHtml(c.client_name||'—')}</td>
        <td>${escHtml(c.lawyer_name||'—')}</td>
        <td>${badgeHtml(c.status)}</td>
        <td style="color:var(--green);font-weight:600">PKR ${Number(c.fee||0).toLocaleString()}</td>
      </tr>`).join('');
  } catch(e) {}
}

// ─── CASES ───
async function loadCases() {
  try {
    const res  = await fetch(API + 'cases.php?action=get_all');
    const data = await res.json();
    allCases   = data.success ? data.data : [];
    renderCases(allCases);
  } catch(e) {
    document.getElementById('casesGrid').innerHTML = '<div class="loading-row">Failed to load cases. Check XAMPP.</div>';
  }
}

function renderCases(cases) {
  const grid = document.getElementById('casesGrid');
  if (!cases.length) {
    grid.innerHTML = '<div class="loading-row" style="grid-column:1/-1">No cases found. Add one!</div>';
    return;
  }
  grid.innerHTML = cases.map(c => {
    const imgSrc = c.image && c.image !== 'default-case.png'
      ? `../assets/uploads/${c.image}`
      : null;
    return `
    <div class="case-card" data-id="${c.id}">
      <div class="case-card-img">
        ${imgSrc ? `<img src="${imgSrc}" alt="${escHtml(c.case_title)}" loading="lazy">` : `<i class="fas fa-briefcase"></i>`}
      </div>
      <div class="case-card-body">
        <div class="case-card-title">${escHtml(c.case_title)}</div>
        <div class="case-meta">
          <span><i class="fas fa-hashtag"></i>${escHtml(c.case_number||'N/A')}</span>
          <span><i class="fas fa-tag"></i>${escHtml(c.case_type||'General')}</span>
          <span><i class="fas fa-user"></i>${escHtml(c.client_name||'—')}</span>
          <span><i class="fas fa-gavel"></i>${escHtml(c.lawyer_name||'—')}</span>
          ${c.hearing_date ? `<span><i class="fas fa-calendar"></i>Hearing: ${c.hearing_date}</span>` : ''}
        </div>
        ${badgeHtml(c.status)}
      </div>
      <div class="case-card-foot">
        <span class="case-fee">PKR ${Number(c.fee||0).toLocaleString()}</span>
        <div class="case-actions">
          <button class="icon-btn edit" onclick="editCase(${c.id})" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="icon-btn del" onclick="deleteCase(${c.id}, '${escHtml(c.case_title)}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterCases() {
  const q      = document.getElementById('caseSearch').value.toLowerCase();
  const status = document.getElementById('caseStatusFilter').value;
  const filtered = allCases.filter(c =>
    (!q || c.case_title.toLowerCase().includes(q) || (c.client_name||'').toLowerCase().includes(q) || (c.lawyer_name||'').toLowerCase().includes(q)) &&
    (!status || c.status === status)
  );
  renderCases(filtered);
}

function openCaseModal(data = null) {
  document.getElementById('caseModalTitle').textContent = data ? 'Edit Case' : 'Add New Case';
  document.getElementById('caseId').value        = data?.id || '';
  document.getElementById('caseTitle').value     = data?.case_title || '';
  document.getElementById('caseNumber').value    = data?.case_number || '';
  document.getElementById('caseType').value      = data?.case_type || '';
  document.getElementById('caseStatus').value    = data?.status || 'open';
  document.getElementById('caseClient').value    = data?.client_name || '';
  document.getElementById('caseLawyer').value    = data?.lawyer_name || '';
  document.getElementById('caseFee').value       = data?.fee || '';
  document.getElementById('caseFiledDate').value = data?.filed_date || '';
  document.getElementById('caseHearingDate').value = data?.hearing_date || '';
  document.getElementById('caseDesc').value      = data?.description || '';
  document.getElementById('caseAlert').className = 'alert';
  document.getElementById('caseModalOverlay').classList.add('open');
}

function closeCaseModal(e) {
  if (!e || e.target === document.getElementById('caseModalOverlay')) {
    document.getElementById('caseModalOverlay').classList.remove('open');
  }
}

async function editCase(id) {
  try {
    const res  = await fetch(API + `cases.php?action=get_one&id=${id}`);
    const data = await res.json();
    if (data.success) openCaseModal(data.data);
  } catch(e) {}
}

async function saveCase() {
  const id    = document.getElementById('caseId').value;
  const title = document.getElementById('caseTitle').value.trim();
  const alertEl = document.getElementById('caseAlert');

  if (!title) { alertEl.textContent = 'Case title is required.'; alertEl.className = 'alert error'; return; }

  const btn = document.getElementById('saveCaseBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';

  const fd = new FormData();
  fd.append('action', id ? 'edit' : 'add');
  if (id) fd.append('id', id);
  fd.append('case_title',    document.getElementById('caseTitle').value);
  fd.append('case_number',   document.getElementById('caseNumber').value);
  fd.append('case_type',     document.getElementById('caseType').value);
  fd.append('status',        document.getElementById('caseStatus').value);
  fd.append('client_name',   document.getElementById('caseClient').value);
  fd.append('lawyer_name',   document.getElementById('caseLawyer').value);
  fd.append('fee',           document.getElementById('caseFee').value);
  fd.append('filed_date',    document.getElementById('caseFiledDate').value);
  fd.append('hearing_date',  document.getElementById('caseHearingDate').value);
  fd.append('description',   document.getElementById('caseDesc').value);
  const imgFile = document.getElementById('caseImage').files[0];
  if (imgFile) fd.append('image', imgFile);

  try {
    const res  = await fetch(API + 'cases.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      closeCaseModal();
      showToast(data.message, 'success');
      loadCases(); loadStats(); loadRecentCases();
    } else {
      alertEl.textContent = data.message; alertEl.className = 'alert error';
    }
  } catch(e) {
    alertEl.textContent = 'Server error.'; alertEl.className = 'alert error';
  }
  btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Case';
}

function deleteCase(id, title) {
  showConfirm(`Delete case "${title}"? This cannot be undone.`, async () => {
    const fd = new FormData(); fd.append('action','delete'); fd.append('id', id);
    try {
      const res = await fetch(API + 'cases.php', { method: 'POST', body: fd });
      const d   = await res.json();
      showToast(d.message, d.success ? 'success' : 'error');
      if (d.success) { loadCases(); loadStats(); loadRecentCases(); }
    } catch(e) {}
  });
}

// ─── USERS ───
async function loadUsers() {
  try {
    const res  = await fetch(API + 'users.php?action=get_all');
    const data = await res.json();
    allUsers   = data.success ? data.data : [];
    renderUsers(allUsers);
  } catch(e) {
    document.getElementById('usersTbody').innerHTML = '<tr><td colspan="8" class="loading-row">Failed to load users.</td></tr>';
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTbody');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No users found.</td></tr>'; return; }
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td style="color:var(--muted)">${i+1}</td>
      <td><strong>${escHtml(u.full_name)}</strong></td>
      <td style="color:var(--muted)">${escHtml(u.email)}</td>
      <td>${escHtml(u.phone||'—')}</td>
      <td>${u.role === 'admin' ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-user">User</span>'}</td>
      <td><span class="badge badge-${u.status}">${u.status}</span></td>
      <td style="color:var(--muted);font-size:12px">${u.created_at?.split(' ')[0]||'—'}</td>
      <td>
        <button class="icon-btn edit"   onclick="editUser(${u.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="icon-btn toggle" onclick="toggleUserStatus(${u.id},'${u.status}')" title="Toggle Status"><i class="fas fa-power-off"></i></button>
        <button class="icon-btn del"   onclick="deleteUserConfirm(${u.id},'${escHtml(u.full_name)}')" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function filterUsers() {
  const q    = document.getElementById('userSearch').value.toLowerCase();
  const role = document.getElementById('userRoleFilter').value;
  renderUsers(allUsers.filter(u =>
    (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!role || u.role === role)
  ));
}

function openUserModal(data = null) {
  document.getElementById('userModalTitle').textContent = data ? 'Edit User' : 'Add New User';
  document.getElementById('userId').value  = data?.id || '';
  document.getElementById('uName').value   = data?.full_name || '';
  document.getElementById('uEmail').value  = data?.email || '';
  document.getElementById('uPhone').value  = data?.phone || '';
  document.getElementById('uRole').value   = data?.role || 'user';
  document.getElementById('uPass').value   = '';
  document.getElementById('passHint').style.display = data ? 'inline' : 'none';
  document.getElementById('userAlert').className = 'alert';
  document.getElementById('userModalOverlay').classList.add('open');
}

function closeUserModal(e) {
  if (!e || e.target === document.getElementById('userModalOverlay')) {
    document.getElementById('userModalOverlay').classList.remove('open');
  }
}

async function editUser(id) {
  try {
    const res  = await fetch(API + `users.php?action=get_one&id=${id}`);
    const data = await res.json();
    if (data.success) openUserModal(data.data);
  } catch(e) {}
}

async function saveUser() {
  const id      = document.getElementById('userId').value;
  const name    = document.getElementById('uName').value.trim();
  const email   = document.getElementById('uEmail').value.trim();
  const alertEl = document.getElementById('userAlert');

  if (!name || !email) { alertEl.textContent = 'Name and email are required.'; alertEl.className = 'alert error'; return; }

  const btn = document.getElementById('saveUserBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';

  const fd = new FormData();
  fd.append('action', id ? 'edit' : 'add');
  if (id) fd.append('id', id);
  fd.append('full_name', name);
  fd.append('email',     email);
  fd.append('phone',     document.getElementById('uPhone').value);
  fd.append('role',      document.getElementById('uRole').value);
  fd.append('password',  document.getElementById('uPass').value);

  try {
    const res  = await fetch(API + 'users.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      closeUserModal();
      showToast(data.message, 'success');
      loadUsers();
    } else {
      alertEl.textContent = data.message; alertEl.className = 'alert error';
    }
  } catch(e) {
    alertEl.textContent = 'Server error.'; alertEl.className = 'alert error';
  }
  btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save User';
}

async function toggleUserStatus(id, status) {
  const fd = new FormData(); fd.append('action','toggle'); fd.append('id', id); fd.append('status', status);
  try {
    const res = await fetch(API + 'users.php', { method: 'POST', body: fd });
    const d   = await res.json();
    showToast(d.message, d.success ? 'success' : 'error');
    if (d.success) loadUsers();
  } catch(e) {}
}

function deleteUserConfirm(id, name) {
  showConfirm(`Delete user "${name}"? This cannot be undone.`, async () => {
    const fd = new FormData(); fd.append('action','delete'); fd.append('id', id);
    try {
      const res = await fetch(API + 'users.php', { method: 'POST', body: fd });
      const d   = await res.json();
      showToast(d.message, d.success ? 'success' : 'error');
      if (d.success) loadUsers();
    } catch(e) {}
  });
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

// ─── CONFIRM MODAL ───
let confirmCallback = null;
function showConfirm(msg, cb) {
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmOverlay').classList.add('open');
  confirmCallback = cb;
  document.getElementById('confirmYes').onclick = () => { closeConfirm(); cb(); };
}
function closeConfirm() { document.getElementById('confirmOverlay').classList.remove('open'); }

// ─── TOAST ───
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✓ ' : '✗ ') + msg;
  t.className   = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3000);
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
