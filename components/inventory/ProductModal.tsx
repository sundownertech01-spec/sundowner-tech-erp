// components/inventory/ProductModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Barcode, CameraOff, Loader2 } from "lucide-react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import Swal from "sweetalert2";

// IMPORTAMOS EL ESCÁNER
import { useZxing } from "react-zxing";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: any; 
}

export default function ProductModal({ isOpen, onClose, productToEdit }: ProductModalProps) {
  // Extraemos setValue para poder inyectar el código escaneado en el formulario
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // --- LÓGICA DEL ESCÁNER PARA REGISTRAR SKU ---
  const { ref: videoRef } = useZxing({
    paused: !isScanning,
    onDecodeResult(result) {
      const code = result.getText();
      setValue("sku", code); // Escribimos el código en el input mágicamente
      setIsScanning(false);  // Apagamos la cámara
      
      Swal.fire({ 
        toast: true, position: 'top-end', icon: 'success', 
        title: 'Código capturado', showConfirmButton: false, timer: 1500, 
        background: '#1f2937', color: '#fff' 
      });
    },
    // TRUCO SENIOR: Forzar la cámara trasera para que tenga auto-enfoque
    constraints: { video: { facingMode: "environment" } } 
  });

  useEffect(() => {
    if (productToEdit) {
      reset(productToEdit); 
    } else {
      reset({ 
        name: "", sku: "", category: "", cost: "", price: "", stock: 0, minStock: 2
      });
    }
    setIsScanning(false); // Apagar cámara al abrir/cerrar
  }, [productToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const productData = {
        name: data.name,
        sku: data.sku || "Sin código",
        category: data.category,
        cost: parseFloat(data.cost),       
        price: parseFloat(data.price),     
        stock: parseInt(data.stock),       
        minStock: parseInt(data.minStock), 
        ...(productToEdit ? {} : { createdAt: new Date() }) 
      };

      if (productToEdit) {
        await updateDoc(doc(db, "products", productToEdit.id), productData);
        Swal.fire({ title: '¡Actualizado!', text: 'El producto se modificó correctamente.', icon: 'success', background: '#1f2937', color: '#fff', timer: 2000, showConfirmButton: false });
      } else {
        await addDoc(collection(db, "products"), productData);
        Swal.fire({ title: '¡Registrado!', text: 'Se ha guardado correctamente.', icon: 'success', background: '#1f2937', color: '#fff', timer: 2000, showConfirmButton: false });
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
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {productToEdit ? "Editar Producto" : "Registrar Nuevo Producto"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Nombre del Producto *</label>
              <input type="text" {...register("name", { required: "El nombre es obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Ej. Cámara Domo 360" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
            </div>
            
            {/* --- SECCIÓN DEL SKU CON ESCÁNER --- */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Código (SKU)</label>
              <div className="flex gap-2">
                <input type="text" {...register("sku")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="Ej. CAM-DMO-001" />
                <button 
                  type="button" 
                  onClick={() => setIsScanning(!isScanning)}
                  className={`flex items-center justify-center p-2.5 rounded-lg transition-colors border ${isScanning ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'}`}
                  title="Escanear Código"
                >
                  {isScanning ? <CameraOff size={20} /> : <Barcode size={20} />}
                </button>
              </div>

              {/* VISOR DE LA CÁMARA */}
              <div className={`overflow-hidden rounded-lg border border-slate-700 bg-black transition-all mt-2 ${isScanning ? 'h-32 opacity-100' : 'h-0 opacity-0 border-none mt-0'}`}>
                <video ref={videoRef} className="w-full h-full object-cover" />
                {isScanning && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Categoría *</label>
            <select {...register("category", { required: "Selecciona una categoría" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base">
              <option value="">Selecciona una opción...</option>
              <option value="CCTV">Cámaras de Seguridad (CCTV)</option>
              <option value="GPS">Localizadores GPS</option>
              <option value="Solar">Calentadores Solares</option>
              <option value="Accesorios">Accesorios y Cables</option>
              <option value="Servicios">Servicios (Instalación, Limpieza)</option>
            </select>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message as string}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Costo *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input type="number" step="0.01" {...register("cost", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Precio de Venta *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input type="number" step="0.01" {...register("price", { required: "Obligatorio" })} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-slate-800 pt-4 sm:pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Stock Inicial</label>
              <input type="number" {...register("stock")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">Alerta de Stock Mínimo</label>
              <input type="number" {...register("minStock")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm sm:text-base">
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            {isLoading ? "Guardando..." : (productToEdit ? "Guardar Cambios" : "Guardar")}
          </button>
        </div>

      </form>
    </div>
  );
}