// components/clients/ClientModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import Swal from "sweetalert2";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: any; 
}

export default function ClientModal({ isOpen, onClose, clientToEdit }: ClientModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      reset(clientToEdit); 
    } else {
      reset({ name: "", email: "", phone: "", address: "", type: "Minorista" });
    }
  }, [clientToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const clientData = {
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        type: data.type,
        ...(clientToEdit ? {} : { createdAt: new Date() }) 
      };

      if (clientToEdit) {
        await updateDoc(doc(db, "clients", clientToEdit.id), clientData);
        Swal.fire({ title: '¡Actualizado!', text: 'Datos del cliente modificados.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      } else {
        await addDoc(collection(db, "clients"), clientData);
        Swal.fire({ title: '¡Registrado!', text: 'Nuevo cliente guardado.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }

      onClose(); 
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({ title: 'Error', text: 'Hubo un problema de conexión.', icon: 'error', background: '#1f2937', color: '#fff' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {clientToEdit ? "Editar Cliente" : "Registrar Nuevo Cliente"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Nombre Completo o Empresa *</label>
              <input type="text" {...register("name", { required: "El nombre es obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Ej. Juan Pérez / Empresa S.A." />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Tipo de Cliente</label>
              <select {...register("type")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base">
                <option value="Minorista">Público General (Minorista)</option>
                <option value="Instalador">Instalador / Técnico</option>
                <option value="Empresa">Empresa / Corporativo</option>
                <option value="Mayorista">Mayorista</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Teléfono / WhatsApp</label>
              <input type="text" {...register("phone")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Ej. 55 1234 5678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Correo Electrónico</label>
              <input type="email" {...register("email")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Dirección Completa</label>
            <textarea {...register("address")} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base resize-none" placeholder="Calle, Número, Colonia, Ciudad..." />
          </div>

        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base">Cancelar</button>
          <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm sm:text-base">
            {isLoading ? "Guardando..." : (clientToEdit ? "Guardar Cambios" : "Guardar")}
          </button>
        </div>
      </form>
    </div>
  );
}