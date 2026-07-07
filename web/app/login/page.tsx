import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-950 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-neutral-100">
          HorrorTales
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Acceso interno del equipo.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
