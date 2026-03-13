// app/dashboard/services/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2, ClipboardList, Scissors, AlertTriangle } from "lucide-react";
import ServiceModal from "@/components/services/ServiceModal";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  cutType: string;
  allowsExternalMaterial: boolean;
  externalMaterialSurcharge: number;
}

export default function ServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesArray: ServiceItem[] = [];
      querySnapshot.forEach((doc) => {
        servicesArray.push({ id: doc.id, ...doc.data() } as ServiceItem);
      });
      setServices(servicesArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar servicio?',
        text: `Se borrará "${name}" del catálogo.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        background: '#1f2937', color: '#fff'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "services", id));
        Swal.fire({ title: '¡Eliminado!', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const filteredServices = services.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4 md:space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-indigo-500" /> Catálogo de Servicios
          </h2>
          <p className="text-sm text-slate-400">Gestiona precios base, tipos de instalación y políticas de equipo externo.</p>
        </div>
        <button onClick={() => { setServiceToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto justify-center">
          <Plus size={20} />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-slate-500 h-5 w-5 pointer-events-none" />
          <input type="text" placeholder="Buscar servicio..." className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {isLoading && (<div className="p-12 flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" /><p>Cargando catálogo...</p></div>)}
        {!isLoading && filteredServices.length === 0 && (<div className="p-12 text-center text-slate-400">No hay servicios registrados.</div>)}

        {/* --- VISTA PC --- */}
        {!isLoading && filteredServices.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Servicio</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">Tipo</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">Políticas</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Precio Base</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${service.cutType === 'Con corte' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : service.cutType === 'Sin corte' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {service.cutType === 'Con corte' && <Scissors size={12} className="inline mr-1 mb-0.5" />}
                        {service.cutType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {service.allowsExternalMaterial ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 w-fit mx-auto">
                          <AlertTriangle size={14} /> Admite externo (+${service.externalMaterialSurcharge})
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Solo equipo interno</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-400">
                      ${service.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setServiceToEdit(service); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(service.id, service.name)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VISTA MÓVIL --- */}
        {!isLoading && filteredServices.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800">
            {filteredServices.map((service) => (
              <div key={service.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-white flex-1">{service.name}</h4>
                  <span className="font-bold text-emerald-400 shrink-0">${service.price.toLocaleString("es-MX")}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${service.cutType === 'Con corte' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {service.cutType}
                  </span>
                  {service.allowsExternalMaterial && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                      <AlertTriangle size={10} /> Externo (+${service.externalMaterialSurcharge})
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/50">
                  <button onClick={() => { setServiceToEdit(service); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800 rounded-md"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(service.id, service.name)} className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-md"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} serviceToEdit={serviceToEdit} />
    </div>
  );
}