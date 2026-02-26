// app/dashboard/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Edit, Trash2, Loader2, ShieldCheck, Mail } from "lucide-react";
import UserModal from "@/components/users/UserModal";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersArray: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        usersArray.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(usersArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const result = await Swal.fire({
        title: '¿Revocar acceso?',
        text: `Se eliminará el usuario "${name}" del sistema.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#374151',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        background: '#1f2937', color: '#fff'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "users", id));
        Swal.fire({ title: '¡Eliminado!', text: 'Registro borrado de Firestore', icon: 'success', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-500" /> Control de Accesos
          </h2>
          <p className="text-sm text-slate-400">Gestiona quién puede entrar al ERP y sus permisos.</p>
        </div>
        <button onClick={() => { setUserToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 w-full sm:w-auto justify-center">
          <UserPlus size={20} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input type="text" placeholder="Buscar por nombre o correo..." className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        
        {isLoading && (<div className="p-12 flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" /><p>Cargando usuarios...</p></div>)}
        {!isLoading && filteredUsers.length === 0 && (<div className="p-12 text-center text-slate-400">No hay usuarios registrados aún.</div>)}

        {/* --- VISTA PARA PC --- */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Rol</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Mail size={12} /> {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* NUEVOS COLORES PARA LOS ROLES */}
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        user.role === 'Administrador' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        user.role === 'Practicante' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20' // Invitado (Gris)
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setUserToEdit(user); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(user.id, user.name)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VISTA PARA MÓVIL --- */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="md:hidden divide-y divide-slate-800">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white leading-tight">{user.name}</h4>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                        user.role === 'Administrador' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        user.role === 'Practicante' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                    <button onClick={() => { setUserToEdit(user); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md"><Edit className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button onClick={() => handleDelete(user.id, user.name)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail size={12} /> <span className="truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${user.status === 'Activo' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {user.status === 'Activo' ? '● Activo' : '● Suspendido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 md:px-6 py-3 border-t border-slate-800 bg-slate-800/20 text-xs text-slate-400 flex justify-between items-center">
          <span>{filteredUsers.length} usuarios registrados</span>
        </div>
      </div>

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={userToEdit} />
    </div>
  );
}