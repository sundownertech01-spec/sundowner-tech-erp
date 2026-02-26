// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Package, Users, Loader2, ArrowRight, ShoppingCart, FileText } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function DashboardPage() {
  const [salesToday, setSalesToday] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Obtener Clientes Totales
        const clientsSnap = await getDocs(collection(db, "clients"));
        setTotalClients(clientsSnap.size);

        // 2. Obtener Productos con Stock Bajo
        const productsSnap = await getDocs(collection(db, "products"));
        let lowStock = 0;
        productsSnap.forEach(doc => {
          const data = doc.data();
          if (data.stock <= data.minStock) lowStock++;
        });
        setLowStockCount(lowStock);

        // 3. Obtener Ventas de Hoy y Actividad Reciente
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Traemos los últimos 10 movimientos (Ventas o Cotizaciones)
        const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(10));
        const salesSnap = await getDocs(salesQuery);

        let todayTotal = 0;
        const recent: any[] = [];

        salesSnap.forEach(doc => {
          const data = doc.data();
          const saleDate = data.date?.toDate();

          // Sumar solo si es una venta/servicio y fue hecha hoy
          if (saleDate && saleDate >= startOfToday && data.type !== "cotizacion") {
            todayTotal += data.total || 0;
          }

          // Guardar las últimas 5 actividades para la tabla visual
          if (recent.length < 5) {
            recent.push({ id: doc.id, ...data, saleDate });
          }
        });

        setSalesToday(todayTotal);
        setRecentActivity(recent);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p>Cargando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        Panel Principal
      </h2>

      {/* Como quitaste la tarjeta de Pedidos, cambiamos a grid-cols-3 en PC 
        para que las 3 tarjetas ocupen todo el ancho uniformemente.
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        
        {/* Tarjeta 1: Ventas */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">
              Ventas de Hoy
            </p>
            <div className="p-1.5 md:p-3 bg-indigo-500/10 rounded-lg text-indigo-500 shrink-0 ml-2">
              <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-bold text-white mt-2 md:mt-4">
            ${salesToday.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Tarjeta 2: Productos Bajos */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">
              Alertas de Stock
            </p>
            <div className="p-1.5 md:p-3 bg-orange-500/10 rounded-lg text-orange-500 shrink-0 ml-2">
              <Package className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-bold text-white mt-2 md:mt-4">
            {lowStockCount}
          </h3>
        </div>

        {/* Tarjeta 3: Clientes */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">
              Clientes Registrados
            </p>
            <div className="p-1.5 md:p-3 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0 ml-2">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-bold text-white mt-2 md:mt-4">
            {totalClients}
          </h3>
        </div>
      </div>

      {/* ÁREA DE ACTIVIDAD RECIENTE */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-base md:text-lg font-bold text-white">
            Últimos Movimientos
          </h3>
          <Link href="/dashboard/sales" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            Ver todo <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="divide-y divide-slate-800">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay actividad reciente. Empieza a registrar ventas.
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full hidden sm:block ${
                    activity.type === "cotizacion" ? "bg-slate-800 text-slate-400" :
                    activity.type === "servicio" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-indigo-500/10 text-indigo-400"
                  }`}>
                    {activity.type === "cotizacion" ? <FileText size={20} /> : <ShoppingCart size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activity.clientName}</h4>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      {activity.type} • {activity.saleDate?.toLocaleDateString("es-MX", { hour: '2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${activity.type === "cotizacion" ? "text-slate-300" : "text-emerald-400"}`}>
                    ${activity.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}