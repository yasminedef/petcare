/* =========================================================
   PetCare — Application
   ========================================================= */

// ---------- Navigation ----------
const views = ['dashboard', 'pets', 'health', 'appointments', 'weight', 'reminders'];

function navigate(view) {
  if (!views.includes(view)) return;

  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + view)?.classList.remove('hidden');

  document.querySelectorAll('.side-link, .bn-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  render[view]?.();
}

document.querySelectorAll('.side-link, .bn-link').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

// ---------- General helpers ----------
function ageFrom(birthday) {
  if (!birthday) return '—';
  const b = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  return years + (years > 1 ? ' years' : ' year');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
}

function toast(message, type = 'success') {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.dataset.type = type;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- Modal ----------
function openModal({ title, content, onSave, saveLabel = 'Save' }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-head">
        <h2>${title}</h2>
        <button type="button" class="modal-close" aria-label="Close">✕</button>
      </header>
      <form class="modal-form">
        <div class="modal-body">${content}</div>
        <footer class="modal-foot">
          <button type="button" class="btn btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary modal-save">${saveLabel}</button>
        </footer>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const form = overlay.querySelector('.modal-form');
  const close = () => closeModal();

  overlay.querySelector('.modal-close').onclick = close;
  overlay.querySelector('.modal-cancel').onclick = close;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const ok = onSave(data);
    if (ok !== false) close();
  });

  setTimeout(() => form.querySelector('input, select, textarea')?.focus(), 100);
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  setTimeout(() => overlay.remove(), 200);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---------- Pet form ----------
function petForm(pet = {}) {
  const speciesList = ['Cat','Dog','Rabbit','Bird','Fish','Hamster','Turtle','Horse','Ferret','Reptile','Other'];
  return `
    <div class="form-row">
      <label>Name *
        <input name="name" required value="${pet.name ?? ''}" placeholder="e.g. Piston">
      </label>
      <label>Species *
        <select name="species" required>
          ${speciesList.map(s =>
            `<option value="${s}" ${pet.species === s ? 'selected' : ''}>${petEmoji(s)} ${s}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="form-row">
      <label>Breed
        <input name="breed" value="${pet.breed ?? ''}" placeholder="e.g. European Shorthair">
      </label>
      <label>Gender
        <select name="gender">
          ${['Male','Female'].map(g =>
            `<option ${pet.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="form-row">
      <label>Birthday
        <input type="date" name="birthday" value="${pet.birthday ?? ''}">
      </label>
      <label>Weight (kg)
        <input type="number" step="0.1" name="weight" value="${pet.weight ?? ''}" placeholder="4.8">
      </label>
    </div>
    <div class="form-row">
      <label>Color
        <input name="color" value="${pet.color ?? ''}" placeholder="e.g. Gray tabby">
      </label>
      <label>Microchip ID
        <input name="microchip" value="${pet.microchip ?? ''}" placeholder="Optional">
      </label>
    </div>
    <div class="form-row">
      <label>Owner
        <input name="owner" value="${pet.owner ?? 'Yasmine'}">
      </label>
      <label>Veterinarian
        <input name="vet" value="${pet.vet ?? ''}" placeholder="e.g. Dr. Martin">
      </label>
    </div>
    <label class="full">Notes
      <textarea name="notes" rows="2" placeholder="Short description...">${pet.notes ?? ''}</textarea>
    </label>
  `;
}

// ---------- Pet CRUD ----------
function addPet() {
  openModal({
    title: 'Add a pet',
    content: petForm(),
    saveLabel: 'Add',
    onSave: (data) => {
      if (!data.name || !data.species) return false;
      const pet = {
        id: uid('p'),
        name: data.name.trim(),
        species: data.species,
        breed: data.breed?.trim() || '—',
        gender: data.gender || 'Male',
        birthday: data.birthday || '',
        weight: parseFloat(data.weight) || 0,
        color: data.color || '—',
        microchip: data.microchip || '—',
        owner: data.owner || 'Yasmine',
        vet: data.vet || '—',
        emoji: petEmoji(data.species),
        notes: data.notes || ''
      };
      state.pets.push(pet);
      saveData();
      toast(`${pet.name} joined the family 🐾`);
      render.pets();
      return true;
    }
  });
}

function editPet(id) {
  const pet = getPet(id);
  if (!pet) return;

  openModal({
    title: `Edit ${pet.name}`,
    content: petForm(pet),
    onSave: (data) => {
      Object.assign(pet, {
        name: data.name.trim(),
        species: data.species,
        breed: data.breed || '—',
        gender: data.gender,
        birthday: data.birthday,
        weight: parseFloat(data.weight) || pet.weight,
        color: data.color || '—',
        microchip: data.microchip || '—',
        owner: data.owner,
        vet: data.vet || '—',
        emoji: petEmoji(data.species),
        notes: data.notes
      });
      saveData();
      toast('Profile updated ✨');
      render.pets();
      return true;
    }
  });
}

function deletePet(id) {
  const pet = getPet(id);
  if (!pet) return;
  if (!confirm(`Delete ${pet.name}? This action is irreversible.`)) return;

  state.pets = state.pets.filter(p => p.id !== id);
  state.vaccinations = state.vaccinations.filter(v => v.petId !== id);
  state.appointments = state.appointments.filter(a => a.petId !== id);
  state.medications  = state.medications.filter(m => m.petId !== id);
  state.weights      = state.weights.filter(w => w.petId !== id);
  state.reminders    = state.reminders.filter(r => r.petId !== id);
  saveData();
  toast(`${pet.name} was removed`, 'warn');
  render.pets();
}

// ---------- Health helpers ----------
function vaxStatus(v) {
  if (!v.nextDue) return 'ok';
  const now = new Date();
  const due = new Date(v.nextDue);
  const days = (due - now) / (1000 * 60 * 60 * 24);
  if (days < 0)   return 'overdue';
  if (days <= 30) return 'soon';
  return 'ok';
}

function vaxStatusLabel(status) {
  return { ok: 'Up to date', soon: 'Due soon', overdue: 'Overdue' }[status];
}

function vaxCard(v) {
  const pet = getPet(v.petId);
  const status = vaxStatus(v);

  return `
    <article class="vax-card ${status}">
      <div class="vax-ico">💉</div>
      <div class="vax-info">
        <div class="vax-line">
          <strong>${v.name}</strong>
          <span class="vax-badge ${status}">${vaxStatusLabel(status)}</span>
        </div>
        <div class="vax-meta">
          <span>${pet?.emoji ?? '🐾'} ${pet?.name ?? '—'}</span>
          <span>Received: ${formatDate(v.date)}</span>
          <span>Next: ${formatDate(v.nextDue)}</span>
        </div>
        ${v.vet ? `<span class="vax-vet">${v.vet}</span>` : ''}
      </div>
      <button class="icon-btn-small danger" data-action="delete-vax" data-id="${v.id}" aria-label="Delete">🗑️</button>
    </article>
  `;
}

function addVaccination(presetPetId = null) {
  if (!state.pets.length) {
    toast('Add a pet first', 'warn');
    return;
  }

  const options = state.pets.map(p =>
    `<option value="${p.id}" ${presetPetId === p.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`
  ).join('');

  openModal({
    title: 'Add a vaccination',
    saveLabel: 'Add',
    content: `
      <label>Pet *
        <select name="petId" required>${options}</select>
      </label>
      <div class="form-row">
        <label>Vaccine name *
          <input name="name" required placeholder="e.g. Rabies">
        </label>
        <label>Veterinarian
          <input name="vet" placeholder="e.g. Dr. Martin">
        </label>
      </div>
      <div class="form-row">
        <label>Date administered *
          <input type="date" name="date" required>
        </label>
        <label>Next due date
          <input type="date" name="nextDue">
        </label>
      </div>
    `,
    onSave: (data) => {
      if (!data.name || !data.date) return false;
      state.vaccinations.push({
        id: uid('v'),
        petId: data.petId,
        name: data.name.trim(),
        vet: data.vet?.trim() || '',
        date: data.date,
        nextDue: data.nextDue || ''
      });
      saveData();
      toast('Vaccination added 💉');
      render.health();
      return true;
    }
  });
}

function deleteVaccination(id) {
  const v = state.vaccinations.find(x => x.id === id);
  if (!v) return;
  if (!confirm(`Delete "${v.name}"?`)) return;

  state.vaccinations = state.vaccinations.filter(x => x.id !== id);
  saveData();
  toast('Vaccination deleted', 'warn');
  render.health();
}

// ---------- Reusable fragments ----------
function petCard(p) {
  return `
    <article class="pet-card">
      <div class="pet-card-head">
        <div class="pet-card-emoji">${p.emoji}</div>
        <div class="pet-card-badge">${p.species}</div>
      </div>
      <h3>${p.name}</h3>
      <p class="pet-card-sub">${p.breed} · ${ageFrom(p.birthday)}</p>
      <div class="pet-card-stats">
        <div><span>Weight</span><strong>${p.weight} kg</strong></div>
        <div><span>Gender</span><strong>${p.gender}</strong></div>
        <div><span>Vet</span><strong>${p.vet}</strong></div>
      </div>
      <div class="pet-card-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit-pet" data-id="${p.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete-pet" data-id="${p.id}">Delete</button>
      </div>
    </article>
  `;
}

function emptyState(icon, title, text, btnLabel, btnAttr = '') {
  return `
    <div class="empty">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${btnLabel ? `<button class="btn btn-primary" ${btnAttr}>${btnLabel}</button>` : ''}
    </div>
  `;
}

/* ---------- Appointments ---------- */
function apptStatusLabel(s) {
  return { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' }[s] || s;
}

function apptCard(a) {
  const pet = getPet(a.petId);
  const status = a.status || 'upcoming';
  const d = new Date(a.date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return `
    <article class="appt-card ${status}">
      <div class="appt-date">
        <strong>${day}</strong>
        <span>${month}</span>
      </div>
      <div class="appt-info">
        <div class="appt-line">
          <strong>${a.reason}</strong>
          <span class="appt-badge ${status}">${apptStatusLabel(status)}</span>
        </div>
        <div class="appt-meta">
          <span>${pet?.emoji ?? '🐾'} ${pet?.name ?? '—'}</span>
          <span>🕐 ${a.time || '—'}</span>
          <span>👨‍⚕️ ${a.vet || '—'}</span>
          ${a.clinic ? `<span>📍 ${a.clinic}</span>` : ''}
        </div>
      </div>
      <div class="appt-actions">
        <button class="icon-btn-small" data-action="edit-appt" data-id="${a.id}" aria-label="Edit">✏️</button>
        <button class="icon-btn-small danger" data-action="delete-appt" data-id="${a.id}" aria-label="Delete">🗑️</button>
      </div>
    </article>
  `;
}

function apptForm(a = {}, presetPetId = null) {
  const options = state.pets.map(p =>
    `<option value="${p.id}" ${(a.petId || presetPetId) === p.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`
  ).join('');

  return `
    <label>Pet *
      <select name="petId" required>${options}</select>
    </label>
    <div class="form-row">
      <label>Date *
        <input type="date" name="date" required value="${a.date ?? ''}">
      </label>
      <label>Time
        <input type="time" name="time" value="${a.time ?? ''}">
      </label>
    </div>
    <label>Reason *
      <input name="reason" required value="${a.reason ?? ''}" placeholder="e.g. Annual check-up">
    </label>
    <div class="form-row">
      <label>Veterinarian
        <input name="vet" value="${a.vet ?? ''}" placeholder="e.g. Dr. Martin">
      </label>
      <label>Clinic
        <input name="clinic" value="${a.clinic ?? ''}" placeholder="e.g. Park Clinic">
      </label>
    </div>
    <label>Status
      <select name="status">
        ${[
          ['upcoming', 'Upcoming'],
          ['completed', 'Completed'],
          ['cancelled', 'Cancelled']
        ].map(([v, l]) =>
          `<option value="${v}" ${a.status === v ? 'selected' : ''}>${l}</option>`
        ).join('')}
      </select>
    </label>
  `;
}

function addAppointment(presetPetId = null) {
  if (!state.pets.length) {
    toast('Add a pet first', 'warn');
    return;
  }
  openModal({
    title: 'Add an appointment',
    saveLabel: 'Add',
    content: apptForm({}, presetPetId),
    onSave: (data) => {
      if (!data.date || !data.reason) return false;
      state.appointments.push({
        id: uid('a'),
        petId: data.petId,
        date: data.date,
        time: data.time || '',
        reason: data.reason.trim(),
        vet: data.vet?.trim() || '',
        clinic: data.clinic?.trim() || '',
        status: data.status || 'upcoming'
      });
      saveData();
      toast('Appointment added 🩺');
      render.appointments();
      return true;
    }
  });
}

function editAppointment(id) {
  const a = state.appointments.find(x => x.id === id);
  if (!a) return;

  openModal({
    title: 'Edit appointment',
    content: apptForm(a),
    onSave: (data) => {
      Object.assign(a, {
        petId: data.petId,
        date: data.date,
        time: data.time || '',
        reason: data.reason.trim(),
        vet: data.vet || '',
        clinic: data.clinic || '',
        status: data.status
      });
      saveData();
      toast('Appointment updated ✨');
      render.appointments();
      return true;
    }
  });
}

function deleteAppointment(id) {
  const a = state.appointments.find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Delete "${a.reason}"?`)) return;
  state.appointments = state.appointments.filter(x => x.id !== id);
  saveData();
  toast('Appointment deleted', 'warn');
  render.appointments();
}

/* ---------- Weight ---------- */
function addWeight(presetPetId = null) {
  if (!state.pets.length) {
    toast('Add a pet first', 'warn');
    return;
  }

  const options = state.pets.map(p =>
    `<option value="${p.id}" ${presetPetId === p.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`
  ).join('');

  const today = new Date().toISOString().slice(0, 10);

  openModal({
    title: 'Add a weigh-in',
    saveLabel: 'Add',
    content: `
      <label>Pet *
        <select name="petId" required>${options}</select>
      </label>
      <div class="form-row">
        <label>Date *
          <input type="date" name="date" required value="${today}">
        </label>
        <label>Weight (kg) *
          <input type="number" step="0.1" name="value" required placeholder="4.8">
        </label>
      </div>
    `,
    onSave: (data) => {
      const val = parseFloat(data.value);
      if (!data.date || isNaN(val)) return false;
      state.weights.push({
        id: uid('w'),
        petId: data.petId,
        date: data.date,
        value: val
      });
      const pet = getPet(data.petId);
      const petWeights = state.weights
        .filter(w => w.petId === data.petId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      if (pet && petWeights[0]?.id) pet.weight = petWeights[0].value;

      saveData();
      toast('Weigh-in added ⚖️');
      render.weight();
      return true;
    }
  });
}

function deleteWeight(id) {
  const w = state.weights.find(x => x.id === id);
  if (!w) return;
  if (!confirm('Delete this weigh-in?')) return;
  state.weights = state.weights.filter(x => x.id !== id);
  saveData();
  toast('Weigh-in deleted', 'warn');
  render.weight();
}

function drawWeightChart(canvas, points) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padX = 40;
  const padY = 30;

  ctx.clearRect(0, 0, w, h);

  const values = points.map(p => p.value);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;

  const xAt = i => padX + (i * (w - padX * 2)) / (points.length - 1);
  const yAt = v => h - padY - ((v - min) / range) * (h - padY * 2);

  ctx.strokeStyle = '#EDE6D6';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padY + (i * (h - padY * 2)) / 4;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = '#F6D978';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  points.forEach((p, i) => {
    const x = xAt(i);
    const y = yAt(p.value);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.font = '600 11px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  points.forEach((p, i) => {
    const x = xAt(i);
    const y = yAt(p.value);

    ctx.beginPath();
    ctx.fillStyle = '#51483F';
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#51483F';
    ctx.fillText(p.value + '', x, y - 12);
  });
}

/* ---------- Reminders ---------- */
const REM_TYPES = ['💉', '🩺', '💊', '🍖', '⚖️', '🔔'];
const REM_PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'Important' },
  { value: 'urgent', label: 'Urgent' }
];

function remPriorityLabel(p) {
  return { normal: 'Normal', high: 'Important', urgent: 'Urgent' }[p] || 'Normal';
}

function remCard(r) {
  const pet = getPet(r.petId);
  const priority = r.priority || 'normal';

  return `
    <article class="rem-card ${priority} ${r.done ? 'done' : ''}">
      <button class="rem-check" data-action="toggle-rem" data-id="${r.id}" aria-label="Mark as done">
        ${r.done ? '✓' : ''}
      </button>
      <div class="rem-info">
        <div class="rem-line">
          <strong>${r.type} ${r.text}</strong>
          <span class="rem-badge ${priority}">${remPriorityLabel(priority)}</span>
        </div>
        <div class="rem-meta">
          <span>${pet?.emoji ?? '🐾'} ${pet?.name ?? '—'}</span>
          <span>🗓️ ${formatDate(r.date)}</span>
        </div>
      </div>
      <button class="icon-btn-small danger" data-action="delete-rem" data-id="${r.id}" aria-label="Delete">🗑️</button>
    </article>
  `;
}

function remForm(r = {}, presetPetId = null) {
  const options = state.pets.map(p =>
    `<option value="${p.id}" ${(r.petId || presetPetId) === p.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`
  ).join('');

  const today = new Date().toISOString().slice(0, 10);

  return `
    <label>Pet *
      <select name="petId" required>${options}</select>
    </label>
    <div class="form-row">
      <label>Type
        <select name="type">
          ${REM_TYPES.map(t => `<option ${r.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </label>
      <label>Priority
        <select name="priority">
          ${REM_PRIORITIES.map(p =>
            `<option value="${p.value}" ${r.priority === p.value ? 'selected' : ''}>${p.label}</option>`
          ).join('')}
        </select>
      </label>
    </div>
    <label>Description *
      <input name="text" required value="${r.text ?? ''}" placeholder="e.g. Rabies vaccine renewal">
    </label>
    <label>Date *
      <input type="date" name="date" required value="${r.date ?? today}">
    </label>
  `;
}

function addReminder(presetPetId = null) {
  if (!state.pets.length) {
    toast('Add a pet first', 'warn');
    return;
  }
  openModal({
    title: 'Add a reminder',
    saveLabel: 'Add',
    content: remForm({}, presetPetId),
    onSave: (data) => {
      if (!data.text || !data.date) return false;
      state.reminders.push({
        id: uid('r'),
        petId: data.petId,
        type: data.type || '🔔',
        text: data.text.trim(),
        date: data.date,
        priority: data.priority || 'normal',
        done: false
      });
      saveData();
      toast('Reminder added 🔔');
      render.reminders();
      return true;
    }
  });
}

function toggleReminder(id) {
  const r = state.reminders.find(x => x.id === id);
  if (!r) return;
  r.done = !r.done;
  saveData();
  toast(r.done ? 'Reminder completed ✓' : 'Reminder reactivated');
  render.reminders();
}

function deleteReminder(id) {
  const r = state.reminders.find(x => x.id === id);
  if (!r) return;
  if (!confirm(`Delete "${r.text}"?`)) return;
  state.reminders = state.reminders.filter(x => x.id !== id);
  saveData();
  toast('Reminder deleted', 'warn');
  render.reminders();
}

// ---------- RENDERERS ----------
const render = {
  dashboard() {
    const el = document.getElementById('view-dashboard');
    const pets = state.pets;

    if (!pets.length) {
      el.innerHTML = emptyState('🐾', 'No pets yet', 'Start by adding your first companion.', 'Add a pet', 'data-action="add-pet"');
      el.querySelector('[data-action="add-pet"]').onclick = addPet;
      return;
    }

    const upcoming = [
      ...state.vaccinations.filter(v => v.nextDue).map(v => ({ type: '💉', label: 'Vaccination', date: v.nextDue, petId: v.petId, text: v.name })),
      ...state.appointments.filter(a => a.status === 'upcoming').map(a => ({ type: '🩺', label: 'Appointment', date: a.date, petId: a.petId, text: a.reason })),
      ...state.medications.filter(m => m.status === 'active' && m.end).map(m => ({ type: '💊', label: 'Treatment', date: m.end, petId: m.petId, text: m.name }))
    ]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);

    const totalWeight = pets.reduce((s, p) => s + (p.weight || 0), 0);
    const activeMeds = state.medications.filter(m => m.status === 'active').length;
    const upcomingAppts = state.appointments.filter(a => a.status === 'upcoming').length;
    const totalVax = state.vaccinations.length;

    el.innerHTML = `
      <div class="page-head">
        <h1>Good evening, Yasmine 🤍</h1>
        <p>Here's what's happening with your pets today.</p>
      </div>

      <div class="dash-grid">
        <div class="dash-col-main">
          <h2 class="section-title">Your pets</h2>
          <div class="pet-mini-grid">
            ${pets.map(p => `
              <article class="pet-mini" data-pet="${p.id}">
                <div class="pet-mini-emoji">${p.emoji}</div>
                <div class="pet-mini-info">
                  <strong>${p.name}</strong>
                  <span>${p.species} · ${ageFrom(p.birthday)}</span>
                  <span class="pet-mini-weight">${p.weight} kg</span>
                </div>
                <button class="icon-btn-small" data-action="edit-pet" data-id="${p.id}" aria-label="Edit">✏️</button>
              </article>
            `).join('')}
          </div>

          <h2 class="section-title" style="margin-top:32px">Upcoming events</h2>
          ${upcoming.length ? `
            <div class="event-list">
              ${upcoming.map(ev => {
                const pet = getPet(ev.petId);
                return `
                  <div class="event-item">
                    <div class="event-ico">${ev.type}</div>
                    <div class="event-info">
                      <strong>${ev.label} · ${ev.text}</strong>
                      <span>${pet?.name ?? '—'} — ${formatDate(ev.date)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : emptyState('📅', 'Nothing scheduled', 'Enjoy some extra cuddles 🐾')}
        </div>

        <aside class="dash-col-side">
          <h2 class="section-title">Health overview</h2>
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-ico">⚖️</span>
              <strong>${totalWeight.toFixed(1)} kg</strong>
              <span>Total weight</span>
            </div>
            <div class="stat-card">
              <span class="stat-ico">💉</span>
              <strong>${totalVax}</strong>
              <span>Vaccinations</span>
            </div>
            <div class="stat-card">
              <span class="stat-ico">🩺</span>
              <strong>${upcomingAppts}</strong>
              <span>Upcoming visits</span>
            </div>
            <div class="stat-card">
              <span class="stat-ico">💊</span>
              <strong>${activeMeds}</strong>
              <span>Active treatments</span>
            </div>
          </div>

          <h2 class="section-title" style="margin-top:32px">Quick actions</h2>
          <div class="quick-actions">
            <button class="qa" data-action="add-pet">+ Add a pet</button>
            <button class="qa" data-action="goto-health">+ Add a vaccination</button>
            <button class="qa" data-action="goto-appointments">+ Add an appointment</button>
            <button class="qa" data-action="goto-reminders">+ Add a reminder</button>
          </div>
        </aside>
      </div>
    `;

    el.querySelectorAll('[data-action="edit-pet"]').forEach(b => {
      b.onclick = (e) => { e.stopPropagation(); editPet(b.dataset.id); };
    });
    el.querySelectorAll('.pet-mini').forEach(c => {
      c.onclick = () => navigate('pets');
    });
    el.querySelector('[data-action="add-pet"]').onclick = addPet;
    el.querySelector('[data-action="goto-health"]').onclick = () => navigate('health');
    el.querySelector('[data-action="goto-appointments"]').onclick = () => navigate('appointments');
    el.querySelector('[data-action="goto-reminders"]').onclick = () => navigate('reminders');
  },

  pets() {
    const el = document.getElementById('view-pets');
    const pets = state.pets;

    el.innerHTML = `
      <div class="page-head page-head-row">
        <div>
          <h1>My pets</h1>
          <p>${pets.length} companion${pets.length > 1 ? 's' : ''} in your family.</p>
        </div>
        <button class="btn btn-primary" id="add-pet-btn">+ Add a pet</button>
      </div>

      ${pets.length ? `
        <div class="pets-grid">
          ${pets.map(p => petCard(p)).join('')}
        </div>
      ` : emptyState('🐾', 'No pets yet', 'Add your first companion to get started.', 'Add a pet', 'id="add-pet-empty"')}
    `;

    el.querySelector('#add-pet-btn')?.addEventListener('click', addPet);
    el.querySelector('#add-pet-empty')?.addEventListener('click', addPet);

    el.querySelectorAll('[data-action="edit-pet"]').forEach(b => {
      b.onclick = () => editPet(b.dataset.id);
    });
    el.querySelectorAll('[data-action="delete-pet"]').forEach(b => {
      b.onclick = () => deletePet(b.dataset.id);
    });
  },

  health() {
    const el = document.getElementById('view-health');
    const pets = state.pets;

    if (!pets.length) {
      el.innerHTML = `
        <div class="page-head">
          <h1>Health</h1>
          <p>Track your pets' vaccinations.</p>
        </div>
        ${emptyState('🐾', 'No pets yet', 'Add a pet to track their health.', 'Add a pet', 'id="go-add-pet"')}
      `;
      el.querySelector('#go-add-pet').onclick = addPet;
      return;
    }

    const filter = el.dataset.filter || 'all';
    const vaccins = state.vaccinations
      .filter(v => filter === 'all' || v.petId === filter)
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));

    const counts = { ok: 0, soon: 0, overdue: 0 };
    state.vaccinations.forEach(v => counts[vaxStatus(v)]++);

    el.innerHTML = `
      <div class="page-head page-head-row">
        <div>
          <h1>Health</h1>
          <p>Track your pets' vaccinations.</p>
        </div>
        <button class="btn btn-primary" id="add-vax-btn">+ Add a vaccination</button>
      </div>

      <div class="vax-stats">
        <div class="vax-stat ok">
          <span class="vax-dot"></span>
          <strong>${counts.ok}</strong>
          <span>Up to date</span>
        </div>
        <div class="vax-stat soon">
          <span class="vax-dot"></span>
          <strong>${counts.soon}</strong>
          <span>Due soon</span>
        </div>
        <div class="vax-stat overdue">
          <span class="vax-dot"></span>
          <strong>${counts.overdue}</strong>
          <span>Overdue</span>
        </div>
      </div>

      <div class="filter-row">
        <button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        ${pets.map(p => `
          <button class="filter-chip ${filter === p.id ? 'active' : ''}" data-filter="${p.id}">
            ${p.emoji} ${p.name}
          </button>
        `).join('')}
      </div>

      ${vaccins.length ? `
        <div class="vax-list">
          ${vaccins.map(v => vaxCard(v)).join('')}
        </div>
      ` : emptyState('💉', 'No vaccinations yet', 'Add your pets\' vaccines to keep track of their reminders.', 'Add a vaccination', 'id="add-vax-empty"')}
    `;

    el.querySelector('#add-vax-btn').onclick = () => addVaccination(filter === 'all' ? null : filter);
    el.querySelector('#add-vax-empty')?.addEventListener('click', () => addVaccination(filter === 'all' ? null : filter));

    el.querySelectorAll('.filter-chip').forEach(btn => {
      btn.onclick = () => {
        el.dataset.filter = btn.dataset.filter;
        render.health();
      };
    });

    el.querySelectorAll('[data-action="delete-vax"]').forEach(b => {
      b.onclick = () => deleteVaccination(b.dataset.id);
    });
  },

  appointments() {
    const el = document.getElementById('view-appointments');
    const pets = state.pets;

    if (!pets.length) {
      el.innerHTML = `
        <div class="page-head">
          <h1>Appointments</h1>
          <p>Your vet visits.</p>
        </div>
        ${emptyState('🐾', 'No pets yet', 'Add a pet to schedule appointments.', 'Add a pet', 'id="go-add-pet"')}
      `;
      el.querySelector('#go-add-pet').onclick = addPet;
      return;
    }

    const filter = el.dataset.filter || 'all';
    const appts = state.appointments
      .filter(a => filter === 'all' || a.petId === filter)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    el.innerHTML = `
      <div class="page-head page-head-row">
        <div>
          <h1>Appointments</h1>
          <p>Your vet visits.</p>
        </div>
        <button class="btn btn-primary" id="add-appt-btn">+ Add an appointment</button>
      </div>

      <div class="filter-row">
        <button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        ${pets.map(p => `
          <button class="filter-chip ${filter === p.id ? 'active' : ''}" data-filter="${p.id}">
            ${p.emoji} ${p.name}
          </button>
        `).join('')}
      </div>

      ${appts.length ? `
        <div class="appt-list">
          ${appts.map(a => apptCard(a)).join('')}
        </div>
      ` : emptyState('🩺', 'No appointments', 'Your calendar is clear. Enjoy some extra cuddles 🐾', 'Add an appointment', 'id="add-appt-empty"')}
    `;

    el.querySelector('#add-appt-btn').onclick = () => addAppointment(filter === 'all' ? null : filter);
    el.querySelector('#add-appt-empty')?.addEventListener('click', () => addAppointment(filter === 'all' ? null : filter));

    el.querySelectorAll('.filter-chip').forEach(btn => {
      btn.onclick = () => {
        el.dataset.filter = btn.dataset.filter;
        render.appointments();
      };
    });

    el.querySelectorAll('[data-action="edit-appt"]').forEach(b => {
      b.onclick = () => editAppointment(b.dataset.id);
    });
    el.querySelectorAll('[data-action="delete-appt"]').forEach(b => {
      b.onclick = () => deleteAppointment(b.dataset.id);
    });
  },

  weight() {
    const el = document.getElementById('view-weight');
    const pets = state.pets;

    if (!pets.length) {
      el.innerHTML = `
        <div class="page-head">
          <h1>Weight</h1>
          <p>Track your pets' evolution.</p>
        </div>
        ${emptyState('🐾', 'No pets yet', 'Add a pet to track their weight.', 'Add a pet', 'id="go-add-pet"')}
      `;
      el.querySelector('#go-add-pet').onclick = addPet;
      return;
    }

    const filter = el.dataset.filter || pets[0].id;
    el.dataset.filter = filter;

    const pet = getPet(filter) || pets[0];
    const weights = state.weights
      .filter(w => w.petId === pet.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const start = weights[0]?.value ?? 0;
    const current = weights[weights.length - 1]?.value ?? pet.weight ?? 0;
    const diff = +(current - start).toFixed(1);
    const lastDate = weights[weights.length - 1]?.date;

    el.innerHTML = `
      <div class="page-head page-head-row">
        <div>
          <h1>Weight</h1>
          <p>Track your pets' evolution.</p>
        </div>
        <button class="btn btn-primary" id="add-weight-btn">+ Add a weigh-in</button>
      </div>

      <div class="filter-row">
        ${pets.map(p => `
          <button class="filter-chip ${filter === p.id ? 'active' : ''}" data-filter="${p.id}">
            ${p.emoji} ${p.name}
          </button>
        `).join('')}
      </div>

      ${weights.length ? `
        <div class="weight-stats">
          <div class="stat-card">
            <span class="stat-ico">⚖️</span>
            <strong>${current} kg</strong>
            <span>Current weight</span>
          </div>
          <div class="stat-card">
            <span class="stat-ico">📊</span>
            <strong>${start} kg</strong>
            <span>Starting weight</span>
          </div>
          <div class="stat-card">
            <span class="stat-ico">${diff > 0 ? '📈' : diff < 0 ? '📉' : '➖'}</span>
            <strong class="${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${diff > 0 ? '+' : ''}${diff} kg</strong>
            <span>Difference</span>
          </div>
          <div class="stat-card">
            <span class="stat-ico">🗓️</span>
            <strong>${formatDate(lastDate)}</strong>
            <span>Last measurement</span>
          </div>
        </div>

        <div class="chart-card">
          <h3>Weight evolution</h3>
          <canvas id="weight-chart" height="260"></canvas>
        </div>

        <div class="weight-list">
          <h3 class="section-title">History</h3>
          ${weights.slice().reverse().map(w => `
            <div class="weight-item">
              <span class="weight-date">${formatDate(w.date)}</span>
              <strong>${w.value} kg</strong>
              <button class="icon-btn-small danger" data-action="delete-weight" data-id="${w.id}" aria-label="Delete">🗑️</button>
            </div>
          `).join('')}
        </div>
      ` : emptyState('⚖️', 'No weigh-ins yet', 'Add the first measurement for ' + pet.name + '.', 'Add a weigh-in', 'id="add-weight-empty"')}
    `;

    const openAdd = () => addWeight(filter);
    el.querySelector('#add-weight-btn')?.addEventListener('click', openAdd);
    el.querySelector('#add-weight-empty')?.addEventListener('click', openAdd);

    el.querySelectorAll('.filter-chip').forEach(btn => {
      btn.onclick = () => {
        el.dataset.filter = btn.dataset.filter;
        render.weight();
      };
    });

    el.querySelectorAll('[data-action="delete-weight"]').forEach(b => {
      b.onclick = () => deleteWeight(b.dataset.id);
    });

    const canvas = el.querySelector('#weight-chart');
    if (canvas && weights.length >= 2) {
      drawWeightChart(canvas, weights);
    }
  },

  reminders() {
    const el = document.getElementById('view-reminders');
    const pets = state.pets;

    if (!pets.length) {
      el.innerHTML = `
        <div class="page-head">
          <h1>Reminders</h1>
          <p>Never miss what matters.</p>
        </div>
        ${emptyState('🐾', 'No pets yet', 'Add a pet to create reminders.', 'Add a pet', 'id="go-add-pet"')}
      `;
      el.querySelector('#go-add-pet').onclick = addPet;
      return;
    }

    const filter = el.dataset.filter || 'all';
    const rems = state.reminders
      .filter(r => filter === 'all' || r.petId === filter)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return new Date(a.date) - new Date(b.date);
      });

    const pending = state.reminders.filter(r => !r.done).length;
    const doneCount = state.reminders.filter(r => r.done).length;

    el.innerHTML = `
      <div class="page-head page-head-row">
        <div>
          <h1>Reminders</h1>
          <p>${pending} pending · ${doneCount} done</p>
        </div>
        <button class="btn btn-primary" id="add-rem-btn">+ Add a reminder</button>
      </div>

      <div class="filter-row">
        <button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        ${pets.map(p => `
          <button class="filter-chip ${filter === p.id ? 'active' : ''}" data-filter="${p.id}">
            ${p.emoji} ${p.name}
          </button>
        `).join('')}
      </div>

      ${rems.length ? `
        <div class="rem-list">
          ${rems.map(r => remCard(r)).join('')}
        </div>
      ` : emptyState('🔔', 'No reminders', 'Create your first reminder so you don\'t forget anything.', 'Add a reminder', 'id="add-rem-empty"')}
    `;

    el.querySelector('#add-rem-btn').onclick = () => addReminder(filter === 'all' ? null : filter);
    el.querySelector('#add-rem-empty')?.addEventListener('click', () => addReminder(filter === 'all' ? null : filter));

    el.querySelectorAll('.filter-chip').forEach(btn => {
      btn.onclick = () => {
        el.dataset.filter = btn.dataset.filter;
        render.reminders();
      };
    });

    el.querySelectorAll('[data-action="toggle-rem"]').forEach(b => {
      b.onclick = () => toggleReminder(b.dataset.id);
    });
    el.querySelectorAll('[data-action="delete-rem"]').forEach(b => {
      b.onclick = () => deleteReminder(b.dataset.id);
    });
  },
};

// ---------- Start ----------
navigate('dashboard');