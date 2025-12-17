// src/firebase/index.ts
import '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Use the default app configured by google-services.json
export const firebaseAuth = auth();
export type FirebaseUser = FirebaseAuthTypes.User;
