// components/expenses/ExpenseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import Swal from "sweetalert2";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: any; 
}

export default function ExpenseModal({ isOpen, onClose, expenseToEdit }: ExpenseModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      reset(expenseToEdit); 
    } else {
      reset({ concept: "", amount: "", category: "Transporte y Gasolina" });
    }
  }, [expenseToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const expenseData = {
        concept: data.concept,
        amount: parseFloat(data.amount) || 0,       
        category: data.category,
        // Si estamos editando, no sobreescribimos la fecha de creación original
        ...(expenseToEdit ? {} : { date: serverTimestamp() }) 
      };

      if (expenseToEdit) {
        await updateDoc(doc(db, "expenses", expenseToEdit.id), expenseData);
        Swal.fire({ title: '¡Actualizado!', text: 'Gasto modificado.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      } else {
        await addDoc(collection(db, "expenses"), expenseData);
        Swal.fire({ title: '¡Registrado!', text: 'Gasto guardado.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
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
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 shrink-0 bg-slate-800/50">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {expenseToEdit ? "Editar Gasto" : "Registrar Salida de Dinero"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Concepto / Descripción *</label>
            <input type="text" {...register("concept", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Ej. Gasolina Camioneta 1" />
            {errors.concept && <p className="text-red-400 text-xs mt-1">{errors.concept.message as string}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Monto ($) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input type="number" step="0.01" {...register("amount", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:ring-2 focus:ring-rose-500 outline-none font-bold" placeholder="0.00" />
              </div>
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message as string}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
              <select {...register("category")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-rose-500 outline-none">
                <option value="Transporte y Gasolina">Transporte y Gasolina</option>
                <option value="Viáticos y Comidas">Viáticos y Comidas</option>
                <option value="Materiales y Consumibles">Materiales y Consumibles</option>
                <option value="Pago a Proveedores">Pago a Proveedores</option>
                <option value="Mantenimiento">Mantenimiento de Equipo</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base">Cancelar</button>
          <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 text-sm sm:text-base">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {expenseToEdit ? "Guardar Cambios" : "Registrar Gasto"}
          </button>
        </div>
      </form>
    </div>
  );
}