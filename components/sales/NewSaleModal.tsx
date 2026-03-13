// components/sales/NewSaleModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Trash2, Save, Package, Wrench, Search, ShoppingCart, Loader2, Barcode, CameraOff, AlertTriangle
} from "lucide-react";
import { collection, getDocs, query, orderBy, runTransaction, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";
import { useZxing } from "react-zxing";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
}

// NUEVA INTERFAZ DE SERVICIOS
interface Service {
  id: string;
  name: string;
  price: number;
  cutType: string;
  allowsExternalMaterial: boolean;
  externalMaterialSurcharge: number;
}

// CARRITO INTELIGENTE (Acepta productos y servicios)
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "service";
  stock?: number; // Solo productos
  allowsExternal?: boolean; // Solo servicios
  externalSurcharge?: number; // Solo servicios
  hasExternal?: boolean; // Checkbox activado por el usuario
}

interface Client {
  id: string;
  name: string;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSaleModal({ isOpen, onClose }: NewSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]); // Estado de Servicios
  const [clients, setClients] = useState<Client[]>([]); 
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // NUEVO: Pestaña activa (productos o servicios)
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");

  // --- ESTADOS PARA LA CÁMARA ---
  const [isScanning, setIsScanning] = useState(false);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  // --- LÓGICA DEL ESCÁNER ---
  const { ref: videoRef } = useZxing({
    paused: !isScanning,
    constraints: { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
    onDecodeResult(result) {
      if (activeTab !== "products") return; // Solo escanea si estamos en la pestaña productos
      
      const code = result.getText();
      const now = Date.now();

      if (lastScannedRef.current && lastScannedRef.current.code === code && (now - lastScannedRef.current.time) < 2000) return; 

      lastScannedRef.current = { code, time: now };
      const foundProduct = products.find(p => p.sku === code || p.id === code);

      if (foundProduct) {
        addProductToCart(foundProduct);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Agregado: ${foundProduct.name}`, showConfirmButton: false, timer: 1500, background: '#1f2937', color: '#fff' });
      } else {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: `Desconocido: ${code}`, showConfirmButton: false, timer: 1500, background: '#1f2937', color: '#fff' });
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // AHORA DESCARGAMOS LAS 3 COSAS AL MISMO TIEMPO
        const [productsSnap, clientsSnap, servicesSnap] = await Promise.all([
          getDocs(query(collection(db, "products"), orderBy("name"))),
          getDocs(query(collection(db, "clients"), orderBy("name"))),
          getDocs(query(collection(db, "services"), orderBy("name")))
        ]);

        setProducts(productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product));
        setClients(clientsSnap.docs.map((doc) => ({ id: doc.id, name: doc.data().name })));
        setServices(servicesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Service));
      };
      
      fetchData();
      setCart([]);
      setClientName("");
      setSearchTerm("");
      setActiveTab("products");
      setIsScanning(false);
    } else {
      setIsScanning(false);
    }
  }, [isOpen]);

  // AGREGAR PRODUCTO AL CARRITO
  const addProductToCart = (product: Product) => {
    if (product.stock <= 0) return Swal.fire({ icon: "error", title: "Sin Stock", text: "Este producto no tiene existencias.", background: "#1f2937", color: "#fff" });
    
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.type === "product");
      if (existing) {
        if (existing.quantity >= product.stock) return prev; 
        return prev.map((item) => item.id === product.id && item.type === "product" ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, type: "product", stock: product.stock }];
    });
  };

  // AGREGAR SERVICIO AL CARRITO
  const addServiceToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === service.id && item.type === "service");
      if (existing) {
        return prev.map((item) => item.id === service.id && item.type === "service" ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        id: service.id, name: service.name, price: service.price, quantity: 1, type: "service", 
        allowsExternal: service.allowsExternalMaterial, externalSurcharge: service.externalMaterialSurcharge, hasExternal: false 
      }];
    });
  };

  const removeFromCart = (id: string, type: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id: string, type: string, newQty: number, maxStock?: number) => {
    if (newQty < 1) return;
    if (type === "product" && maxStock && newQty > maxStock) return;
    setCart((prev) => prev.map((item) => item.id === id && item.type === type ? { ...item, quantity: newQty } : item));
  };

  // TOGGLE PARA MATERIAL EXTERNO
  const toggleExternalMaterial = (id: string) => {
    setCart((prev) => prev.map((item) => item.id === id && item.type === "service" ? { ...item, hasExternal: !item.hasExternal } : item));
  };

  // CÁLCULO DEL TOTAL INTELIGENTE
  const total = cart.reduce((acc, item) => {
    const itemPrice = item.type === "service" && item.hasExternal ? item.price + (item.externalSurcharge || 0) : item.price;
    return acc + (itemPrice * item.quantity);
  }, 0);

  const handleSubmit = async () => {
    if (!clientName.trim()) return Swal.fire({ title: "Falta Cliente", text: "Selecciona un cliente.", icon: "warning", background: "#1f2937", color: "#fff" });
    if (cart.length === 0) return Swal.fire({ title: "Vacío", text: "Agrega al menos un producto o servicio.", icon: "warning", background: "#1f2937", color: "#fff" });

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        // SOLO descontamos stock de los items tipo "product"
        for (const item of cart) {
          if (item.type === "product") {
            const productRef = doc(db, "products", item.id);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) throw `El producto ${item.name} no existe.`;
            const currentStock = productDoc.data().stock;
            if (currentStock < item.quantity) throw `Stock insuficiente para ${item.name}.`;
            productUpdates.push({ ref: productRef, newStock: currentStock - item.quantity });
          }
        }

        for (const update of productUpdates) {
          transaction.update(update.ref, { stock: update.newStock });
        }

        // Determinar qué tipo de ticket es
        const hasProducts = cart.some(i => i.type === "product");
        const hasServices = cart.some(i => i.type === "service");
        const ticketType = hasProducts && hasServices ? "mixto" : hasServices ? "servicio" : "venta";

        const newSaleRef = doc(collection(db, "sales"));
        transaction.set(newSaleRef, {
          clientName,
          date: serverTimestamp(),
          type: ticketType,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            // Guardamos el precio final cobrado (base + recargo si aplica)
            price: item.type === "service" && item.hasExternal ? item.price + (item.externalSurcharge || 0) : item.price,
            hasExternal: item.hasExternal || false
          })),
          total: total,
          description: `Ticket ${ticketType} desde PDV`,
        });
      });

      Swal.fire({ title: "¡Éxito!", text: "Ticket generado correctamente.", icon: "success", timer: 1500, showConfirmButton: false, background: "#1f2937", color: "#fff" });
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire({ title: "Error", text: typeof error === "string" ? error : "Error al procesar la venta.", icon: "error", background: "#1f2937", color: "#fff" });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredServices = services.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-indigo-400" /> Punto de Venta Mixto
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* PANEL IZQUIERDO: CATÁLOGOS */}
          <div className="md:w-[45%] p-4 border-r border-slate-700 flex flex-col gap-4 bg-slate-900/50">
            
            {/* SWITCHER PRODUCTOS / SERVICIOS */}
            <div className="flex bg-slate-800 p-1 rounded-lg shrink-0">
              <button onClick={() => { setActiveTab("products"); setIsScanning(false); setSearchTerm(""); }} className={`flex items-center justify-center gap-2 flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'products' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
                <Package size={16} /> Productos
              </button>
              <button onClick={() => { setActiveTab("services"); setIsScanning(false); setSearchTerm(""); }} className={`flex items-center justify-center gap-2 flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'services' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
                <Wrench size={16} /> Servicios
              </button>
            </div>

            {/* BARRA DE BÚSQUEDA Y CÁMARA */}
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-500 h-5 w-5" />
                <input type="text" placeholder={`Buscar ${activeTab === 'products' ? 'producto' : 'servicio'}...`} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              {activeTab === "products" && (
                <button onClick={() => setIsScanning(!isScanning)} className={`flex items-center justify-center p-2.5 rounded-lg transition-colors border ${isScanning ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-indigo-500'}`} title={isScanning ? "Apagar Cámara" : "Escanear Código"}>
                  {isScanning ? <CameraOff size={20} /> : <Barcode size={20} />}
                </button>
              )}
            </div>

            {/* CONTENEDOR DE LA CÁMARA */}
            {activeTab === "products" && (
              <div className={`overflow-hidden rounded-lg border border-slate-700 bg-black transition-all shrink-0 ${isScanning ? 'h-40 opacity-100 mb-2' : 'h-0 opacity-0 border-none'}`}>
                <video ref={videoRef} className="w-full h-full object-cover" />
                {isScanning && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse"></div>
                  </div>
                )}
              </div>
            )}

            {/* LISTA DE RESULTADOS */}
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {activeTab === "products" ? (
                filteredProducts.length > 0 ? filteredProducts.map((product) => (
                  <div key={product.id} onClick={() => addProductToCart(product)} className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all flex justify-between items-center group">
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-white text-sm">{product.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Stock: {product.stock} {product.sku ? `• SKU: ${product.sku}` : ''}</div>
                    </div>
                    <div className="font-black text-indigo-400">${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                )) : <p className="text-center text-slate-500 text-sm mt-4">No se encontraron productos.</p>
              ) : (
                filteredServices.length > 0 ? filteredServices.map((service) => (
                  <div key={service.id} onClick={() => addServiceToCart(service)} className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-emerald-500 cursor-pointer transition-all flex justify-between items-center group">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-slate-200 group-hover:text-white text-sm leading-tight">{service.name}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{service.cutType}</span>
                        {service.allowsExternalMaterial && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">Permite externo</span>}
                      </div>
                    </div>
                    <div className="font-black text-emerald-400">${service.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                )) : <p className="text-center text-slate-500 text-sm mt-4">No se encontraron servicios.</p>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: CARRITO */}
          <div className="p-4 md:w-[55%] flex flex-col gap-4 bg-slate-950">
            
            {/* SELECTOR DE CLIENTE */}
            <div className="shrink-0 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cliente / Facturación</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={clientName} onChange={(e) => setClientName(e.target.value)}>
                <option value="">Selecciona un cliente...</option>
                <option value="Público General">Público General</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* TABLA DEL CARRITO */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900 shadow-inner">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                  <ShoppingCart size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">El ticket está vacío</p>
                  <p className="text-xs mt-1">Busca productos o servicios en el panel izquierdo para agregarlos a la cuenta.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800 text-slate-400 text-[10px] uppercase font-bold sticky top-0 z-10 shadow-md">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Concepto</th>
                      <th className="px-2 py-3 text-center w-24">Cant</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                      <th className="w-10 rounded-tr-xl"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {cart.map((item) => {
                      const isService = item.type === "service";
                      const finalPrice = isService && item.hasExternal ? item.price + (item.externalSurcharge || 0) : item.price;
                      
                      return (
                        <tr key={`${item.id}-${item.type}`} className="hover:bg-slate-800/30 group">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              {isService ? <Wrench size={14} className="text-emerald-500 mt-0.5 shrink-0" /> : <Package size={14} className="text-indigo-500 mt-0.5 shrink-0" />}
                              <div>
                                <div className="text-white font-bold leading-tight">{item.name}</div>
                                
                                {/* CHECKBOX MÁGICO PARA MATERIAL EXTERNO */}
                                {isService && item.allowsExternal && (
                                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer group/check w-fit">
                                    <input 
                                      type="checkbox" 
                                      checked={item.hasExternal} 
                                      onChange={() => toggleExternalMaterial(item.id)}
                                      className="w-3.5 h-3.5 rounded border-slate-600 text-orange-500 focus:ring-orange-500 bg-slate-900 cursor-pointer" 
                                    />
                                    <span className={`text-[11px] font-bold transition-colors ${item.hasExternal ? 'text-orange-400' : 'text-slate-500 group-hover/check:text-slate-400'}`}>
                                      Cliente trae equipo (+${item.externalSurcharge})
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-center gap-1 bg-slate-950 rounded-lg border border-slate-800 p-0.5 mx-auto">
                              <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1, item.stock)} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800">-</button>
                              <span className="font-bold w-6 text-center text-white text-xs">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1, item.stock)} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800">+</button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-white">
                            ${(finalPrice * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button onClick={() => removeFromCart(item.id, item.type)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* TOTAL Y CHECKOUT */}
            <div className="shrink-0 pt-2">
              <div className="flex justify-between items-end mb-4 bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total del Ticket:</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <button onClick={handleSubmit} disabled={loading} className={`w-full py-4 rounded-xl font-black text-white text-lg shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] ${loading ? "bg-slate-700 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 border border-white/10"}`}>
                {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                Cerrar Cuenta y Cobrar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}