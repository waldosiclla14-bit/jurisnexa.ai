import { AcceptInvitation } from '@/components/firm/AcceptInvitation';

export const instant = false;

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <span className="text-xl font-bold text-white">
            JurisNexa<span className="text-emerald-400">.ai</span>
          </span>
        </div>
      </header>
      <AcceptInvitation token={token} />
    </main>
  );
}