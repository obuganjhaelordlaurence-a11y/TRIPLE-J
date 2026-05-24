/* ════════════════════════════════════════════════════════════
   SPORTS TRAINING ACADEMY — APP.JS
   ════════════════════════════════════════════════════════════ */

const API = '/api';
let token = localStorage.getItem('sta_token');
let currentUser = JSON.parse(localStorage.getItem('sta_user') || 'null');

// ─── PAGE ROUTER ──────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Load data for the page
  if (name === 'home') loadHome();
  if (name === 'sessions') loadSessions();
  if (name === 'coaches') loadCoaches();
  if (name === 'achievements') loadAchievements();
  if (name === 'portal') { requireAuth(); loadPortal(); }
  if (name === 'hub') { requireAuth(); loadHub(); }
}

function requireAuth() {
  if (!token) {
    showToast('Please log in to access this page.', 'error');
    showModal('login-modal');
    showPage('home');
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
async function register() {
  const full_name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const errEl = document.getElementById('reg-error');
  if (!full_name || !email || !password) {
    errEl.textContent = 'All fields are required.'; errEl.classList.remove('hidden'); return;
  }
  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.classList.remove('hidden'); return; }
    setAuth(data.token, data.user);
    closeModal('register-modal');
    showToast('Welcome, ' + data.user.full_name + '!', 'success');
  } catch { errEl.textContent = 'Connection error.'; errEl.classList.remove('hidden'); }
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.classList.remove('hidden'); return; }
    setAuth(data.token, data.user);
    closeModal('login-modal');
    showToast('Welcome back, ' + data.user.full_name + '!', 'success');
  } catch { errEl.textContent = 'Connection error.'; errEl.classList.remove('hidden'); }
}

function setAuth(t, user) {
  token = t; currentUser = user;
  localStorage.setItem('sta_token', t);
  localStorage.setItem('sta_user', JSON.stringify(user));
  updateAuthUI();
}

function logout() {
  token = null; currentUser = null;
  localStorage.removeItem('sta_token');
  localStorage.removeItem('sta_user');
  updateAuthUI();
  showPage('home');
  showToast('Logged out successfully.');
}

