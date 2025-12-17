// src/functions/auth.ts
import { firebaseAuth, FirebaseUser } from '../firebase';

export type AuthResult = {
  user: FirebaseUser;
};

export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const trimmed = email.trim();
  const cred = await firebaseAuth.createUserWithEmailAndPassword(
    trimmed,
    password
  );
  return { user: cred.user };
}

export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const trimmed = email.trim();
  const cred = await firebaseAuth.signInWithEmailAndPassword(
    trimmed,
    password
  );
  return { user: cred.user };
}

export async function logout(): Promise<void> {
  await firebaseAuth.signOut();
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  const unsub = firebaseAuth.onAuthStateChanged(callback);
  return unsub;
}
