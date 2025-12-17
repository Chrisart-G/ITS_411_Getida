// src/context/AuthContext.tsx
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { firebaseAuth, FirebaseUser } from '../firebase';

type AuthContextType = {
  user: FirebaseUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
  };

  const signup = async (email: string, password: string) => {
    await firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
  };

  const logout = async () => {
    await firebaseAuth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
