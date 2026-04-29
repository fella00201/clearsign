import { create } from 'zustand'
import { fetchUnreadMessageCount } from '../lib/supabase'

export const useMessages = create((set) => ({
  unreadCount: 0,

  loadUnreadCount: async (userEmail) => {
    if (!userEmail) return
    try {
      const count = await fetchUnreadMessageCount(userEmail)
      set({ unreadCount: count })
    } catch {
      set({ unreadCount: 0 })
    }
  },

  decrementUnread: (amount = 1) => {
    set(s => ({ unreadCount: Math.max(0, s.unreadCount - amount) }))
  },

  clearUnread: () => set({ unreadCount: 0 }),
}))
