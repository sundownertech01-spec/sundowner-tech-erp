// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Settings, Building, Save, Loader2, Receipt } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Cargar la configuración de la empresa desde Firebase al entrar
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          reset(docSnap.data());
        } else {
          // Valores iniciales por defecto
          reset({
            companyName: "Sundowner Tech",
            companyPhone: "",
            companyEmail: "",
            companyAddress: "",
            companyRFC: "",
            ticketMessage: "¡Gracias por su preferencia! Vuelva pronto."
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
      await setDoc(doc(db, "settings", "general"), data, { merge: true });
      
      Swal.fire({
        title: '¡Guardado!',
        text: 'Los datos de la empresa se actualizaron correctamente.',
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
        <p>Cargando información del negocio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Settings className="text-indigo-500" /> Configuración de la Empresa
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Estos datos aparecerán impresos en los tickets de venta y cotizaciones en PDF.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <div className="p-6 md:p-8 space-y-8">
            
            {/* SECCIÓN 1: DATOS FISCALES / GENERALES */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Building className="text-slate-400" size={20} />
                <h3 className="text-lg font-bold text-white">Datos Generales</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Comercial o Razón Social *</label>
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono de Contacto</label>
                  <input type="text" {...register("companyPhone")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. 464 123 4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico Oficial</label>
                  <input type="email" {...register("companyEmail")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="contacto@sundowner.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dirección de la Sucursal</label>
                <textarea {...register("companyAddress")} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Calle, Número, Colonia, Código Postal..." />
              </div>
            </section>

            {/* SECCIÓN 2: PERSONALIZACIÓN DEL PUNTO DE VENTA */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Receipt className="text-slate-400" size={20} />
                <h3 className="text-lg font-bold text-white">Personalización de Tickets</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mensaje al pie del Ticket / Cotización</label>
                <input type="text" {...register("ticketMessage")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="¡Gracias por su compra! Vuelva pronto." />
                <p className="text-xs text-slate-500 mt-1.5">
                  Este mensaje aparecerá en la parte inferior de los comprobantes que le entregues a tus clientes.
                </p>
              </div>
            </section>

          </div>

          {/* FOOTER CON BOTÓN DE GUARDAR */}
          <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center w-full md:w-auto justify-center gap-2 px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}