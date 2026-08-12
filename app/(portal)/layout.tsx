import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/talentlms";
import { readRoles, resolveRole } from "@/lib/roles";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [user, roles] = await Promise.all([getUserById(session.userId), readRoles()]);
  const role = resolveRole(user, roles);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={`${user.first_name} ${user.last_name}`}
        subline={`Level ${user.level ?? 1} · ${Number(user.points ?? 0).toLocaleString()} pts`}
        isAdmin={role !== "learner"}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
