// app/dashboard/page.tsx
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-white">Panel Principal</h2>
      
      {/* EL TRUCO ESTÁ AQUÍ: 
        grid-cols-2 (2 columnas en celular)
        md:grid-cols-4 (4 columnas en pantallas grandes)
        gap-3 (espacio pequeño en móvil para que quepan bien)
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        
        {/* Tarjeta 1: Ventas */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">Ventas del Día</p>
            {/* Ícono más pequeño en celular */}
            <div className="p-1.5 md:p-3 bg-indigo-500/10 rounded-lg text-indigo-500 shrink-0 ml-2">
              <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-2 md:mt-4">$0.00</h3>
        </div>

        {/* Tarjeta 2: Pedidos */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">Pedidos Nuevos</p>
            <div className="p-1.5 md:p-3 bg-blue-500/10 rounded-lg text-blue-500 shrink-0 ml-2">
              <ShoppingBag className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-2 md:mt-4">0</h3>
        </div>

        {/* Tarjeta 3: Productos */}
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">Productos Bajos</p>
            <div className="p-1.5 md:p-3 bg-orange-500/10 rounded-lg text-orange-500 shrink-0 ml-2">
              <Package className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-2 md:mt-4">0</h3>
        </div>

         {/* Tarjeta 4: Clientes */}
         <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-tight">Clientes Totales</p>
            <div className="p-1.5 md:p-3 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0 ml-2">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-2 md:mt-4">0</h3>
        </div>

      </div>

      {/* ÁREA DE GRÁFICA O TABLA RECIENTE */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-6 min-h-[300px]">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
        <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 text-sm md:text-base">
          Aquí irán las gráficas de ventas pronto...
        </div>
      </div>
    </div>
  );
}