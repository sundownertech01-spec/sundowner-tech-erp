// app/page.tsx
import LoginForm from "@/components/auth/LoginForm";

export default function Home() {
  return (
    // FONDO MUY OSCURO (bg-slate-950)
    <main className="flex items-center justify-center min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </main>
  );
}
