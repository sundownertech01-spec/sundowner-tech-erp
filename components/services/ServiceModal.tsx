// components/services/ServiceModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2, AlertCircle } from "lucide-react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import Swal from "sweetalert2";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: any; 
}

export default function ServiceModal({ isOpen, onClose, serviceToEdit }: ServiceModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  // Observamos si la casilla está marcada para mostrar/ocultar el costo extra
  const allowsExternal = watch("allowsExternalMaterial");

  useEffect(() => {
    if (serviceToEdit) {
      reset(serviceToEdit); 
    } else {
      reset({ 
        name: "", 
        price: "", 
        cutType: "No aplica", 
        allowsExternalMaterial: false,
        externalMaterialSurcharge: 0
      });
    }
  }, [serviceToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const serviceData = {
        name: data.name,
        price: parseFloat(data.price),
        cutType: data.cutType,
        allowsExternalMaterial: data.allowsExternalMaterial,
        // Si no permite material externo, forzamos el costo extra a 0 por seguridad de datos
        externalMaterialSurcharge: data.allowsExternalMaterial ? parseFloat(data.externalMaterialSurcharge || 0) : 0,
        ...(serviceToEdit ? {} : { createdAt: new Date() }) 
      };

      if (serviceToEdit) {
        await updateDoc(doc(db, "services", serviceToEdit.id), serviceData);
        Swal.fire({ title: '¡Actualizado!', text: 'El servicio se modificó.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      } else {
        await addDoc(collection(db, "services"), serviceData);
        Swal.fire({ title: '¡Registrado!', text: 'Servicio creado exitosamente.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }

      onClose(); 
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({ title: 'Error', text: 'Hubo un problema al guardar.', icon: 'error', background: '#1f2937', color: '#fff' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {serviceToEdit ? "Editar Servicio" : "Nuevo Servicio"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Nombre del Servicio *</label>
            <input type="text" {...register("name", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Ej. Instalación de Calentador Solar 15 Tubos" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Precio Base ($) *</label>
              <input type="number" step="0.01" {...register("price", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base font-bold text-emerald-400" placeholder="0.00" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Tipo de Trabajo</label>
              <select {...register("cutType")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base">
                <option value="No aplica">No aplica</option>
                <option value="Con corte">Con corte (Requiere modificar estructura)</option>
                <option value="Sin corte">Sin corte (Instalación limpia)</option>
              </select>
            </div>
          </div>

          <div className="border border-slate-700 bg-slate-800/50 rounded-xl p-4 sm:p-5 mt-2">
            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input type="checkbox" {...register("allowsExternalMaterial")} className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900" />
              <span className="text-white font-medium text-sm sm:text-base">El cliente puede traer su propio equipo/material</span>
            </label>
            
            {allowsExternal && (
              <div className="mt-4 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2 flex items-center gap-2">
                  Costo Extra o Penalización ($) <AlertCircle size={14} className="text-orange-400" />
                </label>
                <input type="number" step="0.01" {...register("externalMaterialSurcharge")} className="w-full sm:w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-orange-400 focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base font-bold" placeholder="0.00" />
                <p className="text-xs text-slate-500 mt-2">Este monto se sumará al precio base si el cliente no compra el equipo en la empresa.</p>
              </div>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm sm:text-base">Cancelar</button>
          <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 text-sm sm:text-base">
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            {isLoading ? "Guardando..." : (serviceToEdit ? "Guardar Cambios" : "Guardar Servicio")}
          </button>
        </div>
      </form>
    </div>
  );
}