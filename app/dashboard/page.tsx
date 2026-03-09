// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Package, Users, Loader2, ArrowRight, ShoppingCart, FileText, BarChart3 } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
// NUEVAS IMPORTACIONES PARA LAS GRÁFICAS
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [salesToday, setSalesToday] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  // NUEVO ESTADO PARA LA GRÁFICA
  const [chartData, setChartData] = useState<any[]>([]);
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

        // 3. LÓGICA DE FECHAS PARA LA GRÁFICA (Últimos 7 días)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(startOfToday.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Preparamos el esqueleto de los últimos 7 días
        const last7DaysData: { dateStr: string; name: string; total: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(startOfToday.getDate() - i);
          last7DaysData.push({
            dateStr: d.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' }),
            name: d.toLocaleDateString("es-MX", { weekday: 'short' }).toUpperCase(), // Lun, Mar, Mie...
            total: 0
          });
        }

        // 4. Descargar ventas de los últimos 30 días para estar seguros
        const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(50));
        const salesSnap = await getDocs(salesQuery);

        let todayTotal = 0;
        const recent: any[] = [];

        salesSnap.forEach(doc => {
          const data = doc.data();
          const saleDate = data.date?.toDate();
          
          if (!saleDate) return; // Si no hay fecha, lo saltamos

          // Formateamos la fecha de esta venta para compararla
          const saleDateStr = saleDate.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' });

          // Solo sumamos Ventas y Servicios (no cotizaciones)
          if (data.type !== "cotizacion") {
            // A) Sumar ventas de HOY
            if (saleDate >= startOfToday) {
              todayTotal += data.total || 0;
            }

            // B) Sumar a la gráfica si fue en los últimos 7 días
            const dayIndex = last7DaysData.findIndex(d => d.dateStr === saleDateStr);
            if (dayIndex > -1) {
              last7DaysData[dayIndex].total += (data.total || 0);
            }
          }

          // C) Guardar actividad reciente (Top 5 sin importar el tipo)
          if (recent.length < 5) {
            recent.push({ id: doc.id, ...data, saleDate });
          }
        });

        setSalesToday(todayTotal);
        setRecentActivity(recent);
        setChartData(last7DaysData); // Guardamos los datos para Recharts

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
        <p>Cargando métricas y gráficas...</p>
      </div>
    );
  }

  // Personalización del recuadrito negro que sale al pasar el mouse por la gráfica
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 text-xs mb-1">{label}</p>
          <p className="text-emerald-400 font-bold text-sm">
            ${payload[0].value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        Panel Principal
      </h2>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
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

      {/* CONTENEDOR DIVIDIDO: GRÁFICA Y ACTIVIDAD RECIENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* GRÁFICA DE BARRAS (Ocupa 2 columnas en PC) */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-4 md:p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-indigo-400" size={20} />
            <h3 className="text-base md:text-lg font-bold text-white">Ingresos (Últimos 7 días)</h3>
          </div>
          
          <div className="flex-1 min-h-[250px] md:min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
                {/* La barra con color índigo y bordes redondeados superiores */}
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE (Ocupa 1 columna) */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col">
          <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Últimos Movimientos</h3>
            <Link href="/dashboard/sales" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-800 flex-1 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No hay actividad reciente.
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full hidden sm:flex items-center justify-center ${
                      activity.type === "cotizacion" ? "bg-slate-800 text-slate-400" :
                      activity.type === "servicio" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-indigo-500/10 text-indigo-400"
                    }`}>
                      {activity.type === "cotizacion" ? <FileText size={16} /> : <ShoppingCart size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-[120px] md:max-w-[150px]">{activity.clientName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        {activity.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
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
    </div>
  );
}