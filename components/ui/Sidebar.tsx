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
  Wrench,
  ShieldCheck,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const { role } = useAuth();

  const allMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "practicante"] },
    { name: "Inventario", href: "/dashboard/inventory", icon: Package, roles: ["admin", "practicante"] },
    { name: "Herramientas", href: "/dashboard/tools", icon: Wrench, roles: ["admin", "practicante"] },
    { name: "Servicios", href: "/dashboard/services", icon: ClipboardList, roles: ["admin", "practicante"] },
    { name: "Ventas", href: "/dashboard/sales", icon: ShoppingCart, roles: ["admin", "practicante"] },
    { name: "Gastos", href: "/dashboard/expenses", icon: Wallet, roles: ["admin", "practicante"] },
    { name: "Clientes", href: "/dashboard/clients", icon: Users, roles: ["admin", "practicante"] },
    { name: "Usuarios", href: "/dashboard/users", icon: ShieldCheck, roles: ["admin"] },
    { name: "Configuración", href: "/dashboard/settings", icon: Settings, roles: ["admin", "practicante"] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role || "practicante"));

  const handleLogout = async () => {
    try {
      await Swal.fire({
        title: "¿Cerrar sesión?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, salir",
        background: "#1f2937",
        color: "#fff",
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
    // 1. CONTENEDOR PRINCIPAL CON IMAGEN DE FONDO
    <div 
      className="flex h-screen w-full overflow-hidden text-white relative"
      style={{
        backgroundImage: "url('/fondo-login.jpg')", // Usamos tu misma imagen del login
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 2. CAPA OSCURA GLOBAL (90% de opacidad para que todo sea legible) */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] z-0"></div>

      {/* --- SIDEBAR PARA DESKTOP --- */}
      {/* 3. FONDO TRANSPARENTE EN EL SIDEBAR (bg-slate-900/50 y backdrop-blur-md) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/50 h-full relative z-10 bg-slate-900/50 backdrop-blur-md">
        <div className="p-6 border-b border-slate-800/50 shrink-0">
          <h1 className="text-2xl font-bold text-indigo-500">Sundowner<span className="text-white">ERP</span></h1>
          <p className="text-xs text-slate-400 mt-1">Gestión Empresarial</p>
          <div className="mt-3 inline-block px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
              Perfil: {role === "admin" ? "Administrador" : "Practicante"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-slate-800/80 hover:text-white"}`}>
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quitamos el fondo sólido de la parte inferior también */}
        <div className="p-4 border-t border-slate-800/50 shrink-0 bg-slate-900/30">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
            <LogOut size={20} /><span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- HEADER Y MENÚ MÓVIL --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* HEADER MÓVIL TAMBIÉN CON TRANSPARENCIA */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/50 shrink-0 z-50 bg-slate-900/50 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold text-indigo-500">Sundowner<span className="text-white">ERP</span></h1>
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block mt-0.5">
              Perfil: {role === "admin" ? "Administrador" : "Practicante"}
            </span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-slate-900/95 backdrop-blur-xl z-40 p-4 space-y-2 animate-in slide-in-from-top-2 border-b border-slate-800/50 shadow-2xl">
            <p className="text-xs text-slate-400 px-4 mb-4">Gestión Empresarial</p>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-all duration-200 ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-slate-800/80 hover:text-white"}`}>
                  <item.icon size={22} />{item.name}
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-slate-800/50">
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors font-medium">
                <LogOut size={22} /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* 4. ÁREA DE CONTENIDO (Sin bg-slate-950 para que sea transparente) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}