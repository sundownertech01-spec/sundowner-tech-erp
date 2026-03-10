// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // <-- Cambiamos a onSnapshot
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  role: "admin" | "practicante" | null;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoadingAuth: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "practicante" | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    // Escuchamos cuando alguien inicia o cierra sesión
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Escuchamos EL DOCUMENTO DEL USUARIO EN TIEMPO REAL
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().role) {
            setRole(docSnap.data().role); // "admin" o "practicante"
          } else {
            console.warn(
              "ATENCIÓN: No se encontró el rol. Verifica que en Firestore exista un documento en 'users' con este ID exacto:", 
              firebaseUser.uid
            );
            // Por seguridad, si hay error, lo hacemos practicante
            setRole("practicante"); 
          }
          setIsLoadingAuth(false);
        }, (error) => {
          console.error("Error leyendo el rol del usuario:", error);
          setRole("practicante");
          setIsLoadingAuth(false);
        });

      } else {
        setUser(null);
        setRole(null);
        setIsLoadingAuth(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoadingAuth }}>
      {!isLoadingAuth && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);