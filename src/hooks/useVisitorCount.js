import { useEffect, useState } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';

const COUNTER_DOC = doc(db, 'stats', 'visitors');
const SESSION_KEY = 'haz_visited';

export function useVisitorCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    // Increment once per browser session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      runTransaction(db, async (tx) => {
        const snap = await tx.get(COUNTER_DOC);
        const current = snap.exists() ? (snap.data().total ?? 0) : 0;
        tx.set(COUNTER_DOC, { total: current + 1 });
      }).catch(() => {/* silently fail – counter is non-critical */});
    }

    // Real-time listener
    const unsub = onSnapshot(COUNTER_DOC, (snap) => {
      if (snap.exists()) setCount(snap.data().total ?? 0);
    });

    return unsub;
  }, []);

  return count;
}
