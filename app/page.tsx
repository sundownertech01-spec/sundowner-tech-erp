// app/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main 
      className="relative flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 bg-slate-950"
      // MAGIA AQUÍ: Cargamos la imagen de fondo
      style={{
        backgroundImage: "url('/fondo-login.jpg')", // <-- Nombre de tu imagen
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* CAPA OSCURA: 85% opacidad del color oscuro del ERP + ligero desenfoque */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"></div>

      {/* FORMULARIO: Z-10 asegura que quede por encima de la capa oscura */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <LoginForm />
      </div>
    </main>
  );
}