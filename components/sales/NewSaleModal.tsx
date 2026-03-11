// components/sales/NewSaleModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Plus, Trash2, Save, Package, Wrench, Search, ShoppingCart, Loader2, Barcode, CameraOff
} from "lucide-react";
import { collection, getDocs, query, orderBy, runTransaction, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

// 1. IMPORTAMOS EL ESCÁNER
import { useZxing } from "react-zxing";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string; // IMPORTANTE: Agregamos SKU para leer el código de barras
}

interface CartItem extends Product {
  quantity: number;
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
  const [clients, setClients] = useState<Client[]>([]); 
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [isManualService, setIsManualService] = useState(false);
  const [serviceDescription, setServiceDescription] = useState("");
  const [manualPrice, setManualPrice] = useState<string>("");

  // --- ESTADOS PARA LA CÁMARA ---
  const [isScanning, setIsScanning] = useState(false);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  // --- LÓGICA DEL ESCÁNER ---
  const { ref: videoRef } = useZxing({
    paused: !isScanning, // Solo escanea cuando está activo
    
    // ¡AQUÍ ESTÁ LA MAGIA! Forzamos la cámara trasera para tener auto-enfoque
    constraints: { video: { facingMode: "environment" } },
    
    onDecodeResult(result) {
      const code = result.getText();
      const now = Date.now();

      // SISTEMA ANTI-REBOTE: Ignora el código si es el mismo y pasaron menos de 2 segundos
      if (lastScannedRef.current && lastScannedRef.current.code === code && (now - lastScannedRef.current.time) < 2000) {
        return; 
      }

      lastScannedRef.current = { code, time: now };

      // Buscar el producto por SKU o por ID
      const foundProduct = products.find(p => p.sku === code || p.id === code);

      if (foundProduct) {
        addToCart(foundProduct);
        // Toast verde de éxito
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Agregado: ${foundProduct.name}`, showConfirmButton: false, timer: 1500, background: '#1f2937', color: '#fff' });
      } else {
        // Toast rojo si el producto no está en la base de datos
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: `Desconocido: ${code}`, showConfirmButton: false, timer: 1500, background: '#1f2937', color: '#fff' });
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const [productsSnap, clientsSnap] = await Promise.all([
          getDocs(query(collection(db, "products"), orderBy("name"))),
          getDocs(query(collection(db, "clients"), orderBy("name")))
        ]);

        const productsData = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);
        const clientsData = clientsSnap.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
        
        setProducts(productsData);
        setClients(clientsData);
      };
      
      fetchData();
      
      setCart([]);
      setClientName("");
      setServiceDescription("");
      setManualPrice("");
      setIsManualService(false);
      setSearchTerm("");
      setIsScanning(false); // Apagamos la cámara al abrir
    } else {
      setIsScanning(false); // Apagamos la cámara al cerrar
    }
  }, [isOpen]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      return Swal.fire({ icon: "error", title: "Sin Stock", text: "Este producto no tiene existencias.", background: "#1f2937", color: "#fff" });
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; 
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsManualService(false);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQty: number, maxStock: number) => {
    if (newQty < 1 || newQty > maxStock) return;
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const total = isManualService
    ? parseFloat(manualPrice || "0")
    : cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (!clientName.trim())
      return Swal.fire({ title: "Falta Cliente", text: "Selecciona un cliente.", icon: "warning", background: "#1f2937", color: "#fff" });
    if (isManualService && !manualPrice)
      return Swal.fire({ title: "Falta Precio", text: "Ingresa el costo del servicio.", icon: "warning", background: "#1f2937", color: "#fff" });
    if (!isManualService && cart.length === 0)
      return Swal.fire({ title: "Vacío", text: "Agrega productos o activa modo servicio.", icon: "warning", background: "#1f2937", color: "#fff" });

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        if (!isManualService) {
          for (const item of cart) {
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

        const newSaleRef = doc(collection(db, "sales"));
        transaction.set(newSaleRef, {
          clientName,
          date: serverTimestamp(),
          type: isManualService ? "servicio" : "venta",
          items: isManualService ? [{ name: serviceDescription || "Servicio General", price: total, quantity: 1 }] : cart,
          total: total,
          description: isManualService ? serviceDescription : "Venta de productos",
        });
      });

      Swal.fire({ title: "¡Éxito!", text: "Operación registrada correctamente.", icon: "success", timer: 1500, showConfirmButton: false, background: "#1f2937", color: "#fff" });
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire({ title: "Error", text: typeof error === "string" ? error : "Error al procesar la venta.", icon: "error", background: "#1f2937", color: "#fff" });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {isManualService ? <Wrench className="text-emerald-400" /> : <Package className="text-indigo-400" />}
            {isManualService ? "Registrar Servicio" : "Punto de Venta"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* PANEL IZQUIERDO: PRODUCTOS Y ESCÁNER */}
          {!isManualService && (
            <div className="md:w-1/2 p-4 border-r border-slate-700 overflow-y-auto flex flex-col gap-4 bg-slate-900/50">
              
              {/* Barra de Búsqueda y Botón de Cámara */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-slate-500 h-5 w-5" />
                  <input type="text" placeholder="Buscar por nombre..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button 
                  onClick={() => setIsScanning(!isScanning)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${isScanning ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'}`}
                  title={isScanning ? "Apagar Cámara" : "Escanear Código"}
                >
                  {isScanning ? <CameraOff size={20} /> : <Barcode size={20} />}
                </button>
              </div>

              {/* CONTENEDOR DE LA CÁMARA */}
              <div className={`overflow-hidden rounded-lg border border-slate-700 bg-black transition-all ${isScanning ? 'h-48 opacity-100 mb-2' : 'h-0 opacity-0 border-none'}`}>
                <video ref={videoRef} className="w-full h-full object-cover" />
                {isScanning && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
                    {/* Línea roja láser para apuntar */}
                    <div className="w-3/4 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Lista de Productos */}
              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {filteredProducts.map((product) => (
                  <div key={product.id} onClick={() => addToCart(product)} className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all flex justify-between items-center group">
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-white">{product.name}</div>
                      <div className="text-xs text-slate-500">Stock: {product.stock} {product.sku ? `• SKU: ${product.sku}` : ''}</div>
                    </div>
                    <div className="font-bold text-emerald-400">${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL DERECHO: CARRITO Y CHECKOUT */}
          <div className={`p-4 overflow-y-auto flex flex-col gap-4 ${isManualService ? "w-full" : "md:w-1/2"}`}>
            <div className="flex bg-slate-800 p-1 rounded-lg self-start">
              <button onClick={() => setIsManualService(false)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!isManualService ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>Productos</button>
              <button onClick={() => { setIsManualService(true); setCart([]); setIsScanning(false); }} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isManualService ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>Solo Servicio</button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Cliente</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              >
                <option value="">Selecciona un cliente...</option>
                <option value="Público General">Público General</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {isManualService ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descripción del Servicio</label>
                  <textarea rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="Ej: Mantenimiento correctivo PC..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Costo ($)</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto min-h-[200px] border border-slate-800 rounded-lg bg-slate-900/30">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-4 text-center">
                    <ShoppingCart size={32} className="mb-2 opacity-20" /> Selecciona productos o usa la cámara
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Prod</th>
                        <th className="px-3 py-2 text-center">Cant</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {cart.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-white font-medium">{item.name}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit mx-auto p-0.5">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700">-</button>
                              <span className="font-bold w-6 text-center text-white">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700">+</button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-400 font-bold">${(item.price * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                          <td className="px-1 py-2 text-center">
                            <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 font-medium">Total a Pagar:</span>
                <span className="text-2xl font-bold text-emerald-400">${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
              <button onClick={handleSubmit} disabled={loading} className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? "bg-slate-700 cursor-not-allowed" : isManualService ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"}`}>
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {isManualService ? "Finalizar Servicio" : "Finalizar Venta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}