"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  FileText,
  Calendar,
  User,
  DollarSign,
  AlignLeft,
  Loader2,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface NewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewQuoteModal({ isOpen, onClose }: NewQuoteModalProps) {
  // Estados del formulario
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  // Fecha por defecto: hoy (formato YYYY-MM-DD para el input)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setClientName("");
      setDescription("");
      setPrice("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Validaciones
    if (!clientName.trim()) {
      return Swal.fire({
        title: "Falta Cliente",
        text: "Ingresa el nombre del cliente.",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });
    }
    if (!description.trim()) {
      return Swal.fire({
        title: "Falta Descripción",
        text: "Detalla el servicio a cotizar.",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });
    }
    if (!price || parseFloat(price) <= 0) {
      return Swal.fire({
        title: "Precio Inválido",
        text: "Ingresa un monto válido.",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });
    }

    setLoading(true);

    try {
      // Guardamos en la colección "sales" (o "quotes" si prefieres separarlo)
      // Usamos el tipo "cotizacion" para diferenciarlo de ventas reales
      await addDoc(collection(db, "sales"), {
        clientName,
        description,
        total: parseFloat(price),
        date: Timestamp.fromDate(new Date(date)), // Usamos la fecha seleccionada
        type: "cotizacion", // Etiqueta fija como solicitaste
        items: [
          { name: "Servicio Cotizado", quantity: 1, price: parseFloat(price) },
        ], // Estructura compatible con tu tabla
        status: "pending", // Estado opcional por si luego quieres aprobarla
      });

      Swal.fire({
        title: "¡Cotización Creada!",
        text: "El documento se ha guardado correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#1f2937",
        color: "#fff",
      });

      onClose();
    } catch (error) {
      console.error("Error al guardar cotización:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar la cotización.",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Contenedor Modal (Ancho reducido ya que no hay lista de productos) */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-indigo-400" size={24} />
            Nueva Cotización
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY DEL FORMULARIO */}
        <div className="p-6 space-y-5">
          {/* Fila 1: Cliente y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <User size={14} /> Cliente
              </label>
              <input
                type="text"
                placeholder="Nombre del cliente"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} /> Fecha
              </label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all [color-scheme:dark]"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Fila 2: Tipo de Servicio (Visualmente Informativo) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Tipo de Documento
            </label>
            <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-indigo-400 font-medium text-sm flex items-center gap-2 cursor-not-allowed">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              Cotización de Servicios / Productos
            </div>
          </div>

          {/* Fila 3: Descripción (Campo Mediano) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlignLeft size={14} /> Descripción del Servicio
            </label>
            <textarea
              rows={5}
              placeholder="Detalla aquí los trabajos a realizar, materiales incluidos, condiciones, etc..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Fila 4: Precio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <DollarSign size={14} /> Precio Total Estimado
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">
                $
              </span>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2.5 text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* FOOTER: Botón de Guardar */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
              loading
                ? "bg-slate-700 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 hover:scale-[1.01]"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Guardar Cotización
          </button>
        </div>
      </div>
    </div>
  );
}
