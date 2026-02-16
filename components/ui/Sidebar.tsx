// components/ui/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  CreditCard
} from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inventario", href: "/dashboard/inventory", icon: Package },
    { name: "Ventas", href: "/dashboard/sales", icon: ShoppingCart },
    { name: "Clientes", href: "/dashboard/clients", icon: Users },
    { name: "Movimientos", href: "/dashboard/movements", icon: CreditCard },
    { name: "Configuración", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        background: '#1f2937',
        color: '#fff'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await signOut(auth);
          router.push("/");
        }
      });
    } catch (error) {
      console.error("Error al salir", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      
      {/* --- SIDEBAR PARA DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-indigo-500">Sundowner<span className="text-white">ERP</span></h1>
          <p className="text-xs text-slate-500 mt-1">Gestión Empresarial</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- HEADER MÓVIL Y CONTENIDO --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Móvil (Solo visible en celular) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 relative z-50">
          {/* TÍTULO DOS COLORES IDÉNTICO A PC */}
          <div>
            <h1 className="text-xl font-bold text-indigo-500">Sundowner<span className="text-white">ERP</span></h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* MENÚ MÓVIL (Overlay) */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[68px] left-0 w-full bg-slate-900 z-40 p-4 space-y-2 animate-in slide-in-from-top-2 border-b border-slate-800 shadow-2xl">
            {/* SUBTÍTULO IDÉNTICO A PC */}
            <p className="text-xs text-slate-500 px-4 mb-4">Gestión Empresarial</p>
            
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  // MISMOS EFECTOS HOVER/ACTIVE QUE EN PC
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon size={22} />
                  {item.name}
                </Link>
              );
            })}
            
            <div className="pt-2 mt-2 border-t border-slate-800">
              <button 
                onClick={handleLogout}
                // EFECTO HOVER ROJO PARA EL BOTÓN DE SALIR
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
              >
                <LogOut size={22} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}