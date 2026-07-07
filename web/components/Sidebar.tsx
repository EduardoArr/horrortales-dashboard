import { NavItem } from "./NavItem";
import { SignOutButton } from "./SignOutButton";

const NAV_ITEMS = [
  { href: "/outliers", label: "Buscador de ideas" },
  { href: "/contabilidad", label: "Contabilidad" },
  { href: "/titulos-miniaturas", label: "Títulos y miniaturas" },
  { href: "/guiones", label: "Guiones" },
];

export function Sidebar({ userName }: { userName: string }) {
  return (
    <aside className="flex h-screen w-60 flex-col justify-between border-r border-neutral-800 bg-neutral-950 p-4">
      <div>
        <div className="mb-6 px-2">
          <h1 className="text-lg font-semibold text-neutral-100">
            HorrorTales
          </h1>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} href={item.href}>
              {item.label}
            </NavItem>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 border-t border-neutral-800 pt-4">
        <span className="truncate px-2 text-xs text-neutral-500">
          {userName}
        </span>
        <SignOutButton />
      </div>
    </aside>
  );
}
