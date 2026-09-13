export function DarkCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-4 text-left ${className ?? ''}`}>
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      {children}
    </div>
  );
}
