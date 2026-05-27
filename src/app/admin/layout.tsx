import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { logoutAdmin } from "@/actions/admin";

const NAV = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/emprendimientos", label: "Emprendimientos" },
  { href: "/admin/necesidades", label: "Necesidades" },
  { href: "/admin/familias", label: "Familias" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/campanas", label: "Campañas" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/cuenta", label: "Cuenta" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session.adminId) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto px-4 py-6">
      <aside className="md:w-56 flex-shrink-0">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] mb-4">
          Admin
        </p>
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm px-3 py-2 rounded-md hover:bg-[var(--color-border)]/40 whitespace-nowrap"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin} className="mt-4">
          <button
            type="submit"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] px-3 py-2"
          >
            Cerrar sesión ({session.email})
          </button>
        </form>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
