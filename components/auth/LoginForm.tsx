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
      <div className="text-center">
        {/* TÍTULO BLANCO */}
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          SundownerTech ERP
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Inicia sesión para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* INPUT CORREO */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300"
          >
            Correo electrónico
          </label>
          <div className="mt-1">
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
              className={`block w-full px-4 py-3 bg-slate-800 border ${errors.email ? "border-red-500" : "border-slate-700"} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
              placeholder="admin@sundowner.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">
                {errors.email.message as string}
              </p>
            )}
          </div>
        </div>

        {/* INPUT CONTRASEÑA */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300"
          >
            Contraseña
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              {...register("password", {
                required: "La contraseña es obligatoria",
              })}
              className={`block w-full px-4 py-3 bg-slate-800 border ${errors.password ? "border-red-500" : "border-slate-700"} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">
                {errors.password.message as string}
              </p>
            )}
          </div>
        </div>

        {/* BOTÓN NEÓN */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
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
                Conectando...
              </span>
            ) : (
              "Entrar al Sistema"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
