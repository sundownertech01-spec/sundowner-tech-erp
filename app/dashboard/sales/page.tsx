// app/dashboard/sales/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ShoppingCart,
  Search,
  DollarSign, // Puedes quitar Calendar si ya no lo usas, pero no estorba
  Loader2,
  Trash2,
  Edit,
  Plus,
  Printer
} from "lucide-react";
import NewSaleModal from "@/components/sales/NewSaleModal";
import NewQuoteModal from "@/components/sales/NewQuoteModal";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface SaleRecord {
  id: string;
  type: "venta" | "servicio" | "cotizacion";
  clientName: string;
  total: number;
  date: any; 
  items?: any[];
  description?: string;
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [saleToEdit, setSaleToEdit] = useState<SaleRecord | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "sales"),
      orderBy("date", "desc"),
      limit(50),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as SaleRecord,
      );
      setSales(salesData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- EL ESCUDO ANTI-CRASHES ---
  // Esta función revisa cómo viene la fecha y la formatea sin romper la página
  const formatSafeDate = (dateObj: any) => {
    if (!dateObj) return "Sin fecha";
    
    // 1. Si es el formato nuevo (Timestamp de Firebase)
    if (typeof dateObj.toDate === 'function') {
      return dateObj.toDate().toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    }
    
    // 2. Si es un dato viejo (texto o número)
    try {
      return new Date(dateObj).toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const handleDelete = async (sale: SaleRecord) => {
    try {
      const result = await Swal.fire({
        title: '¿Cancelar este registro?',
        text: sale.type === "venta" 
          ? `Al eliminar esta venta, los productos regresarán automáticamente al inventario.` 
          : `Se eliminará este registro permanentemente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, cancelar registro',
        cancelButtonText: 'No, mantener',
        background: '#1f2937',
        color: '#fff'
      });

      if (result.isConfirmed) {
        setIsLoading(true);

        await runTransaction(db, async (transaction) => {
          if (sale.type === "venta" && sale.items && sale.items.length > 0) {
            const productUpdates = [];

            for (const item of sale.items) {
              if (item.id) { 
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);
                
                if (productDoc.exists()) {
                  const currentStock = productDoc.data().stock || 0;
                  productUpdates.push({
                    ref: productRef,
                    newStock: currentStock + item.quantity
                  });
                }
              }
            }

            for (const update of productUpdates) {
              transaction.update(update.ref, { stock: update.newStock });
            }
          }

          const saleRef = doc(db, "sales", sale.id);
          transaction.delete(saleRef);
        });

        Swal.fire({
          title: '¡Eliminado!',
          text: sale.type === "venta" ? 'La venta se canceló y el stock fue devuelto.' : 'El registro fue eliminado.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#1f2937',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      Swal.fire({ title: 'Error', text: 'Hubo un problema al cancelar el registro.', icon: 'error', background: '#1f2937', color: '#fff' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (sale: SaleRecord) => {
    setSaleToEdit(sale);
    if (sale.type === "cotizacion") {
      setIsQuoteModalOpen(true);
    } else {
      Swal.fire({
        title: 'Edición Restringida',
        text: 'Para editar una venta de inventario, se recomienda cancelarla (eliminarla) y registrar una nueva, para no afectar el balance de stock.',
        icon: 'info',
        background: '#1f2937', color: '#fff'
      });
    }
  };

  // Escudo anti-crash para la búsqueda (por si clientName viene vacío)
  const filteredSales = sales.filter((sale) =>
    (sale.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-indigo-500" /> Reportes y Ventas
          </h2>
          <p className="text-sm text-slate-400">
            Gestiona cotizaciones, ventas y servicios realizados
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <button
            onClick={() => { setSaleToEdit(null); setIsQuoteModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg font-medium transition-all w-full sm:w-auto"
          >
            <FileText size={20} className="text-indigo-400" />
            <span>Nueva Cotización</span>
          </button>

          <button
            onClick={() => { setSaleToEdit(null); setIsSaleModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nueva Venta / Servicio</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar reporte por cliente..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden relative">
        
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
            <p>Procesando...</p>
          </div>
        )}

        {!isLoading && filteredSales.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No se encontraron reportes.
          </div>
        )}

        {!isLoading && filteredSales.length > 0 && (
          <>
            {/* VISTA PC */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Tipo</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Total</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {/* USAMOS EL ESCUDO AQUÍ */}
                        {formatSafeDate(sale.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {sale.clientName || "Sin nombre"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          sale.type === "venta" ? "bg-indigo-900/30 text-indigo-400 border-indigo-800" : 
                          sale.type === "cotizacion" ? "bg-slate-800 text-slate-300 border-slate-700" :
                          "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                        }`}>
                          {(sale.type || "Desconocido").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-white">
                        {/* ESCUDO PARA EL TOTAL */}
                        ${(sale.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          
                          <Link 
                            href={`/dashboard/sales/print/${sale.id}`} 
                            target="_blank" 
                            className="text-slate-400 hover:text-blue-400 transition-colors" 
                            title="Imprimir Documento"
                          >
                            <Printer className="w-5 h-5" />
                          </Link>

                          <button onClick={() => handleEdit(sale)} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Editar / Ver Detalles">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(sale)} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar / Cancelar Venta">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISTA MOVIL */}
            <div className="md:hidden divide-y divide-slate-800">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-3 hover:bg-slate-800/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{sale.clientName || "Sin nombre"}</h4>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {/* USAMOS EL ESCUDO AQUÍ */}
                        {formatSafeDate(sale.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 shrink-0">
                      
                      <Link 
                        href={`/dashboard/sales/print/${sale.id}`} 
                        target="_blank" 
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-md"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </Link>
                      
                      <div className="w-px h-4 bg-slate-700"></div>
                      <button onClick={() => handleEdit(sale)} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md"><Edit className="w-4 h-4" /></button>
                      <div className="w-px h-4 bg-slate-700"></div>
                      <button onClick={() => handleDelete(sale)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                          sale.type === "venta" ? "bg-indigo-900/30 text-indigo-400 border-indigo-800" : 
                          sale.type === "cotizacion" ? "bg-slate-800 text-slate-300 border-slate-700" :
                          "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                        }`}>
                      {(sale.type || "Desconocido").toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                       {/* ESCUDO PARA EL TOTAL */}
                      ${(sale.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="px-4 md:px-6 py-3 border-t border-slate-800 bg-slate-800/20 text-xs text-slate-400 flex justify-between items-center">
          <span>Mostrando los últimos {filteredSales.length} registros</span>
        </div>
      </div>

      <NewSaleModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} />
      
      <NewQuoteModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} />
    </div>
  );
}