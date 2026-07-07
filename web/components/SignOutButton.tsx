import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
