// app/dashboard/tools/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Wrench } from "lucide-react";
import ToolModal from "@/components/inventory/ToolModal";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface Tool {
  id: string;
  name: string;
  category: string;
  cost: number;
  quantity: number;
  condition: string;
}

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toolToEdit, setToolToEdit] = useState<Tool | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Escuchamos la colección "tools" en lugar de "products"
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
        title: "¿Estás seguro?",
        text: `Vas a eliminar "${name}" de tus activos.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3f2e2e",
        cancelButtonColor: "#374151",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        background: "#1f2937",
        color: "#fff",
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "tools", id));
        Swal.fire({
          title: "¡Eliminado!",
          icon: "success",
          background: "#1f2937",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Wrench className="text-indigo-500" /> Herramientas y Equipo
          </h2>
          <p className="text-sm text-slate-400">
            Control de activos internos de la empresa
          </p>
        </div>
        <button
          onClick={() => {
            setToolToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Agregar Herramienta</span>
        </button>
      </div>

      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar herramienta por nombre..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
            <p>Cargando herramientas...</p>
          </div>
        )}
        {!isLoading && filteredTools.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No hay herramientas registradas aún.
          </div>
        )}

        {/* --- VISTA PARA PC --- */}
        {!isLoading && filteredTools.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                    Herramienta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">
                    Estado Físico
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTools.map((tool) => (
                  <tr
                    key={tool.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {tool.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {tool.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          tool.condition === "Mala"
                            ? "bg-red-500/10 text-red-400"
                            : tool.condition === "Regular"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {tool.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-white">
                        {tool.quantity} pz
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setToolToEdit(tool);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tool.id, tool.name)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VISTA PARA MÓVIL --- */}
        {!isLoading && filteredTools.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {tool.name}
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {tool.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                    <button
                      onClick={() => {
                        setToolToEdit(tool);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button
                      onClick={() => handleDelete(tool.id, tool.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                      tool.condition === "Mala"
                        ? "bg-red-500/10 text-red-400"
                        : tool.condition === "Regular"
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    Estado: {tool.condition}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {tool.quantity} pz
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 md:px-6 py-3 border-t border-slate-800 bg-slate-800/20 text-xs text-slate-400 flex justify-between items-center">
          <span>{filteredTools.length} herramientas registradas</span>
        </div>
      </div>

      <ToolModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        toolToEdit={toolToEdit}
      />
    </div>
  );
}
