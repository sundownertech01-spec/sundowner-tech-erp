// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // Importamos las alertas

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Alerta de Éxito con Estilo
      Swal.fire({
        title: "¡Bienvenido!",
        text: "Iniciando sistema...",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: "#1f2937", // Fondo oscuro alerta
        color: "#fff", // Texto blanco
      }).then(() => {
        // Redirige al Dashboard después de la alerta
        router.push("/dashboard");
      });
    } catch (error: any) {
      console.error("Error:", error.code);

      let mensajeError = "Ocurrió un error inesperado.";
      if (error.code === "auth/invalid-credential")
        mensajeError = "Correo o contraseña incorrectos.";
      if (error.code === "auth/too-many-requests")
        mensajeError = "Cuenta bloqueada temporalmente por muchos intentos.";

      // Alerta de Error con Estilo
      Swal.fire({
        title: "Error de Acceso",
        text: mensajeError,
        icon: "error",
        confirmButtonText: "Intentar de nuevo",
        confirmButtonColor: "#d33",
        background: "#1f2937",
        color: "#fff",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // TARJETA OSCURA (bg-slate-900)
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-xl shadow-2xl border border-slate-800">
      
      {/* SECCIÓN DEL LOGO Y BIENVENIDA */}
      <div className="flex flex-col items-center mb-8">
        {/* CONTENEDOR DEL LOGO CIRCULAR */}
        <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-slate-800 flex items-center justify-center p-1">
          <img 
            src="/logo.png" // <-- Asegúrate de que tu logo se llame así en la carpeta /public
            alt="Sundowner Tech Logo" 
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-slate-400">Ingresa a tu cuenta de Sundowner ERP</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* INPUT CORREO */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Correo electrónico
          </label>
          <div>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Correo inválido",
                },
              })}
              // CLASES DE MODO OSCURO PARA EL INPUT
              className={`block w-full px-4 py-3 bg-slate-800/50 border ${errors.email ? "border-red-500" : "border-slate-700"} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
              placeholder="admin@sundowner.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.email.message as string}
              </p>
            )}
          </div>
        </div>

        {/* INPUT CONTRASEÑA */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Contraseña
          </label>
          <div>
            <input
              id="password"
              type="password"
              {...register("password", {
                required: "La contraseña es obligatoria",
              })}
              className={`block w-full px-4 py-3 bg-slate-800/50 border ${errors.password ? "border-red-500" : "border-slate-700"} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.password.message as string}
              </p>
            )}
          </div>
        </div>

        {/* BOTÓN NEÓN */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              "Entrar al Sistema"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}