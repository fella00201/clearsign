// Tracks which sealed contracts a user has already seen the celebration
// screen for, so the "your contract was just completed" animation can be
// shown once on next login when the OTHER party was the one who finished
// signing while this user was away — without repeating for contracts
// already celebrated live via Signing.jsx -> Sealed.jsx.

const key = email => `cs_seen_sealed_${email}`

export function hasSeenSealedList(email) {
  return localStorage.getItem(key(email)) !== null
}

export function getSeenSealedIds(email) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key(email)) || '[]'))
  } catch {
    return new Set()
  }
}

export function markSealedSeen(email, ids) {
  try {
    const existing = getSeenSealedIds(email)
    ids.forEach(id => existing.add(id))
    localStorage.setItem(key(email), JSON.stringify([...existing]))
  } catch { /* quota exceeded */ }
}
