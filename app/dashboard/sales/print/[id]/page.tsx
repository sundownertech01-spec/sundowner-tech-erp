// app/dashboard/sales/print/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
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
        
        setSale({ id: saleDoc.id, ...saleData });

        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        if (saleData.clientName && saleData.clientName !== "Público General") {
          const q = query(collection(db, "clients"), where("name", "==", saleData.clientName), limit(1));
          const clientSnap = await getDocs(q);
          
          if (!clientSnap.empty) {
            const clientRealData = clientSnap.docs[0].data();
            setClient({
              name: clientRealData.name || saleData.clientName,
              phone: clientRealData.phone || "Sin teléfono",
              address: clientRealData.address || "",
              email: clientRealData.email || "Sin correo"
            });
          } else {
            setClient({ name: saleData.clientName, phone: "", address: "", email: "" });
          }
        } else {
          setClient({ name: saleData.clientName || "Público General", phone: "N/A", address: "Venta en mostrador", email: "N/A" });
        }

      } catch (error) {
        console.error("Error cargando documento:", error);
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

  if (!sale) return <div className="p-10 text-center text-red-500">Documento no encontrado</div>;

  // Componente de circulito para los Checkboxes del Excel
  const CircleCheck = () => <div className="w-4 h-4 rounded-full border-[1.5px] border-gray-400 inline-block bg-gray-200/50"></div>;

  return (
    <div className="min-h-screen bg-slate-200 py-10 print:py-0 print:bg-white flex justify-center text-black">
      
      <button 
        onClick={() => window.print()} 
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-2xl print:hidden hover:bg-indigo-500 transition-all z-50 flex items-center gap-2"
      >
        <Printer size={24} /> Imprimir Documento
      </button>

      {/* RENDERIZADO CONDICIONAL: ¿Es Servicio o es Venta/Cotización? */}
      {sale.type === "servicio" ? (
        
        /* =========================================================
           FORMATO 1: REPORTE DE SERVICIO TÉCNICO (Estilo Excel)
           ========================================================= */
        <div className="w-[800px] bg-white p-8 shadow-2xl print:shadow-none print:p-0 text-[13px] font-sans">
          
          <div className="border-2 border-black mb-4">
            {/* CABECERA */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="flex flex-col p-1 border-r border-black">
                <div className="flex items-end gap-2"><span className="whitespace-nowrap">Nombre del técnico:</span><div className="border-b border-black flex-1 h-4"></div></div>
                <div className="flex items-end gap-2 mt-1"><span className="whitespace-nowrap">Numero de empleado:</span><div className="border-b border-black flex-1 h-4"></div></div>
              </div>
              <div className="flex flex-col p-1">
                <div className="flex gap-4">
                  <div className="flex items-end gap-2 flex-1"><span className="whitespace-nowrap">Hora inicio:</span><div className="border-b border-black flex-1 h-4"></div></div>
                  <div className="flex items-end gap-2 flex-1"><span className="whitespace-nowrap">Hora fin:</span><div className="border-b border-black flex-1 h-4"></div></div>
                </div>
                <div className="flex items-end gap-2 mt-1"><span className="whitespace-nowrap">Nombre de la empresa:</span><div className="border-b border-black flex-1 h-4 font-bold text-center">{settings?.companyName || "Sundowner Tech"}</div></div>
              </div>
            </div>

            {/* SECCIÓN EQUIPO */}
            <div className="bg-gray-100 text-center font-bold border-b border-black py-0.5">Equipo</div>
            <div className="p-2 border-b border-black space-y-1">
              <div className="font-bold">Calentadores</div>
              <div className="flex items-end gap-2"><span className="w-24">Marca</span><div className="border-b border-black w-48 h-4"></div></div>
              <div className="flex items-end gap-2"><span className="w-24">N° de tubos</span><div className="border-b border-black w-48 h-4"></div></div>
              
              <div className="font-bold mt-2">Cámaras</div>
              <div className="flex items-end gap-2"><span className="w-24">Marca</span><div className="border-b border-black w-48 h-4"></div></div>
              <div className="flex items-center gap-4 mt-1">
                <span className="w-24">N° de cámaras</span><div className="border-b border-black w-24 h-4 inline-block"></div>
                <span className="ml-4 font-bold">DVR</span> <CircleCheck />
                <span className="ml-4 font-bold">IP</span> <CircleCheck />
              </div>
              <div className="flex items-end gap-2 mt-1">
                <span className="w-24">Otro</span><div className="border-b border-black w-32 h-4"></div>
                <span className="ml-2">Especifica:</span><div className="border-b border-black flex-1 h-4"></div>
              </div>
            </div>

            {/* SECCIÓN PROVEEDOR (Con barra lateral vertical) */}
            <div className="flex border-b border-black">
              <div className="w-8 border-r border-black flex items-center justify-center font-bold tracking-widest bg-gray-100">
                <span className="[writing-mode:vertical-lr] rotate-180">Proveedor</span>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="bg-gray-100 text-center font-bold border-b border-black py-0.5">Descripción de servicios</div>
                <div className="p-2 space-y-1 border-b border-black">
                  <div className="flex gap-2 items-center"><span>Venta del equipo</span><CircleCheck /></div>
                  <div className="flex gap-2 items-center"><span>Instalación del equipo</span><CircleCheck /></div>
                  <div className="flex gap-2 items-center"><span>Mantenimiento del equipo</span><CircleCheck /></div>
                </div>

                <div className="bg-gray-100 text-center font-bold border-b border-black py-0.5">Validación del funcionamiento</div>
                <div className="p-2 grid grid-cols-3 gap-2 border-b border-black font-bold">
                  <div>Cámara de seguridad<br/><span className="font-normal">Imagen</span> <CircleCheck /></div>
                  <div>Calentador Solar<br/><span className="font-normal">No hay fugas</span> <CircleCheck /></div>
                  <div>Otros<br/><span className="font-normal">Funcionamiento correcto</span> <CircleCheck /></div>
                </div>

                <div className="bg-gray-100 text-center font-bold border-b border-black py-0.5">Observaciones del técnico</div>
                <div className="h-20 p-2 text-gray-500 italic">
                  {/* Aquí dejamos el espacio en blanco o imprimimos la descripción si hay */}
                  {sale.description && sale.description !== "Venta de productos" ? sale.description : ""}
                </div>
              </div>
            </div>

            {/* SECCIÓN USUARIO / CLIENTE */}
            <div className="flex">
              <div className="w-8 border-r border-black flex items-center justify-center font-bold tracking-widest bg-gray-100">
                <span className="[writing-mode:vertical-lr] rotate-180">Usuario/Cliente</span>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="p-2 border-b border-black space-y-2">
                  <div className="flex items-end gap-2">
                    <span>Nombre del cliente</span><div className="border-b border-black flex-1 h-4 font-bold px-2">{sale.clientName}</div>
                    <span>Calle</span><div className="border-b border-black flex-1 h-4 font-bold px-2 truncate max-w-[200px]">{client?.address}</div>
                    <span>N°</span><div className="border-b border-black w-16 h-4"></div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span>Colonia</span><div className="border-b border-black flex-1 h-4"></div>
                    <span>Fecha:</span><div className="border-b border-black w-32 h-4 text-center font-bold">{sale.date && typeof sale.date.toDate === 'function' ? sale.date.toDate().toLocaleDateString("es-MX") : "Sin fecha"}</div>
                  </div>
                </div>

                <div className="bg-gray-100 text-center font-bold border-b border-black py-0.5">Encuesta del servicio</div>
                <div className="grid grid-cols-3 border-b border-black text-center divide-x divide-black">
                  <div className="p-1">
                    <div>El trato recibido fue</div>
                    <div className="flex justify-center gap-4 mt-1 text-left">
                      <div>Mala <CircleCheck /><br/>Regular <CircleCheck /><br/>Buena <CircleCheck /></div>
                    </div>
                  </div>
                  <div className="p-1">
                    <div>La atención del servicio fue</div>
                    <div className="flex justify-center gap-4 mt-1 text-left">
                      <div>Mala <CircleCheck /><br/>Regular <CircleCheck /><br/>Buena <CircleCheck /></div>
                    </div>
                  </div>
                  <div className="p-1">
                    <div>La limpieza y orden con la que trabajo el técnico fue</div>
                    <div className="flex justify-center gap-4 mt-1 text-left">
                      <div>Mala <CircleCheck /><br/>Regular <CircleCheck /><br/>Buena <CircleCheck /></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 text-center font-bold border-b border-black py-0.5">Comentarios generales o de mejora del servicio</div>
                <div className="h-16"></div>
              </div>
            </div>
          </div>

          {/* FIRMAS Y LOGO */}
          <div className="grid grid-cols-2 gap-10 text-center mt-10">
            <div>
              <div className="border border-black font-bold py-1 bg-gray-100 w-3/4 mx-auto">Proveedor de Servicio</div>
              <div className="mt-16 border-t border-black pt-1 w-3/4 mx-auto text-xs">Nombre y firma del técnico responsable</div>
            </div>
            <div>
              <div className="border border-black font-bold py-1 bg-gray-100 w-3/4 mx-auto">Usuario</div>
              <div className="mt-16 border-t border-black pt-1 w-3/4 mx-auto text-xs">Nombre y firma del usuario</div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="w-48 h-16 flex items-center justify-center">
               <img src="/logo.png" alt="Logo Sundowner" className="w-full h-full object-contain" />
            </div>
          </div>

        </div>

      ) : (

        /* =========================================================
           FORMATO 2: NOTA DE VENTA / COTIZACIÓN NORMAL
           ========================================================= */
        <div className="w-[800px] bg-white p-10 shadow-2xl print:shadow-none print:p-0">
          
          <div className="bg-black text-white px-4 py-1 font-bold text-lg uppercase tracking-wider">
            {sale.type === 'cotizacion' ? 'Cotización' : 'Nota de Venta'}
          </div>

          <div className="flex justify-between items-center py-6 border-b-2 border-black">
            <div className="w-32 h-32 flex items-center justify-center">
              <img src="/logo.png" alt="Logo Sundowner" className="w-full h-full object-contain" />
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
            
            <div className="border-r-2 border-black border-b-2 py-1 uppercase truncate px-1">{sale.clientName}</div>
            <div className="border-r-2 border-black border-b-2 py-1 col-span-2">{client?.phone}</div>
            <div className="border-b-2 border-black py-1">
              {sale.date && typeof sale.date.toDate === 'function' ? sale.date.toDate().toLocaleDateString("es-MX") : "Sin fecha"}
            </div>

            <div className="border-r-2 border-black border-b-2 py-1 bg-gray-100 col-span-2">Dirección</div>
            <div className="border-r-2 border-black border-b-2 py-1 bg-gray-100">Correo Electrónico</div>
            <div className="border-b-2 border-black py-1 bg-gray-100">Forma de pago</div>

            <div className="border-r-2 border-black py-1 col-span-2 uppercase text-xs px-2 flex items-center justify-center text-center">
              {client?.address}
            </div>
            <div className="border-r-2 border-black py-1 uppercase text-xs px-1 flex items-center justify-center truncate">
              {client?.email}
            </div>
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
      )}
      
    </div>
  );
}