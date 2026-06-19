import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
} from "../firebase";


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // 1. Role may already be on the user object (from mock auth or cached session)
        if (user.role) {
          setUserData({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.name || user.email,
            role: user.role,
            studentId: user.studentId,
            class: user.class,
            section: user.section,
          });
          setLoading(false);
          return;
        }

        // 2. Try to get profile from backend (when real backend is running)
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Email-based role override for demo accounts
            if (user.email) {
              const em = user.email.toLowerCase();
              if (em === "webadmin@school.com") data.role = "webadmin";
              else if (em === "admin@school.com") data.role = "admin";
              else if (em === "teacher@school.com") data.role = "teacher";
              else if (em === "parent@school.com") data.role = "parent";
            }
            setUserData(data);
          } else {
            // Infer role from email
            const em = user.email?.toLowerCase() || "";
            let role = "parent";
            let name = user.displayName || "User";
            if (em === "admin@school.com") { role = "admin"; name = "Admin User"; }
            else if (em === "webadmin@school.com") { role = "webadmin"; name = "Web Admin"; }
            else if (em === "teacher@school.com") { role = "teacher"; name = "Teacher User"; }
            const profile = { uid: user.uid, email: user.email, name, role };
            try { await setDoc(docRef, profile); } catch { /* ignore */ }
            setUserData(profile);
          }
        } catch {
          // Backend down — fallback to email-based role
          const em = user.email?.toLowerCase() || "";
          let role = "parent";
          let name = user.displayName || user.email || "User";
          if (em === "admin@school.com") { role = "admin"; name = "Admin User"; }
          else if (em === "webadmin@school.com") { role = "webadmin"; name = "Web Admin"; }
          else if (em === "teacher@school.com") { role = "teacher"; name = "Teacher User"; }
          setUserData({ uid: user.uid, email: user.email, role, name });
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      // Auto-register demo credentials if they do not exist in Firebase Auth yet
      const isDemo = [
        "admin@school.com",
        "webadmin@school.com",
        "teacher@school.com",
        "parent@school.com",
      ].includes(email.toLowerCase());
      // Auto-registration only when explicitly enabled via env var
      const enableAutoRegister =
        import.meta.env.VITE_ENABLE_AUTO_REGISTER === "true";
      if (!auth.isMock && isDemo && enableAutoRegister) {
        try {
          const { createUserWithEmailAndPassword } =
            await import("firebase/auth");
          const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          return result;
        } catch (regError) {
          logError("Auto registration error:", regError);
        }
      }
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      logError("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    isAuthenticated: !!currentUser,
    userRole: userData?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
