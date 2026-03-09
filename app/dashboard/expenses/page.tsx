// app/dashboard/expenses/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Wallet, Filter, ChevronLeft, ChevronRight, TrendingDown } from "lucide-react";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface Expense {
  id: string;
  concept: string;
  amount: number;
  category: string;
  date: any;
}

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Búsqueda y Paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expensesArray: Expense[] = [];
      querySnapshot.forEach((doc) => {
        expensesArray.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(expensesArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, concept: string) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar registro?',
        text: `Se borrará el gasto de "${concept}".`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        background: '#1f2937', color: '#fff'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "expenses", id));
        Swal.fire({ title: '¡Eliminado!', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const formatSafeDate = (dateObj: any) => {
    if (!dateObj) return "Sin fecha";
    if (typeof dateObj.toDate === 'function') {
      return dateObj.toDate().toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric' });
    }
    try {
      return new Date(dateObj).toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Filtrado
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.concept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Todas" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Paginación
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  // Calcular el total de los gastos que se están mostrando actualmente en pantalla (para análisis rápido)
  const totalFilteredAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* HEADER Y TARJETA DE RESUMEN */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-rose-500" /> Caja Chica y Gastos
          </h2>
          <p className="text-sm text-slate-400">Control de salidas de dinero, viáticos y compras operativas.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Tarjeta de Total */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-2.5 flex items-center gap-4 w-full sm:w-auto shadow-lg">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Filtrado</p>
              <p className="text-lg font-bold text-white">${totalFilteredAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-lg shadow-rose-500/20 w-full sm:w-auto justify-center">
            <Plus size={20} />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar gasto por concepto..." 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-colors" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <select 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-colors appearance-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="Todas">Todas las Categorías</option>
            <option value="Transporte y Gasolina">Transporte y Gasolina</option>
            <option value="Viáticos y Comidas">Viáticos y Comidas</option>
            <option value="Materiales y Consumibles">Materiales y Consumibles</option>
            <option value="Pago a Proveedores">Pago a Proveedores</option>
            <option value="Mantenimiento de Equipo">Mantenimiento de Equipo</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {isLoading && (<div className="p-12 flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" /><p>Cargando gastos...</p></div>)}
        {!isLoading && filteredExpenses.length === 0 && (<div className="p-12 text-center text-slate-400">No hay salidas de dinero registradas.</div>)}

        {/* VISTA PC */}
        {!isLoading && filteredExpenses.length > 0 && (
          <div className="hidden md:block overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Concepto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Categoría</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Monto</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatSafeDate(expense.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-white truncate max-w-[250px]">{expense.concept}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{expense.category}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-400">
                      -${expense.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setExpenseToEdit(expense); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(expense.id, expense.concept)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VISTA MÓVIL */}
        {!isLoading && filteredExpenses.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800 min-h-[300px]">
            {paginatedExpenses.map((expense) => (
              <div key={expense.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white leading-tight">{expense.concept}</h4>
                    <span className="text-xs text-slate-500 block mt-0.5">{formatSafeDate(expense.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 shrink-0">
                    <button onClick={() => { setExpenseToEdit(expense); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md"><Edit className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button onClick={() => handleDelete(expense.id, expense.concept)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">{expense.category}</span>
                  <span className="text-sm font-bold text-rose-400">-${expense.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINACIÓN */}
        {!isLoading && filteredExpenses.length > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} de {filteredExpenses.length} registros</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /> Anterior</button>
              <div className="text-xs font-bold text-white px-3 py-1.5 bg-rose-600 rounded-lg shadow-lg">{currentPage} / {totalPages || 1}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Siguiente <ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} expenseToEdit={expenseToEdit} />
    </div>
  );
}