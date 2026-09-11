export default function CompanyLoading() {
  return <main className="min-h-screen bg-background"><div className="h-18 border-b border-border bg-surface" /><div className="mx-auto max-w-6xl animate-pulse px-5 py-12 sm:px-8"><div className="h-4 w-36 rounded bg-surface-muted" /><div className="mt-4 h-12 w-96 max-w-full rounded bg-surface-muted" /><div className="mt-8 h-32 rounded-3xl bg-surface" /><div className="mt-8 grid gap-5 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-96 rounded-3xl bg-surface" />)}</div></div></main>;
}
