import { redirect } from "next/navigation";
import AdminTabs from "@/components/AdminTabs";
import { getSession } from "@/lib/session";
import { getRoleForUserId } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = await getRoleForUserId(session.userId);
  if (role === "learner") redirect("/home");

  return (
    <div>
      <div className="border-b border-ink-800 bg-ink-900/60 px-8 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
          Admin Console
          {role === "manager" && (
            <span className="ml-2 rounded-full bg-ink-700 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-300">
              Manager access
            </span>
          )}
        </p>
        <AdminTabs showPeople={role === "admin"} />
      </div>
      {children}
    </div>
  );
}
