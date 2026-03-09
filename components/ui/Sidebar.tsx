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
  CreditCard,
  Wrench,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

// 1. IMPORTAMOS EL GAFETE VIRTUAL
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // 2. LEEMOS EL ROL DEL USUARIO
  const { role } = useAuth();

  // 3. AGREGAMOS PERMISOS (roles) A CADA BOTÓN
  const allMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { name: "Inventario", href: "/dashboard/inventory", icon: Package, roles: ["admin", "tecnico"] },
    { name: "Herramientas", href: "/dashboard/tools", icon: Wrench, roles: ["admin", "tecnico"] },
    { name: "Ventas", href: "/dashboard/sales", icon: ShoppingCart, roles: ["admin", "tecnico"] },
    { name: "Clientes", href: "/dashboard/clients", icon: Users, roles: ["admin", "tecnico"] }, // Los técnicos pueden ver los datos de clientes para ir a instalar
    { name: "Usuarios", href: "/dashboard/users", icon: ShieldCheck, roles: ["admin"] },
    { name: "Configuración", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
    { name: "Gastos", href: "/dashboard/expenses", icon: Wallet, roles: ["admin"] },
  ];

  // 4. FILTRAMOS EL MENÚ SEGÚN EL ROL (Si no tiene rol cargado aún, asumimos "tecnico" por seguridad)
  const menuItems = allMenuItems.filter((item) => item.roles.includes(role || "tecnico"));

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
    <div className="flex h-screen bg-slate-950 text-white">
      {/* --- SIDEBAR PARA DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-indigo-500">
            Sundowner<span className="text-white">ERP</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gestión Empresarial</p>
          
          {/* ETIQUETA VISUAL DEL ROL */}
          <div className="mt-3 inline-block px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
              Perfil: {role === "admin" ? "Administrador" : "Técnico"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* AQUÍ SE DIBUJA EL MENÚ YA FILTRADO */}
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
        {/* Header Móvil */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 relative z-50">
          <div>
            <h1 className="text-xl font-bold text-indigo-500">
              Sundowner<span className="text-white">ERP</span>
            </h1>
            {/* ETIQUETA VISUAL DEL ROL EN MÓVIL */}
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block mt-0.5">
              Perfil: {role === "admin" ? "Administrador" : "Técnico"}
            </span>
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
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-slate-900 z-40 p-4 space-y-2 animate-in slide-in-from-top-2 border-b border-slate-800 shadow-2xl">
            <p className="text-xs text-slate-500 px-4 mb-4">
              Gestión Empresarial
            </p>

            {/* AQUÍ SE DIBUJA EL MENÚ MÓVIL YA FILTRADO */}
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
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