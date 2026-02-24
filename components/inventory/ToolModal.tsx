// components/inventory/ToolModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolToEdit?: any;
}

export default function ToolModal({
  isOpen,
  onClose,
  toolToEdit,
}: ToolModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (toolToEdit) {
      reset(toolToEdit);
    } else {
      reset({
        name: "",
        category: "",
        cost: "",
        quantity: 1,
        condition: "Buena",
      });
    }
  }, [toolToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const toolData = {
        name: data.name,
        category: data.category,
        cost: parseFloat(data.cost) || 0,
        quantity: parseInt(data.quantity),
        condition: data.condition,
        ...(toolToEdit ? {} : { createdAt: new Date() }),
      };

      if (toolToEdit) {
        // Actualizamos en la colección "tools"
        await updateDoc(doc(db, "tools", toolToEdit.id), toolData);
        Swal.fire({
          title: "¡Actualizado!",
          text: "Herramienta modificada.",
          icon: "success",
          background: "#1f2937",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Creamos en la colección "tools"
        await addDoc(collection(db, "tools"), toolData);
        Swal.fire({
          title: "¡Registrado!",
          text: "Herramienta guardada.",
          icon: "success",
          background: "#1f2937",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema de conexión.",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {toolToEdit
              ? "Editar Herramienta"
              : "Registrar Herramienta / Activo"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">
              Nombre de la Herramienta *
            </label>
            <input
              type="text"
              {...register("name", { required: "Obligatorio" })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
              placeholder="Ej. Taladro Percutor Dewalt"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Categoría
              </label>
              <select
                {...register("category")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
              >
                <option value="Herramienta Eléctrica">
                  Herramienta Eléctrica
                </option>
                <option value="Herramienta Manual">Herramienta Manual</option>
                <option value="Equipo de Medición">
                  Equipo de Medición (Testers)
                </option>
                <option value="Seguridad y Escaleras">
                  Seguridad y Escaleras
                </option>
                <option value="Consumible">
                  Consumibles Internos (Cintas, Pijas)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Estado Físico
              </label>
              <select
                {...register("condition")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
              >
                <option value="Excelente">Excelente / Nuevo</option>
                <option value="Buena">Buena</option>
                <option value="Regular">Regular (Requiere atención)</option>
                <option value="Mala">Mala / Para reparar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-slate-800 pt-4 sm:pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Costo Aproximado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register("cost")}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Cantidad
              </label>
              <input
                type="number"
                {...register("quantity")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm sm:text-base"
          >
            {isLoading
              ? "Guardando..."
              : toolToEdit
                ? "Guardar Cambios"
                : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
