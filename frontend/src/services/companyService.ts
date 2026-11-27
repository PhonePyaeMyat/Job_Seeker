import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface CompanyRecord {
  id: string;
  ownerId: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  verified: boolean;
}

export async function getCompany(companyId: string): Promise<CompanyRecord | null> {
  const snap = await getDoc(doc(db, 'companies', companyId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ownerId: data.ownerId || '',
    name: data.name || '',
    website: data.website,
    industry: data.industry,
    size: data.size,
    verified: data.verified === true,
  };
}

/**
 * Create the company record for an employer at sign-up. `verified` always
 * starts false — only an admin can set it true (see setCompanyVerified).
 * Uses setDoc with merge so a repeated sign-up cannot wipe an existing
 * record.
 */
export async function createCompanyForEmployer(
  uid: string,
  fields: { name: string; website?: string; industry?: string; size?: string },
): Promise<void> {
  const now = new Date().toISOString();
  await setDoc(
    doc(db, 'companies', uid),
    {
      ownerId: uid,
      ...fields,
      verified: false,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
}

/**
 * Set a company's verified flag. Admin only in practice: the Firestore
 * rules reject a non-admin changing `verified`, and the admin panel is the
 * only caller. Creates the company document on first verify, so employers
 * who signed up before company records existed can still be verified.
 */
export async function setCompanyVerified(
  companyId: string,
  ownerId: string,
  name: string,
  verified: boolean,
): Promise<void> {
  await setDoc(
    doc(db, 'companies', companyId),
    { ownerId, name, verified, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}
