// app/dashboard/sales/print/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Printer } from "lucide-react";

export default function PrintSalePage() {
  const { id } = useParams(); 
  const [sale, setSale] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const saleDoc = await getDoc(doc(db, "sales", id as string));
        if (!saleDoc.exists()) return;
        const saleData = saleDoc.data();
        
        // FIX: ¡Aquí está la magia! Le inyectamos el ID manualmente a los datos
        setSale({ id: saleDoc.id, ...saleData });

        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        setClient({
          name: saleData.clientName,
          phone: "Ver expediente",
          address: "No especificada"
        });

      } catch (error) {
        console.error("Error cargando ticket:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!sale) return <div className="p-10 text-center text-red-500">Venta no encontrada</div>;

  return (
    <div className="min-h-screen bg-slate-200 py-10 print:py-0 print:bg-white flex justify-center">
      
      <button 
        onClick={() => window.print()} 
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-2xl print:hidden hover:bg-indigo-500 transition-all z-50 flex items-center gap-2"
      >
        <Printer size={24} /> Imprimir Documento
      </button>

      <div className="w-[800px] bg-white text-black p-10 shadow-2xl print:shadow-none print:p-0">
        
        <div className="bg-black text-white px-4 py-1 font-bold text-lg uppercase tracking-wider">
          {sale.type === 'cotizacion' ? 'Cotización' : 'Nota de Venta'}
        </div>

        <div className="flex justify-between items-center py-6 border-b-2 border-black">
          <div className="w-32 h-32 rounded-full border-4 border-blue-500 flex items-center justify-center font-bold text-blue-500 text-center text-xs">
            [LOGO SUNDOWNER]
          </div>
          
          <div className="text-center flex-1 px-4">
            <h1 className="text-4xl font-extrabold text-blue-600 uppercase tracking-tighter">
              {settings?.companyName || "SUNDOWNER TECH"}
            </h1>
            <p className="font-bold mt-1 text-sm border-b-2 border-black inline-block pb-1">
              Energizándote de día y cuidándote de noche
            </p>
            <p className="text-sm mt-2 font-medium">Tel: {settings?.companyPhone || "464 123 4567"}</p>
            <p className="text-sm font-medium">Correo: {settings?.companyEmail || "contacto@empresa.com"}</p>
            <p className="text-sm font-medium">{settings?.companyAddress || "Dirección de la sucursal"}</p>
          </div>
        </div>

        <div className="flex w-full border-b-2 border-black border-l-2 border-r-2 text-sm font-bold mt-2">
          <div className="w-1/4 bg-black text-white text-center py-1">Vendedor</div>
          <div className="w-1/2 text-center py-1 border-r-2 border-black uppercase">Administrador</div>
          <div className="w-1/4 flex">
            <div className="w-1/2 bg-black text-white text-center py-1 border-r-2 border-white">Folio</div>
            {/* FIX: Agregamos el signo de interrogación sale?.id?.substring... como escudo */}
            <div className="w-1/2 text-center py-1 text-red-600">{sale?.id?.substring(0, 6).toUpperCase()}</div>
          </div>
        </div>

        <div className="bg-black text-white text-center py-1 font-bold mt-2 uppercase">
          Datos del cliente
        </div>
        <div className="grid grid-cols-4 border-2 border-t-0 border-black text-sm text-center font-bold">
          <div className="border-r-2 border-black border-b-2 py-1 bg-gray-100">Cliente</div>
          <div className="border-r-2 border-black border-b-2 py-1 bg-gray-100 col-span-2">Teléfono</div>
          <div className="border-b-2 border-black py-1 bg-gray-100">Fecha</div>
          
          <div className="border-r-2 border-black border-b-2 py-1 uppercase">{sale.clientName}</div>
          <div className="border-r-2 border-black border-b-2 py-1 col-span-2">{client?.phone}</div>
          <div className="border-b-2 border-black py-1">
            {/* FIX: Escudo para la fecha de la impresión */}
            {sale.date && typeof sale.date.toDate === 'function' ? sale.date.toDate().toLocaleDateString("es-MX") : "Sin fecha"}
          </div>

          <div className="border-r-2 border-black border-b-2 py-1 bg-gray-100 col-span-2">Dirección</div>
          <div className="border-r-2 border-black border-b-2 py-1 bg-gray-100">Correo Electrónico</div>
          <div className="border-b-2 border-black py-1 bg-gray-100">Forma de pago</div>

          <div className="border-r-2 border-black py-1 col-span-2 uppercase text-xs">{client?.address}</div>
          <div className="border-r-2 border-black py-1 uppercase text-xs">No registrado</div>
          <div className="py-1 uppercase">Efectivo</div>
        </div>

        <div className="bg-black text-white text-center py-1 font-bold mt-2 uppercase">
          Datos del producto y/o servicio
        </div>
        
        <table className="w-full border-2 border-t-0 border-black text-sm text-center">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="border-r-2 border-black py-1 px-2 w-1/6">Cantidad</th>
              <th className="border-r-2 border-black py-1 px-2 w-3/6">Concepto</th>
              <th className="border-r-2 border-black py-1 px-2 w-1/6">Precio Unit.</th>
              <th className="py-1 px-2 w-1/6">Precio Total</th>
            </tr>
          </thead>
          <tbody className="font-medium uppercase">
            {sale.items?.map((item: any, index: number) => (
              <tr key={index} className="border-b border-black/20">
                <td className="border-r-2 border-black py-2">{item.quantity}</td>
                <td className="border-r-2 border-black py-2 text-left px-2">{item.name}</td>
                <td className="border-r-2 border-black py-2">${Number(item.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                <td className="py-2">${(item.quantity * item.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            
            <tr className="h-24"><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td></td></tr>
          </tbody>
        </table>

        <div className="flex w-full border-b-2 border-l-2 border-r-2 border-black text-sm font-bold">
          <div className="w-4/6"></div>
          <div className="w-1/6 border-l-2 border-r-2 border-black bg-gray-100 text-center py-2">Total</div>
          <div className="w-1/6 text-center py-2">${(sale.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="bg-black text-white text-center py-2 mt-2 font-medium text-xs">
          {settings?.ticketMessage || "¡Gracias por su preferencia!"}
        </div>

      </div>
    </div>
  );
}