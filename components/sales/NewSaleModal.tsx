"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Package,
  Wrench,
  Search,
  ShoppingCart,
  Loader2,
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

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSaleModal({ isOpen, onClose }: NewSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Variables para modo servicio manual
  const [isManualService, setIsManualService] = useState(false);
  const [serviceDescription, setServiceDescription] = useState("");
  const [manualPrice, setManualPrice] = useState<string>("");

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        const q = query(collection(db, "products"), orderBy("name"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Product,
        );
        setProducts(data);
      };
      fetchProducts();
      // Resetear formulario
      setCart([]);
      setClientName("");
      setServiceDescription("");
      setManualPrice("");
      setIsManualService(false);
      setSearchTerm("");
    }
  }, [isOpen]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Sin Stock",
        text: "Este producto no tiene existencias.",
        background: "#1f2937",
        color: "#fff",
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // No exceder stock real
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Si agregamos productos, desactivamos modo manual automáticamente
    setIsManualService(false);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQty: number, maxStock: number) => {
    if (newQty < 1 || newQty > maxStock) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  // Cálculo del total
  const total = isManualService
    ? parseFloat(manualPrice || "0")
    : cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (!clientName.trim())
      return Swal.fire({
        title: "Falta Cliente",
        text: "Ingresa el nombre del cliente",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });

    if (isManualService && !manualPrice)
      return Swal.fire({
        title: "Falta Precio",
        text: "Ingresa el costo del servicio",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });

    if (!isManualService && cart.length === 0)
      return Swal.fire({
        title: "Vacío",
        text: "Agrega productos o activa modo servicio",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
      });

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. PASO DE LECTURA (READS)
        const productUpdates = []; // Aquí guardaremos lo que necesitamos actualizar

        if (!isManualService) {
          for (const item of cart) {
            const productRef = doc(db, "products", item.id);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists())
              throw `El producto ${item.name} no existe.`;

            const currentStock = productDoc.data().stock;
            if (currentStock < item.quantity) {
              throw `Stock insuficiente para ${item.name}. Disponibles: ${currentStock}.`;
            }

            // En lugar de escribir ahora, lo guardamos para el paso de escritura
            productUpdates.push({
              ref: productRef,
              newStock: currentStock - item.quantity,
            });
          }
        }

        // 2. PASO DE ESCRITURA (WRITES)

        // A) Actualizar todos los inventarios leídos
        for (const update of productUpdates) {
          transaction.update(update.ref, {
            stock: update.newStock,
          });
        }

        // B) Crear el reporte de venta/servicio
        const newSaleRef = doc(collection(db, "sales"));
        transaction.set(newSaleRef, {
          clientName,
          date: serverTimestamp(),
          type: isManualService ? "servicio" : "venta",
          items: isManualService
            ? [
                {
                  name: serviceDescription || "Servicio General",
                  price: total,
                  quantity: 1,
                },
              ]
            : cart,
          total: total,
          description: isManualService
            ? serviceDescription
            : "Venta de productos",
        });
      });

      Swal.fire({
        title: "¡Éxito!",
        text: "Operación registrada correctamente.",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* HEADER MODAL */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {isManualService ? (
              <Wrench className="text-emerald-400" />
            ) : (
              <Package className="text-indigo-400" />
            )}
            {isManualService
              ? "Registrar Servicio"
              : "Registrar Venta de Productos"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* PANEL IZQUIERDO: SELECCIÓN DE PRODUCTOS (Solo visible si NO es servicio manual) */}
          {!isManualService && (
            <div className="md:w-1/2 p-4 border-r border-slate-700 overflow-y-auto flex flex-col gap-4 bg-slate-900/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-white">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Stock: {product.stock}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-400">
                      ${product.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL DERECHO: DETALLES DE VENTA / FORMULARIO */}
          <div
            className={`p-4 overflow-y-auto flex flex-col gap-4 ${isManualService ? "w-full" : "md:w-1/2"}`}
          >
            {/* Toggle Tipo */}
            <div className="flex bg-slate-800 p-1 rounded-lg self-start">
              <button
                onClick={() => setIsManualService(false)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!isManualService ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Productos
              </button>
              <button
                onClick={() => {
                  setIsManualService(true);
                  setCart([]);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isManualService ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Solo Servicio
              </button>
            </div>

            {/* Input Cliente */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nombre del Cliente
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Cliente Genérico"
              />
            </div>

            {/* Lógica condicional: TABLA CARRITO o FORMULARIO SERVICIO */}
            {isManualService ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Descripción del Servicio
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Ej: Mantenimiento correctivo PC..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Costo ($)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto min-h-[200px] border border-slate-800 rounded-lg bg-slate-900/30">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-4 text-center">
                    <ShoppingCart size={32} className="mb-2 opacity-20" />
                    Selecciona productos de la lista
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2">Prod</th>
                        <th className="px-3 py-2 text-center">Cant</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-white">{item.name}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                    item.stock,
                                  )
                                }
                                className="text-slate-400 hover:text-white px-1"
                              >
                                -
                              </button>
                              <span className="font-medium w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity + 1,
                                    item.stock,
                                  )
                                }
                                className="text-slate-400 hover:text-white px-1"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-1 py-2 text-center">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TOTAL Y BOTÓN GUARDAR */}
            <div className="mt-auto pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Total a Pagar:</span>
                <span className="text-2xl font-bold text-white">
                  ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                  loading
                    ? "bg-slate-700 cursor-not-allowed"
                    : isManualService
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {isManualService ? "Finalizar Servicio" : "Finalizar Venta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
