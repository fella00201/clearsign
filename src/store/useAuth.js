import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const COLORS      = ['#5b8fff', '#3ecf7a', '#f5a623', '#ff7eb3', '#a78bfa', '#34d399', '#fb923c'];
const SESSION_KEY = 'cs_user';
const profileKey  = (email) => `cs_profile_${email}`;

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuth = create((set, get) => ({
  user:    loadSession(),
  loading: false,

  signup: async (name, email) => {
    const key = profileKey(email.toLowerCase());
    if (localStorage.getItem(key)) {
      throw new Error('An account with that email already exists — sign in instead.');
    }

    const user = {
      // Use a real UUID so it can serve as the Supabase PK and as FK in listings.
      id:          crypto.randomUUID(),
      name,
      email:       email.toLowerCase(),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      alerts:      [],
      createdAt:   new Date().toISOString(),
    };

    // Persist locally first — signup is never blocked by a network call.
    localStorage.setItem(key, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    set({ user });

    // Mirror profile to Supabase (fire-and-forget — don't block signup UX).
    supabase
      .from('users')
      .upsert(
        {
          id:           user.id,
          name:         user.name,
          email:        user.email,
          avatar_color: user.avatarColor,
          alerts:       user.alerts,
          created_at:   user.createdAt,
        },
        { onConflict: 'email' }
      )
      .then(({ error }) => {
        if (error) console.warn('[Supabase] user upsert failed:', error.message);
      });

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
    const user = { ...get().user, alerts };

    // Local-first — instant UX.
    try {
      localStorage.setItem(profileKey(user.email), JSON.stringify(user));
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {}
    set({ user });

    // Mirror to Supabase (fire-and-forget).
    supabase
      .from('users')
      .update({ alerts })
      .eq('email', user.email)
      .then(({ error }) => {
        if (error) console.warn('[Supabase] alerts update failed:', error.message);
      });
  },
}));
