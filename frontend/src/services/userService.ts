import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type UserRole = 'jobseeker' | 'employer' | 'admin';

/**
 * Read the user's role from their Firestore user document — the single
 * source of truth. Never trust a role stored in localStorage: it is
 * client-controlled and anyone can edit it in the browser console.
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  const snap = await getDoc(doc(db, 'users', uid));
  const role = snap.data()?.role;
  return role === 'employer' || role === 'admin' ? role : 'jobseeker';
}
