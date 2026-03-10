// components/users/UserModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { doc, updateDoc, setDoc } from "firebase/firestore"; // Cambiamos addDoc por setDoc
import { db } from "@/lib/firebase"; 
import Swal from "sweetalert2";

import { getApp, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: any; 
}

export default function UserModal({ isOpen, onClose, userToEdit }: UserModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      reset(userToEdit); 
    } else {
      // Valores por defecto con los NUEVOS ROLES EN MINÚSCULAS
      reset({ name: "", email: "", password: "", role: "practicante", status: "Activo" });
    }
  }, [userToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const userData = {
        name: data.name,
        email: data.email,
        role: data.role, // Guardará "admin" o "practicante"
        status: data.status,
        ...(userToEdit ? {} : { createdAt: new Date() }) 
      };

      if (userToEdit) {
        // MODO EDITAR
        await updateDoc(doc(db, "users", userToEdit.id), userData);
        Swal.fire({ title: '¡Actualizado!', text: 'Permisos modificados.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      } else {
        // MODO CREAR
        const secondaryApp = initializeApp(getApp().options, `SecondaryApp_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        
        // 1. Creamos la cuenta real en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
        await signOut(secondaryAuth); 

        // 2. EXTRAEMOS EL UID CREADO
        const newUserId = userCredential.user.uid;

        // 3. GUARDAMOS EN FIRESTORE CON ESE MISMO UID EXACTO (Usando setDoc en lugar de addDoc)
        await setDoc(doc(db, "users", newUserId), userData);
        
        Swal.fire({ title: '¡Usuario Creado!', text: 'El usuario ya puede iniciar sesión.', icon: 'success', background: '#1f2937', color: '#fff', timer: 2000, showConfirmButton: false });
      }

      onClose(); 
    } catch (error: any) {
      console.error("Error al guardar:", error);
      let mensajeError = "Hubo un problema al crear el usuario.";
      if (error.code === 'auth/email-already-in-use') mensajeError = "Ese correo ya está registrado en el sistema.";
      if (error.code === 'auth/weak-password') mensajeError = "La contraseña debe tener al menos 6 caracteres.";
      
      Swal.fire({ title: 'Error', text: mensajeError, icon: 'error', background: '#1f2937', color: '#fff' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {userToEdit ? "Editar Permisos de Usuario" : "Registrar Nuevo Usuario"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Nombre del Usuario *</label>
            <input type="text" {...register("name", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Ej. Carlos Mendoza" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Correo (Acceso) *</label>
              <input type="email" disabled={!!userToEdit} {...register("email", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base disabled:opacity-50" placeholder="carlos@erp.com" />
            </div>
            
            {!userToEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Contraseña Temporal *</label>
                <input type="text" {...register("password", { required: "Obligatorio", minLength: { value: 6, message: "Mínimo 6 caracteres" } })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Min. 6 caracteres" />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message as string}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-slate-800 pt-4 sm:pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Rol en el Sistema</label>
              {/* MAGIA AQUÍ: VALUES EN MINÚSCULA */}
              <select {...register("role")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base">
                <option value="admin">Administrador (Acceso Total)</option>
                <option value="practicante">Practicante (Inventario / Ventas)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Estado de la Cuenta</label>
              <select {...register("status")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base">
                <option value="Activo">Activo (Puede entrar)</option>
                <option value="Suspendido">Suspendido (Sin acceso)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base">Cancelar</button>
          <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm sm:text-base">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (userToEdit ? "Guardar Cambios" : "Crear Usuario")}
          </button>
        </div>
      </form>
    </div>
  );
}