function updateAuthUI() {
  const authBtns = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const navPortal = document.getElementById('nav-portal');
  const navHub = document.getElementById('nav-hub');
  if (token && currentUser) {
    authBtns.classList.add('hidden');
    userInfo.classList.remove('hidden');
    document.getElementById('user-greeting').textContent = currentUser.full_name;
    navPortal.classList.remove('hidden');
    navHub.classList.remove('hidden');
  } else {
    authBtns.classList.remove('hidden');
    userInfo.classList.add('hidden');
    navPortal.classList.add('hidden');
    navHub.classList.add('hidden');
  }
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
async function loadHome() {
  try {
    const [sessRes, statsRes] = await Promise.all([
      fetch(`${API}/sessions`),
      token ? fetch(`${API}/stats`, { headers: authH() }) : Promise.resolve(null)
    ]);
    const sessions = await sessRes.json();
    renderSessionCards(sessions.slice(0, 3), 'sessions-preview');

    if (statsRes && statsRes.ok) {
      const stats = await statsRes.json();
      document.getElementById('stat-athletes').textContent = stats.athletes;
      document.getElementById('stat-sessions').textContent = stats.sessions;
      document.getElementById('stat-apps').textContent = stats.applications;
    } else {
      document.getElementById('stat-athletes').textContent = sessions.length || '4';
      document.getElementById('stat-sessions').textContent = sessions.length;
      document.getElementById('stat-apps').textContent = '—';
    }
  } catch(e) { console.warn(e); }
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
async function loadSessions() {
  try {
    const res = await fetch(`${API}/sessions`);
    const sessions = await res.json();
    renderSessionCards(sessions, 'sessions-list');
  } catch(e) { console.warn(e); }
}

function renderSessionCards(sessions, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!sessions.length) { el.innerHTML = '<p style="color:var(--muted);padding:20px">No sessions found.</p>'; return; }
  el.innerHTML = sessions.map(s => {
    const pct = s.max_slots ? Math.min(100, Math.round((s.enrolled / s.max_slots) * 100)) : 0;
    return `
    <div class="session-card">
      <span class="session-sport">${s.sport || 'General'}</span>
      <h3>${s.title}</h3>
      <div class="session-meta">
        <span>📅 ${formatDate(s.date)}</span>
        <span>🕐 ${s.time}</span>
        <span>📍 ${s.location || 'TBA'}</span>
        <span>👤 ${s.coach_name || 'TBA'}</span>
      </div>
      <div class="session-footer">
        <div class="slots-bar"><div class="slots-fill" style="width:${pct}%"></div></div>
        <span class="slots-text">${s.enrolled}/${s.max_slots} enrolled</span>
      </div>
    </div>`;
  }).join('');
}

// ─── COACHES ─────────────────────────────────────────────────────────────────
const SPORT_ICONS = { Tennis:'🎾', Football:'⚽', Gymnastics:'🤸', Athletics:'🏃', Basketball:'🏀', Swimming:'🏊', Boxing:'🥊', Default:'🏅' };

async function loadCoaches() {
  try {
    const res = await fetch(`${API}/coaches`);
    const coaches = await res.json();
    const el = document.getElementById('coaches-list');
    el.innerHTML = coaches.map(c => `
      <div class="coach-card">
        <div class="coach-avatar">${SPORT_ICONS[c.sport] || SPORT_ICONS.Default}</div>
        <div class="coach-info">
          <h3>${c.full_name}</h3>
          <span class="coach-sport">${c.sport}</span>
          <p>${c.bio || ''}</p>
          <p class="coach-flag">🌍 ${c.country} · ${c.experience_years} years experience</p>
        </div>
      </div>`).join('');
  } catch(e) { console.warn(e); }
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
async function loadAchievements() {
  try {
    const res = await fetch(`${API}/achievements`);
    const list = await res.json();
    const el = document.getElementById('achievements-list');
    const empty = document.getElementById('achievements-empty');
    if (!list.length) { el.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    el.innerHTML = list.map(a => `
      <div class="achievement-card">
        <div class="medal">🏆</div>
        <h3>${a.title}</h3>
        <div class="ath-name">${a.athlete_name || 'Academy'}</div>
        <p>${a.description || ''}</p>
        ${a.date ? `<p style="color:var(--muted);font-size:12px;margin-top:8px">${formatDate(a.date)}</p>` : ''}
      </div>`).join('');
  } catch(e) { console.warn(e); }
}

// ─── PORTAL ──────────────────────────────────────────────────────────────────
async function loadPortal() {
  await Promise.all([loadAthletes(), loadApplications(), loadPayments()]);
}

async function loadAthletes() {
  try {
    const res = await fetch(`${API}/athletes`, { headers: authH() });
    const list = await res.json();
    const tbody = document.getElementById('athletes-tbody');
    tbody.innerHTML = list.map(a => `
      <tr>
        <td>${a.full_name}</td>
        <td>${a.sport || '—'}</td>
        <td>${a.level || '—'}</td>
        <td>${a.age || '—'}</td>
        <td>${a.contact || '—'}</td>
        <td>
          <button class="action-btn" onclick="editAthlete(${a.id}, '${esc(a.full_name)}', '${a.age||''}', '${esc(a.sport||'')}', '${a.level||'Beginner'}', '${esc(a.contact||'')}')">Edit</button>
          <button class="action-btn del" onclick="deleteAthlete(${a.id})">Delete</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">No athletes yet.</td></tr>';
    populateAthleteSelects(list);
  } catch(e) { console.warn(e); }
}

async function saveAthlete() {
  const id = document.getElementById('athlete-edit-id').value;
  const body = {
    full_name: document.getElementById('ath-name').value,
    age: document.getElementById('ath-age').value,
    sport: document.getElementById('ath-sport').value,
    level: document.getElementById('ath-level').value,
    contact: document.getElementById('ath-contact').value,
  };
  const url = id ? `${API}/athletes/${id}` : `${API}/athletes`;
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...authH() }, body: JSON.stringify(body) });
  closeModal('athlete-modal');
  clearAthleteForm();
  await loadAthletes();
  showToast(id ? 'Athlete updated.' : 'Athlete added.', 'success');
}

function editAthlete(id, name, age, sport, level, contact) {
  document.getElementById('athlete-edit-id').value = id;
  document.getElementById('ath-name').value = name;
  document.getElementById('ath-age').value = age;
  document.getElementById('ath-sport').value = sport;
  document.getElementById('ath-level').value = level;
  document.getElementById('ath-contact').value = contact;
  document.getElementById('athlete-modal-title').textContent = 'Edit Athlete';
  showModal('athlete-modal');
}

async function deleteAthlete(id) {
  if (!confirm('Delete this athlete record?')) return;
  await fetch(`${API}/athletes/${id}`, { method: 'DELETE', headers: authH() });
  await loadAthletes();
  showToast('Athlete deleted.');
}

function clearAthleteForm() {
  ['athlete-edit-id','ath-name','ath-age','ath-sport','ath-contact'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('athlete-modal-title').textContent = 'Add Athlete';
}

async function loadApplications() {
  try {
    const res = await fetch(`${API}/applications`, { headers: authH() });
    const list = await res.json();
    const tbody = document.getElementById('apps-tbody');
    tbody.innerHTML = list.map(a => `
      <tr>
        <td>${a.athlete_name}</td>
        <td>${a.session_title}</td>
        <td><span class="badge badge-${a.status}">${a.status}</span></td>
        <td>${formatDate(a.applied_at)}</td>
      </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--muted)">No applications yet.</td></tr>';
  } catch(e) { console.warn(e); }
}

async function submitApplication() {
  const athlete_id = document.getElementById('apply-athlete').value;
  const session_id = document.getElementById('apply-session').value;
  if (!athlete_id || !session_id) { showToast('Select athlete and session.', 'error'); return; }
  await fetch(`${API}/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authH() }, body: JSON.stringify({ athlete_id, session_id }) });
  closeModal('apply-modal');
  await loadApplications();
  showToast('Application submitted!', 'success');
}

async function loadPayments() {
  try {
    const res = await fetch(`${API}/payments`, { headers: authH() });
    const list = await res.json();
    const tbody = document.getElementById('payments-tbody');
    tbody.innerHTML = list.map(p => `
      <tr>
        <td>${p.athlete_name || '—'}</td>
        <td>${p.type}</td>
        <td>₱${Number(p.amount).toLocaleString()}</td>
        <td style="font-family:var(--font-mono);font-size:12px">${p.receipt_no}</td>
        <td>${formatDate(p.paid_at)}</td>
      </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No payments yet.</td></tr>';
  } catch(e) { console.warn(e); }
}

async function submitPayment() {
  const athlete_id = document.getElementById('pay-athlete').value;
  const amount = document.getElementById('pay-amount').value;
  const type = document.getElementById('pay-type').value;
  if (!athlete_id || !amount) { showToast('Fill all fields.', 'error'); return; }
  const res = await fetch(`${API}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authH() }, body: JSON.stringify({ athlete_id, amount, type }) });
  const data = await res.json();
  document.getElementById('receipt-out').innerHTML = `✅ Payment Successful!<br>Receipt No: ${data.receipt_no}<br>Amount: ₱${Number(amount).toLocaleString()}<br>Type: ${type}`;
  document.getElementById('receipt-out').classList.remove('hidden');
  await loadPayments();
  showToast('Payment recorded!', 'success');
}

// ─── HUB ─────────────────────────────────────────────────────────────────────
async function loadHub() {
  try {
    const res = await fetch(`${API}/performance`, { headers: authH() });
    const list = await res.json();
    const tbody = document.getElementById('perf-tbody');
    tbody.innerHTML = list.map(p => `
      <tr>
        <td>${p.athlete_name}</td>
        <td>${p.score !== null ? p.score : '—'}</td>
        <td><span class="badge badge-${p.attendance === 'present' ? 'approved' : 'pending'}">${p.attendance}</span></td>
        <td>${p.notes || '—'}</td>
        <td>${formatDate(p.recorded_at)}</td>
      </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No records yet.</td></tr>';
    populatePerfAthleteSelect();
  } catch(e) { console.warn(e); }
}

async function submitPerf() {
  const athlete_id = document.getElementById('perf-athlete').value;
  const score = document.getElementById('perf-score').value;
  const notes = document.getElementById('perf-notes').value;
  const attendance = document.getElementById('perf-att').value;
  if (!athlete_id) { showToast('Select an athlete.', 'error'); return; }
  await fetch(`${API}/performance`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authH() }, body: JSON.stringify({ athlete_id, score, notes, attendance }) });
  closeModal('perf-modal');
  await loadHub();
  showToast('Performance record saved!', 'success');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function authH() { return { Authorization: `Bearer ${token}` }; }
function esc(s) { return String(s).replace(/'/g, "\\'"); }
function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? d : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function populateAthleteSelects(list) {
  ['apply-athlete', 'pay-athlete'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.map(a => `<option value="${a.id}">${a.full_name}</option>`).join('') || '<option>No athletes</option>';
  });
  const sessRes = await fetch(`${API}/sessions`);
  const sessions = await sessRes.json();
  const sessEl = document.getElementById('apply-session');
  if (sessEl) sessEl.innerHTML = sessions.map(s => `<option value="${s.id}">${s.title} – ${s.date}</option>`).join('');
}

async function populatePerfAthleteSelect() {
  try {
    const res = await fetch(`${API}/athletes`, { headers: authH() });
    const list = await res.json();
    const el = document.getElementById('perf-athlete');
    if (el) el.innerHTML = list.map(a => `<option value="${a.id}">${a.full_name}</option>`).join('') || '<option>No athletes</option>';
  } catch {}
}

// ─── MODAL HELPERS ────────────────────────────────────────────────────────────
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}
function switchModal(from, to) { closeModal(from); showModal(to); }

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

// ─── TAB SWITCHER ─────────────────────────────────────────────────────────────
function showTab(tabId, link) {
  const parent = link.closest('.portal-layout');
  parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  parent.querySelectorAll('.sn').forEach(a => a.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  link.classList.add('active');
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.add('hidden'), 3500);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
updateAuthUI();
loadHome();
