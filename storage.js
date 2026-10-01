/* =========================================================
   PetCare — Storage & default data
   ========================================================= */

const STORAGE_KEY = 'petcare_data_v1';

// ---------- Default data (used on first launch) ----------
const DEFAULT_DATA = {
  pets: [
    {
      id: 'p1',
      name: 'Piston',
      species: 'Cat',
      breed: 'European Shorthair',
      gender: 'Male',
      birthday: '2022-05-14',
      weight: 4.8,
      color: 'Gray tabby',
      microchip: '250269812345678',
      owner: 'Yasmine',
      vet: 'Dr. Martin',
      emoji: '🐱',
      notes: 'Very playful, a bit shy with strangers.'
    },
    {
      id: 'p2',
      name: 'Luna',
      species: 'Dog',
      breed: 'Golden Retriever',
      gender: 'Female',
      birthday: '2023-02-08',
      weight: 27.5,
      color: 'Golden',
      microchip: '250269876543210',
      owner: 'Yasmine',
      vet: 'Dr. Bernard',
      emoji: '🐶',
      notes: 'Loves water and long walks.'
    }
  ],

  vaccinations: [
    { id: 'v1', petId: 'p1', name: 'Rabies',        date: '2024-03-12', nextDue: '2025-03-12', vet: 'Dr. Martin' },
    { id: 'v2', petId: 'p1', name: 'Feline typhus', date: '2024-06-01', nextDue: '2025-06-01', vet: 'Dr. Martin' },
    { id: 'v3', petId: 'p2', name: 'Rabies',        date: '2024-09-10', nextDue: '2025-09-10', vet: 'Dr. Bernard' }
  ],

  appointments: [
    { id: 'a1', petId: 'p1', date: '2025-10-21', time: '10:30', vet: 'Dr. Martin',  clinic: 'Park Clinic', reason: 'Annual check-up', status: 'upcoming' },
    { id: 'a2', petId: 'p2', date: '2025-11-05', time: '14:00', vet: 'Dr. Bernard', clinic: 'VetPlus',     reason: 'Booster vaccine', status: 'upcoming' }
  ],

  medications: [
    { id: 'm1', petId: 'p1', name: 'Amoxicillin', dosage: '250 mg', frequency: '2 times/day', start: '2025-09-20', end: '2025-09-30', status: 'active' }
  ],

  weights: [
    { id: 'w1', petId: 'p1', date: '2025-01-10', value: 4.5 },
    { id: 'w2', petId: 'p1', date: '2025-03-10', value: 4.6 },
    { id: 'w3', petId: 'p1', date: '2025-06-10', value: 4.8 },
    { id: 'w4', petId: 'p2', date: '2025-02-01', value: 26.0 },
    { id: 'w5', petId: 'p2', date: '2025-05-01', value: 27.0 },
    { id: 'w6', petId: 'p2', date: '2025-08-01', value: 27.5 }
  ],

  reminders: [
    { id: 'r1', petId: 'p1', type: '💉', text: 'Rabies vaccine renewal', date: '2025-10-14', done: false, priority: 'high' },
    { id: 'r2', petId: 'p2', type: '🩺', text: 'Vet appointment',        date: '2025-11-05', done: false, priority: 'normal' },
    { id: 'r3', petId: 'p1', type: '💊', text: 'End of treatment',       date: '2025-09-30', done: false, priority: 'urgent' }
  ]
};

// ---------- Persistence ----------

// Load data (or defaults on first launch)
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    // Safety: make sure all keys exist
    return { ...structuredClone(DEFAULT_DATA), ...parsed };
  } catch (e) {
    console.warn('Corrupted data — resetting.', e);
    return structuredClone(DEFAULT_DATA);
  }
}

// Save
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Save error', e);
  }
}

// Reset (useful for testing)
function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(DEFAULT_DATA);
  saveData();
  navigate('dashboard');
}

// ---------- Global state ----------
let state = loadData();

// ---------- Helpers ----------
const uid = (prefix = 'id') =>
  prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const getPet = (id) => state.pets.find(p => p.id === id);

function petEmoji(species) {
  const map = {
    'Cat':     '🐱',
    'Dog':     '🐶',
    'Rabbit':  '🐰',
    'Bird':    '🐦',
    'Fish':    '🐠',
    'Hamster': '🐹',
    'Turtle':  '🐢',
    'Horse':   '🐴',
    'Ferret':  '🦡',
    'Reptile': '🦎',
    'Other':   '🐾'
  };
  return map[species] || '🐾';
}