// components/sales/NewSaleModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Trash2,
  Save,
  Package,
  Wrench,
  Search,
  ShoppingCart,
  Loader2,
  Barcode,
  CameraOff,
  AlertTriangle,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  runTransaction,
  doc,
  serverTimestamp,
} from "firebase/firestore";
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
  const [activeTab, setActiveTab] = useState<"products" | "services">(
    "products",
  );

  // --- ESTADOS PARA LA CÁMARA ---
  const [isScanning, setIsScanning] = useState(false);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  // --- LÓGICA DEL ESCÁNER ---
  const { ref: videoRef } = useZxing({
    paused: !isScanning,
    constraints: {
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    onDecodeResult(result) {
      if (activeTab !== "products") return; // Solo escanea si estamos en la pestaña productos

      const code = result.getText();
      const now = Date.now();

      if (
        lastScannedRef.current &&
        lastScannedRef.current.code === code &&
        now - lastScannedRef.current.time < 2000
      )
        return;

      lastScannedRef.current = { code, time: now };
      const foundProduct = products.find(
        (p) => p.sku === code || p.id === code,
      );

      if (foundProduct) {
        addProductToCart(foundProduct);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Agregado: ${foundProduct.name}`,
          showConfirmButton: false,
          timer: 1500,
          background: "#1f2937",
          color: "#fff",
        });
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: `Desconocido: ${code}`,
          showConfirmButton: false,
          timer: 1500,
          background: "#1f2937",
          color: "#fff",
        });
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
          getDocs(query(collection(db, "services"), orderBy("name"))),
        ]);

        setProducts(
          productsSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Product,
          ),
        );
        setClients(
          clientsSnap.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          })),
        );
        setServices(
          servicesSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Service,
          ),
        );
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
    if (product.stock <= 0)
      return Swal.fire({
        icon: "error",
        title: "Sin Stock",
        text: "Este producto no tiene existencias.",
        background: "#1f2937",
        color: "#fff",
      });

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.type === "product",
      );
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.id === product.id && item.type === "product"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          type: "product",
          stock: product.stock,
        },
      ];
    });
  };

  // AGREGAR SERVICIO AL CARRITO
  const addServiceToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === service.id && item.type === "service",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === service.id && item.type === "service"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: service.id,
          name: service.name,
          price: service.price,
          quantity: 1,
          type: "service",
          allowsExternal: service.allowsExternalMaterial,
          externalSurcharge: service.externalMaterialSurcharge,
          hasExternal: false,
        },
      ];
    });
  };

  const removeFromCart = (id: string, type: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === id && item.type === type)),
    );
  };

  const updateQuantity = (
    id: string,
    type: string,
    newQty: number,
    maxStock?: number,
  ) => {
    if (newQty < 1) return;
    if (type === "product" && maxStock && newQty > maxStock) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.type === type
          ? { ...item, quantity: newQty }
          : item,
      ),
    );
  };

  // TOGGLE PARA MATERIAL EXTERNO
  const toggleExternalMaterial = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "service"
          ? { ...item, hasExternal: !item.hasExternal }
          : item,
      ),
    );
  };

  // CÁLCULO DEL TOTAL INTELIGENTE
  const total = cart.reduce((acc, item) => {
    const itemPrice =
      item.type === "service" && item.hasExternal
        ? item.price + (item.externalSurcharge || 0)
        : item.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  const handleSubmit = async () => {
    if (!clientName.trim())
      return Swal.fire({
        title: "Falta Cliente",
        text: "Selecciona un cliente.",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });
    if (cart.length === 0)
      return Swal.fire({
        title: "Vacío",
        text: "Agrega al menos un producto o servicio.",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        // SOLO descontamos stock de los items tipo "product"
        for (const item of cart) {
          if (item.type === "product") {
            const productRef = doc(db, "products", item.id);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists())
              throw `El producto ${item.name} no existe.`;
            const currentStock = productDoc.data().stock;
            if (currentStock < item.quantity)
              throw `Stock insuficiente para ${item.name}.`;
            productUpdates.push({
              ref: productRef,
              newStock: currentStock - item.quantity,
            });
          }
        }

        for (const update of productUpdates) {
          transaction.update(update.ref, { stock: update.newStock });
        }

        // Determinar qué tipo de ticket es
        const hasProducts = cart.some((i) => i.type === "product");
        const hasServices = cart.some((i) => i.type === "service");
        const ticketType =
          hasProducts && hasServices
            ? "mixto"
            : hasServices
              ? "servicio"
              : "venta";

        const newSaleRef = doc(collection(db, "sales"));
        transaction.set(newSaleRef, {
          clientName,
          date: serverTimestamp(),
          type: ticketType,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            //Suma de precio
            price:
              item.type === "service" && item.hasExternal
                ? item.price + (item.externalSurcharge || 0)
                : item.price,
            hasExternal: item.hasExternal || false,
          })),
          total: total,
          description: `Ticket ${ticketType} desde PDV`,
        });
      });

      Swal.fire({
        title: "¡Éxito!",
        text: "Ticket generado correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#1f2937",
        color: "#fff",
      });
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: typeof error === "string" ? error : "Error al procesar la venta.",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full h-full md:h-auto md:rounded-xl border border-slate-700 md:max-w-6xl md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* CABECERA: Más compacta en móvil */}
        <div className="p-3 md:p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-indigo-400" size={20} />{" "}
            <span className="hidden xs:inline">Punto de Venta</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* PANEL IZQUIERDO: CATÁLOGOS (Ocupa el 50% de la pantalla en móvil) */}
          <div className="h-[45%] md:h-auto md:w-[45%] p-3 md:p-4 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col gap-3 bg-slate-900/50">
            <div className="flex bg-slate-800 p-1 rounded-lg shrink-0">
              <button
                onClick={() => {
                  setActiveTab("products");
                  setIsScanning(false);
                  setSearchTerm("");
                }}
                className={`flex items-center justify-center gap-2 flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === "products" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400"}`}
              >
                <Package size={14} /> Productos
              </button>
              <button
                onClick={() => {
                  setActiveTab("services");
                  setIsScanning(false);
                  setSearchTerm("");
                }}
                className={`flex items-center justify-center gap-2 flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === "services" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400"}`}
              >
                <Wrench size={14} /> Servicios
              </button>
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {activeTab === "products" && (
                <button
                  onClick={() => setIsScanning(!isScanning)}
                  className={`p-2 rounded-lg border ${isScanning ? "bg-rose-500/20 text-rose-400 border-rose-500/50" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                >
                  {isScanning ? <CameraOff size={18} /> : <Barcode size={18} />}
                </button>
              )}
            </div>
            {/* LISTA DE RESULTADOS: Scroll independiente */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {activeTab === "products"
                ? filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addProductToCart(product)}
                      className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 active:bg-slate-700 transition-all flex justify-between items-center group"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-200 text-xs md:text-sm leading-tight">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Stock: {product.stock}
                        </div>
                      </div>
                      <div className="font-black text-indigo-400 text-sm ml-2">
                        ${product.price}
                      </div>
                    </div>
                  ))
                : filteredServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => addServiceToCart(service)}
                      className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 active:bg-slate-700 transition-all flex justify-between items-center"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-slate-200 text-xs md:text-sm leading-tight">
                          {service.name}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase mt-0.5">
                          {service.cutType}
                        </div>
                      </div>
                      <div className="font-black text-emerald-400 text-sm">
                        ${service.price}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          {/* PANEL DERECHO: CARRITO (Ocupa el resto de la pantalla) */}
          <div className="flex-1 p-3 md:p-4 flex flex-col gap-3 bg-slate-950 overflow-hidden">
            <div className="shrink-0 flex gap-2">
              <select
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white text-xs outline-none"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              >
                <option value="">Cliente...</option>
                <option value="Público General">Público General</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TABLA DEL CARRITO: Scroll independiente */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-lg bg-slate-900">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-800 text-slate-400 text-[9px] uppercase font-bold sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="px-2 py-2">Item</th>
                    <th className="px-1 py-2 text-center w-20">Cant</th>
                    <th className="px-2 py-2 text-right">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {cart.map((item) => (
                    <tr
                      key={`${item.id}-${item.type}`}
                      className="bg-slate-900/50"
                    >
                      <td className="px-2 py-2">
                        <div className="text-white font-bold truncate max-w-[120px] md:max-w-none">
                          {item.name}
                        </div>
                        {item.type === "service" && item.allowsExternal && (
                          <button
                            onClick={() => toggleExternalMaterial(item.id)}
                            className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded border ${item.hasExternal ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "text-slate-500 border-slate-800"}`}
                          >
                            Eq. Externo
                          </button>
                        )}
                      </td>
                      <td className="px-1 py-2">
                        <div className="flex items-center justify-center gap-1 bg-slate-950 rounded border border-slate-800 p-0.5">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.type,
                                item.quantity - 1,
                                item.stock,
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-white bg-slate-800 rounded"
                          >
                            -
                          </button>
                          <span className="font-bold min-w-[15px] text-center text-[10px]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.type,
                                item.quantity + 1,
                                item.stock,
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-white bg-slate-800 rounded"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-white">
                        $
                        {(
                          (item.type === "service" && item.hasExternal
                            ? item.price + (item.externalSurcharge || 0)
                            : item.price) * item.quantity
                        ).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-center">
                        <button
                          onClick={() => removeFromCart(item.id, item.type)}
                          className="p-1.5 text-rose-500 active:bg-rose-500/20 rounded-md"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL Y COBRAR: Fijado abajo */}
            <div className="shrink-0 space-y-2">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-lg">
                <span className="text-slate-400 font-bold uppercase text-[10px]">
                  Total:
                </span>
                <span className="text-xl font-black text-white">
                  ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${loading ? "bg-slate-700" : "bg-indigo-600 shadow-indigo-500/20"}`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                Cerrar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
