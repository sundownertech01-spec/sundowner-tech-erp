// app/dashboard/layout.tsx
import Sidebar from "@/components/ui/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Aquí inyectamos el Sidebar. "children" será la página específica (Inventario, Ventas, etc.)
    <Sidebar>
      <div className="flex-1 p-6 bg-slate-900">{children}</div>
    </Sidebar>
  );
}
