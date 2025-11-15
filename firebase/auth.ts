// firebase/auth.ts
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Alert } from "react-native";

export type FBUser = { uid: string; email: string | null };

/** Create account */
export const signUpUser = async (email: string, password: string): Promise<FBUser> => {
  try {
    const cred = await auth().createUserWithEmailAndPassword(email, password);
    Alert.alert("Success", "Account created successfully!");
    const u = cred.user;
    return { uid: u.uid, email: u.email };
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "Signup failed";
    Alert.alert("Error", msg);
    throw e;
  }
};

/** Login */
export const loginUser = async (email: string, password: string): Promise<FBUser> => {
  try {
    const cred = await auth().signInWithEmailAndPassword(email, password);
    Alert.alert("Success", "Logged in successfully!");
    const u = cred.user;
    return { uid: u.uid, email: u.email };
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "Login failed";
    Alert.alert("Error", msg);
    throw e;
  }
};

/** Logout */
export const logoutUser = async (): Promise<void> => {
  try {
    await auth().signOut();
    Alert.alert("Success", "Logged out successfully!");
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "Logout failed";
    Alert.alert("Error", msg);
    throw e;
  }
};

/** Optional helper: typed auth listener */
export const onAuthChanged = (
  cb: (user: FBUser | null) => void
): (() => void) => {
  const unsubscribe = auth().onAuthStateChanged((u: FirebaseAuthTypes.User | null) => {
    if (!u) return cb(null);
    cb({ uid: u.uid, email: u.email });
  });
  return unsubscribe;
};
