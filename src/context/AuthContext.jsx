/* eslint-disable react-refresh/only-export-components */
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
import { error as logError } from "../utils/logger";

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
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Force role override for demo emails to ensure correct redirection/access
            if (user.email) {
              const emailLower = user.email.toLowerCase();
              if (emailLower === "webadmin@school.com") {
                data.role = "webadmin";
              } else if (emailLower === "admin@school.com") {
                data.role = "admin";
              } else if (emailLower === "teacher@school.com") {
                data.role = "teacher";
              }
            }
            setUserData(data);
          } else {
            // Seed demo roles on-demand for live Firebase
            let role = "parent";
            let name = user.displayName || "Parent User";

            if (user.email.toLowerCase() === "admin@school.com") {
              role = "admin";
              name = "Principal Sarah Jenkins";
            } else if (user.email.toLowerCase() === "webadmin@school.com") {
              role = "webadmin";
              name = "Web Content Manager";
            } else if (user.email.toLowerCase() === "teacher@school.com") {
              role = "teacher";
              name = "Mr. Robert Harrison";
            }

            const newProfile = { uid: user.uid, email: user.email, name, role };
            await setDoc(docRef, newProfile);
            setUserData(newProfile);
          }
        } catch (error) {
          logError("Error fetching user data from Firestore:", error);
          // FALLBACK: Read from local storage mock database
          const mockDb = localStorage.getItem("school_erp_mock_db");
          if (mockDb) {
            const parsed = JSON.parse(mockDb);
            const matchedUser = Object.values(parsed.users).find(
              (u) =>
                u.email.toLowerCase() === user.email.toLowerCase() ||
                u.uid === user.uid,
            );
            if (matchedUser) {
              setUserData(matchedUser);
              setLoading(false);
              return;
            }
          }

          // Fallback based on email domain/patterns
          let role = "parent";
          let name = user.displayName || "Parent User";
          if (user.email) {
            const emailLower = user.email.toLowerCase();
            if (emailLower === "admin@school.com") {
              role = "admin";
              name = "Principal Sarah Jenkins";
            } else if (emailLower === "webadmin@school.com") {
              role = "webadmin";
              name = "Web Content Manager";
            } else if (emailLower === "teacher@school.com") {
              role = "teacher";
              name = "Mr. Robert Harrison";
            }
          }
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
