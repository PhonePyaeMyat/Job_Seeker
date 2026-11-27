import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB, same as the Storage rules

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

/** Returns an error message when the file is not an acceptable resume/CV, else null. */
export function validateResumeFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Please upload a PDF or Word document';
  }
  if (file.size > MAX_RESUME_SIZE) {
    return 'File size must be less than 5MB';
  }
  return null;
}

function sanitiseName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100) || 'file';
}

async function uploadFile(path: string, file: File): Promise<UploadedFile> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(snapshot.ref);
  return {
    name: file.name,
    url,
    path,
    size: file.size,
    contentType: file.type,
    uploadedAt: new Date().toISOString(),
  };
}

/** Upload a jobseeker's resume (collected at sign-up or from their profile). */
export async function uploadResume(uid: string, file: File): Promise<UploadedFile> {
  const error = validateResumeFile(file);
  if (error) throw new Error(error);
  return uploadFile(`resumes/${uid}/${Date.now()}_${sanitiseName(file.name)}`, file);
}

/** Upload the CV attached to a specific job application. */
export async function uploadCV(uid: string, file: File): Promise<UploadedFile> {
  const error = validateResumeFile(file);
  if (error) throw new Error(error);
  return uploadFile(`cvs/${uid}/${Date.now()}_${sanitiseName(file.name)}`, file);
}

/** Delete a previously uploaded file (used when a user removes their resume). */
export async function deleteStoredFile(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
