"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  ShoppingCart,
  Search,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import NewSaleModal from "@/components/sales/NewSaleModal";
import NewQuoteModal from "@/components/sales/NewQuoteModal"; // Modal simple para cotizaciones
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Interfaz para el historial de ventas/reportes
interface SaleRecord {
  id: string;
  type: "venta" | "servicio";
  clientName: string;
  total: number;
  date: any; // Timestamp de Firebase
  itemsCount: number;
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar últimas ventas para mostrar en la tabla (Contexto visual)
  useEffect(() => {
    const q = query(
      collection(db, "sales"),
      orderBy("date", "desc"),
      limit(20),
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

  const filteredSales = sales.filter((sale) =>
    sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Reportes y Ventas
          </h2>
          <p className="text-sm text-slate-400">
            Gestiona cotizaciones, ventas y servicios realizados
          </p>
        </div>

        {/* BOTONES DE ACCIÓN (LOS SOLICITADOS) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {/* Botón 1: Cotizaciones */}
          <button
            onClick={() => setIsQuoteModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg font-medium transition-all w-full sm:w-auto"
          >
            <FileText size={20} className="text-indigo-400" />
            <span>Nueva Cotización</span>
          </button>

          {/* Botón 2: Reporte de Venta/Servicio (Conecta con BD) */}
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto"
          >
            <ShoppingCart size={20} />
            <span>Nueva Venta / Servicio</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
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

      {/* TABLA DE HISTORIAL (Estilo idéntico a Inventory) */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
            <p>Cargando reportes...</p>
          </div>
        )}

        {!isLoading && filteredSales.length > 0 && (
          <>
            {/* VISTA PC */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {sale.date?.toDate().toLocaleDateString("es-MX")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {sale.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${sale.type === "venta" ? "bg-indigo-900/30 text-indigo-400 border-indigo-800" : "bg-emerald-900/30 text-emerald-400 border-emerald-800"}`}
                        >
                          {sale.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-white">
                        $
                        {sale.total.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISTA MOVIL */}
            <div className="md:hidden divide-y divide-slate-800">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 space-y-2 hover:bg-slate-800/30"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white">{sale.clientName}</h4>
                    <span className="text-xs text-slate-500">
                      {sale.date?.toDate().toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${sale.type === "venta" ? "bg-indigo-900/30 text-indigo-400 border-indigo-800" : "bg-emerald-900/30 text-emerald-400 border-emerald-800"}`}
                    >
                      {sale.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      $
                      {sale.total.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODALES */}
      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />

      {/* Modal de cotización simplificado (puedes expandirlo similar al de venta pero sin afectar stock) */}
      <NewQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
}
