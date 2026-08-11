import { redirect } from "next/navigation";
import { readContent } from "@/lib/contentStore";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/talentlms";
import FramedEmbed from "@/components/FramedEmbed";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { coach } = await readContent();
  let src = coach.embedUrl;
  if (src && coach.passUserEmail) {
    const user = await getUserById(session.userId);
    src += `${src.includes("?") ? "&" : "?"}email=${encodeURIComponent(user.email)}`;
  }

  if (!src) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="text-2xl font-bold text-white">{coach.title}</h1>
        <div className="mt-8 rounded-xl border border-dashed border-ink-700 bg-ink-900 p-10 text-center">
          <p className="text-sm text-slate-400">
            Almost ready — an admin can add the Delphi embed URL in the{" "}
            <a href="/admin/coach" className="text-gold-400 hover:text-gold-500">Admin Console</a> and this
            page becomes the chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 px-8 py-4">
        <h1 className="text-lg font-bold text-white">{coach.title}</h1>
        <p className="text-xs text-slate-400">{coach.description}</p>
      </div>
      <FramedEmbed src={src} title={coach.title} allow="microphone; clipboard-write" label="Waking up Digital Chris…" />
    </div>
  );
}
