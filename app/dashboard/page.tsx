// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Package, Users, Loader2, ArrowRight, ShoppingCart, FileText, BarChart3, TrendingDown } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function DashboardPage() {
  const [salesToday, setSalesToday] = useState(0);
  const [expensesToday, setExpensesToday] = useState(0); // NUEVO ESTADO PARA GASTOS
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Obtener Clientes
        const clientsSnap = await getDocs(collection(db, "clients"));
        setTotalClients(clientsSnap.size);

        // 2. Obtener Stock
        const productsSnap = await getDocs(collection(db, "products"));
        let lowStock = 0;
        productsSnap.forEach(doc => {
          const data = doc.data();
          if (data.stock <= data.minStock) lowStock++;
        });
        setLowStockCount(lowStock);

        // 3. LÓGICA DE FECHAS PARA LA GRÁFICA
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Preparamos el esqueleto de los últimos 7 días con INGRESOS y GASTOS
        const last7DaysData: { dateStr: string; name: string; ingresos: number; gastos: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(startOfToday.getDate() - i);
          last7DaysData.push({
            dateStr: d.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' }),
            name: d.toLocaleDateString("es-MX", { weekday: 'short' }).toUpperCase(),
            ingresos: 0,
            gastos: 0 // Agregamos la columna de gastos a la gráfica
          });
        }

        // 4. Descargar VENTAS (Ingresos)
        const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(50));
        const salesSnap = await getDocs(salesQuery);

        let todayIncome = 0;
        const recent: any[] = [];

        salesSnap.forEach(doc => {
          const data = doc.data();
          const saleDate = data.date?.toDate();
          if (!saleDate) return;

          const saleDateStr = saleDate.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' });

          if (data.type !== "cotizacion") {
            if (saleDate >= startOfToday) {
              todayIncome += data.total || 0;
            }
            const dayIndex = last7DaysData.findIndex(d => d.dateStr === saleDateStr);
            if (dayIndex > -1) {
              last7DaysData[dayIndex].ingresos += (data.total || 0);
            }
          }

          if (recent.length < 5) {
            recent.push({ id: doc.id, ...data, saleDate });
          }
        });

        // 5. Descargar GASTOS (NUEVO MÓDULO)
        const expensesQuery = query(collection(db, "expenses"), orderBy("date", "desc"), limit(50));
        const expensesSnap = await getDocs(expensesQuery);
        
        let todayExpensesTotal = 0;

        expensesSnap.forEach(doc => {
          const data = doc.data();
          const expDate = data.date?.toDate();
          if (!expDate) return;

          const expDateStr = expDate.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' });

          // Sumar gastos de hoy
          if (expDate >= startOfToday) {
            todayExpensesTotal += data.amount || 0;
          }

          // Sumar gastos a la gráfica
          const dayIndex = last7DaysData.findIndex(d => d.dateStr === expDateStr);
          if (dayIndex > -1) {
            last7DaysData[dayIndex].gastos += (data.amount || 0);
          }
        });

        setSalesToday(todayIncome);
        setExpensesToday(todayExpensesTotal); // Guardar estado de gastos
        setRecentActivity(recent);
        setChartData(last7DaysData);

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
        <p>Calculando métricas financieras...</p>
      </div>
    );
  }

  // Tooltip personalizado para mostrar Ingresos y Gastos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 text-xs mb-2 font-medium border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm font-bold ${entry.dataKey === 'ingresos' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {entry.name}: ${entry.value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          ))}
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

      {/* 4 TARJETAS SUPERIORES (Añadimos Gastos) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        
        {/* Tarjeta 1: Ingresos */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">
              Ingresos de Hoy
            </p>
            <div className="p-1.5 md:p-3 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0 ml-2">
              <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-bold text-emerald-400 mt-2 md:mt-4">
            ${salesToday.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Tarjeta 2: Gastos (NUEVA) */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">
              Gastos de Hoy
            </p>
            <div className="p-1.5 md:p-3 bg-rose-500/10 rounded-lg text-rose-500 shrink-0 ml-2">
              <TrendingDown className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-bold text-rose-400 mt-2 md:mt-4">
            ${expensesToday.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Tarjeta 3: Stock */}
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

        {/* Tarjeta 4: Clientes */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">
              Clientes Totales
            </p>
            <div className="p-1.5 md:p-3 bg-blue-500/10 rounded-lg text-blue-500 shrink-0 ml-2">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-bold text-white mt-2 md:mt-4">
            {totalClients}
          </h3>
        </div>
      </div>

      {/* CONTENEDOR DIVIDIDO: GRÁFICA Y ACTIVIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* GRÁFICA COMPARATIVA */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-4 md:p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-indigo-400" size={20} />
            <h3 className="text-base md:text-lg font-bold text-white">Flujo de Dinero (Últimos 7 días)</h3>
          </div>
          
          <div className="flex-1 min-h-[250px] md:min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                
                {/* AHORA TENEMOS DOS BARRAS */}
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col">
          <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Últimas Ventas</h3>
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