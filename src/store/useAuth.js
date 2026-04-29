import { create } from 'zustand';

const COLORS = ['#5b8fff', '#3ecf7a', '#f5a623', '#ff7eb3', '#a78bfa', '#34d399', '#fb923c'];
const SESSION_KEY = 'cs_user';
const profileKey = (email) => `cs_profile_${email}`;

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuth = create((set, get) => ({
  user: loadSession(),
  loading: false,

  signup: async (name, email) => {
    const key = profileKey(email.toLowerCase());
    if (localStorage.getItem(key)) {
      throw new Error('An account with that email already exists — sign in instead.');
    }
    const user = {
      id: Math.random().toString(36).slice(2, 10),
      name,
      email: email.toLowerCase(),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      alerts: [],
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    set({ user });
    return user;
  },

  signin: async (email) => {
    const raw = localStorage.getItem(profileKey(email.toLowerCase()));
    if (!raw) throw new Error('No account found — create one instead.');
    const user = JSON.parse(raw);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    set({ user });
    return user;
  },

  signout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ user: null });
  },

  updateAlerts: (alerts) => {
    const user = { ...get().user, alerts }
    try {
      localStorage.setItem(profileKey(user.email), JSON.stringify(user))
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch {}
    set({ user })
  },
}));
