// so first context provider and display data in your pages.
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type SimpleUser = { uid: string; email: string | null } | null;

type UserContextValue = {
  user: SimpleUser;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({ user: null, loading: true });

export const UserProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((u: FirebaseAuthTypes.User | null) => {
      setUser(u ? { uid: u.uid, email: u.email } : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
