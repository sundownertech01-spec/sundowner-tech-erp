// app/dashboard/tools/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Wrench, MapPin, Filter, ChevronLeft, ChevronRight, UserCheck, RotateCcw } from "lucide-react";
import ToolModal from "@/components/inventory/ToolModal";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface Tool {
  id: string;
  name: string;
  category: string;
  cost: number;
  quantity: number;
  condition: string;
  location: string;
  status?: string;      // NUEVO: Disponible o En Uso
  assignedTo?: string;  // NUEVO: Nombre de quién lo tiene
}

export default function ToolsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toolToEdit, setToolToEdit] = useState<Tool | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS PARA BUSCADOR, FILTRO Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    const q = query(collection(db, "tools"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const toolsArray: Tool[] = [];
      querySnapshot.forEach((doc) => {
        toolsArray.push({ id: doc.id, ...doc.data() } as Tool);
      });
      setTools(toolsArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `Vas a eliminar "${name}" de tus activos.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        background: '#1f2937', color: '#fff'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "tools", id));
        Swal.fire({ title: '¡Eliminado!', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // --- NUEVA LÓGICA: PRESTAR O DEVOLVER HERRAMIENTA ---
  const handleToggleStatus = async (tool: Tool) => {
    const isCurrentlyInUse = tool.status === "En Uso";

    if (isCurrentlyInUse) {
      // PROCESO DE DEVOLUCIÓN
      const result = await Swal.fire({
        title: '¿Devolver a almacén?',
        text: `Confirmar que ${tool.assignedTo} ha devuelto "${tool.name}".`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981', cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, recibir', cancelButtonText: 'Cancelar',
        background: '#1f2937', color: '#fff'
      });

      if (result.isConfirmed) {
        await updateDoc(doc(db, "tools", tool.id), {
          status: "Disponible",
          assignedTo: ""
        });
        Swal.fire({ title: '¡Recibido!', text: 'Herramienta en almacén.', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }
    } else {
      // PROCESO DE PRÉSTAMO
      try {
        // 1. Descargar la lista de empleados reales desde Firebase
        const usersSnap = await getDocs(query(collection(db, "users"), orderBy("name")));
        const userOptions: Record<string, string> = {};
        
        usersSnap.forEach((doc) => {
          const userName = doc.data().name;
          userOptions[userName] = userName; // Creamos las opciones para el select
        });

        // 2. Mostrar el Modal con el Select
        const { value: selectedUser } = await Swal.fire({
          title: 'Prestar Herramienta',
          text: `¿A quién le vas a asignar "${tool.name}"?`,
          input: 'select',
          inputOptions: userOptions,
          inputPlaceholder: 'Selecciona un técnico...',
          showCancelButton: true,
          confirmButtonColor: '#4f46e5', cancelButtonColor: '#374151',
          confirmButtonText: 'Asignar', cancelButtonText: 'Cancelar',
          background: '#1f2937', color: '#fff',
          inputValidator: (value) => {
            return new Promise((resolve) => {
              if (value) { resolve(null); } 
              else { resolve('Debes seleccionar a un empleado'); }
            });
          }
        });

        // 3. Guardar en Firebase
        if (selectedUser) {
          await updateDoc(doc(db, "tools", tool.id), {
            status: "En Uso",
            assignedTo: selectedUser
          });
          Swal.fire({ title: '¡Asignado!', text: `Entregado a ${selectedUser}`, icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
        }

      } catch (error) {
        console.error("Error al prestar:", error);
      }
    }
  };

  // --- LÓGICA DE FILTRADO COMBINADO ---
  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === "Todas" || tool.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  // --- LÓGICA DE PAGINACIÓN ---
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTools = filteredTools.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter]);

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Wrench className="text-indigo-500" /> Herramientas y Equipo
          </h2>
          <p className="text-sm text-slate-400">Control de activos internos y asignaciones</p>
        </div>
        <button onClick={() => { setToolToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto justify-center">
          <Plus size={20} />
          <span>Agregar Herramienta</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar herramienta por nombre..." 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <select 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors appearance-none cursor-pointer"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="Todas">Todas las Ubicaciones</option>
            <option value="Caja 1">Caja 1</option>
            <option value="Subcaja 1.1">Subcaja 1.1</option>
            <option value="Subcaja 1.2">Subcaja 1.2</option>
            <option value="Caja 2">Caja 2</option>
            <option value="Subcaja 2.1">Subcaja 2.1</option>
            <option value="Caja 3">Caja 3</option>
            <option value="Subcaja 3.1">Subcaja 3.1</option>
            <option value="Subcaja 3.2">Subcaja 3.2</option>
            <option value="Subcaja 3.3">Subcaja 3.3</option>
            <option value="Bolsa de herramientas">Bolsa de herramientas</option>
            <option value="Aparte">Aparte</option>
          </select>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA Y PAGINACIÓN */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        
        {isLoading && (<div className="p-12 flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" /><p>Cargando herramientas...</p></div>)}
        {!isLoading && filteredTools.length === 0 && (<div className="p-12 text-center text-slate-400">No hay herramientas registradas con esos filtros.</div>)}

        {/* --- VISTA PARA PC --- */}
        {!isLoading && filteredTools.length > 0 && (
          <div className="hidden md:block overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Herramienta</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">Ubicación</th>
                  {/* NUEVA COLUMNA DE DISPONIBILIDAD */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Disponibilidad</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">Condición</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedTools.map((tool) => {
                  const isAvailable = tool.status !== "En Uso";
                  
                  return (
                    <tr key={tool.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{tool.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{tool.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-indigo-300 font-medium">
                        {tool.location || "Sin asignar"}
                      </td>
                      
                      {/* ESTADO DE PRÉSTAMO */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAvailable ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Disponible
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="w-fit px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              En Uso
                            </span>
                            <span className="text-xs text-slate-400 font-medium ml-1">por {tool.assignedTo}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tool.condition === 'Mala' ? 'text-red-400' : tool.condition === 'Regular' ? 'text-yellow-400' : 'text-slate-300'}`}>
                          {tool.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          
                          {/* BOTÓN DE ASIGNAR / DEVOLVER */}
                          <button 
                            onClick={() => handleToggleStatus(tool)} 
                            className={`p-1.5 rounded-lg transition-colors ${isAvailable ? 'text-indigo-400 hover:bg-indigo-500/20' : 'text-emerald-400 hover:bg-emerald-500/20'}`}
                            title={isAvailable ? "Prestar Herramienta" : "Registrar Devolución"}
                          >
                            {isAvailable ? <UserCheck className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
                          </button>

                          <div className="w-px h-6 bg-slate-700 my-auto"></div>

                          <button onClick={() => { setToolToEdit(tool); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Editar Detalles"><Edit className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(tool.id, tool.name)} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VISTA PARA MÓVIL --- */}
        {!isLoading && filteredTools.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800 min-h-[300px]">
            {paginatedTools.map((tool) => {
              const isAvailable = tool.status !== "En Uso";

              return (
                <div key={tool.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white leading-tight">{tool.name}</h4>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">{tool.category}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"><MapPin size={10} /> {tool.location || "Sin asignar"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      
                      {/* BOTONES MÓVIL */}
                      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <button 
                          onClick={() => handleToggleStatus(tool)} 
                          className={`p-1.5 rounded-md ${isAvailable ? 'text-indigo-400' : 'text-emerald-400'}`}
                        >
                          {isAvailable ? <UserCheck className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        </button>
                        <div className="w-px h-4 bg-slate-700"></div>
                        <button onClick={() => { setToolToEdit(tool); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md"><Edit className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-slate-700"></div>
                        <button onClick={() => handleDelete(tool.id, tool.name)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>

                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${tool.condition === 'Mala' ? 'text-red-400' : tool.condition === 'Regular' ? 'text-yellow-400' : 'text-slate-400'}`}>Condición: {tool.condition}</span>
                    
                    {/* ETIQUETA DISPONIBILIDAD MÓVIL */}
                    {isAvailable ? (
                      <span className="text-[10px] font-bold text-emerald-400">● Disponible</span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-400 truncate max-w-[120px]">
                        ● En uso: {tool.assignedTo}
                      </span>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        {!isLoading && filteredTools.length > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredTools.length)} de {filteredTools.length} herramientas
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              
              <div className="text-xs font-bold text-white px-3 py-1.5 bg-indigo-600 rounded-lg shadow-lg">
                {currentPage} / {totalPages || 1}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      <ToolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} toolToEdit={toolToEdit} />
    </div>
  );
}