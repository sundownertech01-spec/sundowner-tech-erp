// app/dashboard/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Users, Phone, Mail, MapPin } from "lucide-react";
import ClientModal from "@/components/clients/ClientModal";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: string;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsArray: Client[] = [];
      querySnapshot.forEach((doc) => {
        clientsArray.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(clientsArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar cliente?',
        text: `Se borrará a "${name}" de tu base de datos.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        background: '#1f2937', color: '#fff'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "clients", id));
        Swal.fire({ title: '¡Eliminado!', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const filteredClients = clients.filter((client) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Users className="text-indigo-500" /> Directorio de Clientes
          </h2>
          <p className="text-sm text-slate-400">Gestiona la información de tus compradores</p>
        </div>
        <button onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto justify-center">
          <Plus size={20} />
          <span>Agregar Cliente</span>
        </button>
      </div>

      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input type="text" placeholder="Buscar por nombre, correo o teléfono..." className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        
        {isLoading && (<div className="p-12 flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" /><p>Cargando clientes...</p></div>)}
        {!isLoading && filteredClients.length === 0 && (<div className="p-12 text-center text-slate-400">No hay clientes registrados con esa búsqueda.</div>)}

        {/* --- VISTA PARA PC --- */}
        {!isLoading && filteredClients.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Nombre / Empresa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Contacto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Tipo</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">{client.name}</div>
                      {client.address && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <MapPin size={12} /> <span className="truncate max-w-[200px]">{client.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-sm text-slate-300">
                        {client.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500"/> {client.phone}</div>}
                        {client.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-500"/> {client.email}</div>}
                        {!client.phone && !client.email && <span className="text-slate-600 text-xs italic">Sin contacto</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        client.type === 'Empresa' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        client.type === 'Instalador' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        client.type === 'Mayorista' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setClientToEdit(client); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(client.id, client.name)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VISTA PARA MÓVIL --- */}
        {!isLoading && filteredClients.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800">
            {filteredClients.map((client) => (
              <div key={client.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-white leading-tight">{client.name}</h4>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                        client.type === 'Empresa' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        client.type === 'Instalador' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        client.type === 'Mayorista' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                      {client.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                    <button onClick={() => { setClientToEdit(client); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md"><Edit className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button onClick={() => handleDelete(client.id, client.name)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50 space-y-2">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone size={14} className="text-slate-500" /> 
                      <a href={`tel:${client.phone}`} className="hover:text-indigo-400 transition-colors">{client.phone}</a>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Mail size={14} className="text-slate-500" /> 
                      <a href={`mailto:${client.email}`} className="truncate hover:text-indigo-400 transition-colors">{client.email}</a>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
        <div className="px-4 md:px-6 py-3 border-t border-slate-800 bg-slate-800/20 text-xs text-slate-400 flex justify-between items-center">
          <span>{filteredClients.length} clientes en total</span>
        </div>
      </div>

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={clientToEdit} />
    </div>
  );
}