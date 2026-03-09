// app/dashboard/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, AlertCircle, Loader2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import ProductModal from "@/components/inventory/ProductModal";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
}

export default function InventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS PARA BUSCADOR, FILTRO Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Muestra 10 productos por página

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsArray: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsArray.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `Vas a eliminar "${name}". Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1f2937',
        color: '#fff'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "products", id));
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El producto ha sido borrado.',
          icon: 'success',
          background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire({ title: 'Error', text: 'Problema al eliminar.', icon: 'error', background: '#1f2937', color: '#fff' });
    }
  };

  // --- EXTRAER CATEGORÍAS ÚNICAS PARA EL FILTRO ---
  const uniqueCategories = ["Todas", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // --- LÓGICA DE FILTRADO COMBINADO ---
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "Todas" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // --- LÓGICA DE PAGINACIÓN ---
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset a la página 1 si cambia la búsqueda o el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Inventario</h2>
          <p className="text-sm text-slate-400">Gestiona tus productos y existencias</p>
        </div>
        <button 
          onClick={() => {
            setProductToEdit(null);
            setIsModalOpen(true);
          }} 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4">
        
        {/* Buscador de texto */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Filtro por Categoría Dinámico */}
        <div className="relative w-full md:w-64 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <select 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors appearance-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {uniqueCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* CONTENEDOR PRINCIPAL DE LOS DATOS */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
            <p>Cargando inventario...</p>
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No se encontraron productos en la base de datos.
          </div>
        )}

        {/* --- VISTA PARA PC (TABLA) --- */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="hidden md:block overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Producto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Categoría</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Precio</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{product.name}</div>
                      <div className="text-xs text-slate-500">SKU: {product.sku || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-400">
                      ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-sm font-bold ${product.stock <= product.minStock ? 'text-red-400' : 'text-white'}`}>{product.stock}</span>
                        {product.stock <= product.minStock && (
                          <span title="Stock bajo" className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setProductToEdit(product); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
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

        {/* --- VISTA PARA MÓVIL (TARJETAS) --- */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800 min-h-[300px]">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white leading-tight">{product.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">SKU: {product.sku || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                    <button onClick={() => { setProductToEdit(product); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md">
                      <Edit className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-emerald-400">
                      ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                      <span className={`text-xs font-bold ${product.stock <= product.minStock ? 'text-red-400' : 'text-slate-300'}`}>
                        {product.stock} pz
                      </span>
                      {product.stock <= product.minStock && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
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

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        productToEdit={productToEdit}
      />
    </div>
  );
}