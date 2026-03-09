// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  role: "admin" | "tecnico" | null;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoadingAuth: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "tecnico" | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Escuchamos cuando alguien inicia o cierra sesión
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Vamos a la tabla "users" a buscar qué rol tiene este correo/UID
        try {
          // Asumiendo que guardas a los usuarios usando su UID o Email como ID de documento
          // Si usas otro campo, lo ajustamos, pero por defecto buscamos su perfil
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists() && userDoc.data().role) {
            setRole(userDoc.data().role); // "admin" o "tecnico"
          } else {
            // Si no tiene rol asignado, lo hacemos técnico por seguridad (para que no vea el dinero)
            setRole("tecnico"); 
          }
        } catch (error) {
          console.error("Error leyendo el rol del usuario:", error);
          setRole("tecnico");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoadingAuth }}>
      {!isLoadingAuth && children}
    </AuthContext.Provider>
  );
}

// Un "Hook" personalizado para usar el gafete en cualquier pantalla
export const useAuth = () => useContext(AuthContext);