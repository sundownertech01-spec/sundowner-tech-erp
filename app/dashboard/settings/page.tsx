// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Settings, User, Building, Save, Shield, Loader2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

export default function SettingsPage() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("company");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Cargar la configuración actual desde Firebase al entrar
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Usaremos un documento fijo llamado "general" dentro de la colección "settings"
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          reset(docSnap.data()); // Rellenar el formulario con los datos de Firebase
        } else {
          // Valores por defecto si no existe
          reset({
            companyName: "Sundowner Tech",
            companyPhone: "",
            companyEmail: "",
            companyAddress: "",
            companyRFC: "",
            userName: "Administrador",
            userRole: "Admin"
          });
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      // Guarda o actualiza el documento "general" en la colección "settings"
      await setDoc(doc(db, "settings", "general"), data, { merge: true });
      
      Swal.fire({
        title: '¡Guardado!',
        text: 'La configuración se actualizó correctamente.',
        icon: 'success',
        background: '#1f2937', color: '#fff', timer: 2000, showConfirmButton: false
      });
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      Swal.fire({ title: 'Error', text: 'No se pudo guardar la configuración.', icon: 'error', background: '#1f2937', color: '#fff' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p>Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Settings className="text-indigo-500" /> Configuración del Sistema
        </h2>
        <p className="text-sm text-slate-400 mt-1">Administra los datos de tu empresa y preferencias de tu cuenta.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* MENÚ LATERAL DE PESTAÑAS (TABS) */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === "company" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Building size={18} /> Datos de la Empresa
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === "profile" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <User size={18} /> Perfil de Usuario
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === "security" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Shield size={18} /> Seguridad
          </button>
        </div>

        {/* ÁREA DE FORMULARIO CENTRAL */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* CONTENIDO: DATOS DE LA EMPRESA */}
            {activeTab === "company" && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Información del Negocio</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de la Empresa *</label>
                    <input type="text" {...register("companyName", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sundowner Tech" />
                    {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">RFC / Identificación Fiscal</label>
                    <input type="text" {...register("companyRFC")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase" placeholder="XAXX010101000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono Principal</label>
                    <input type="text" {...register("companyPhone")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. 464 123 4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Correo de Contacto</label>
                    <input type="email" {...register("companyEmail")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="contacto@sundowner.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dirección del Localizador / Oficina</label>
                  <textarea {...register("companyAddress")} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Calle, Colonia, Código Postal..." />
                </div>
              </div>
            )}

            {/* CONTENIDO: PERFIL DE USUARIO */}
            {activeTab === "profile" && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Tus Datos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tu Nombre</label>
                    <input type="text" {...register("userName")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Jorge" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Rol en el Sistema</label>
                    <input type="text" {...register("userRole")} disabled className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-500 outline-none cursor-not-allowed" />
                    <p className="text-xs text-slate-500 mt-1">El rol solo puede ser cambiado por el Administrador Maestro.</p>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO: SEGURIDAD */}
            {activeTab === "security" && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Seguridad de la Cuenta</h3>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center space-y-3">
                  <Shield className="w-12 h-12 text-slate-500 mx-auto" />
                  <h4 className="text-white font-medium">Gestión de Contraseña</h4>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    La seguridad de tu cuenta está protegida por Google Firebase Authentication. Para cambiar tu contraseña o métodos de acceso, comunícate con el soporte de Sundowner Tech.
                  </p>
                </div>
              </div>
            )}

            {/* FOOTER CON BOTÓN DE GUARDAR */}
            <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}