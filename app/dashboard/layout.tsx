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
      {children}
    </Sidebar>
  );
}