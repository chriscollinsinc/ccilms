/**
 * EXPERIMENT: render TalentLMS inside the portal shell (sidebar stays).
 * Works only if the browser sends the TalentLMS session cookie inside a
 * cross-site iframe — expected to work reliably once both apps share a
 * custom domain (portal.x.com + learn.x.com), tested here for localhost.
 */
export default function FrameTest() {
  const domain = process.env.TALENTLMS_DOMAIN ?? "";
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 bg-ink-900 px-6 py-2 text-xs text-slate-500">
        iframe test — TalentLMS dashboard rendered inside the portal
      </div>
      <iframe
        src={`https://${domain}.talentlms.com/plus/dashboard`}
        title="TalentLMS"
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
