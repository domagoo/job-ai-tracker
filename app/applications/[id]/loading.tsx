// app/applications/[id]/loading.tsx
export default function ApplicationDetailsLoading() {
  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(900px,92vw)] py-10">
        <section className="relative grid gap-5">
          <div className="hero-glow" aria-hidden="true" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
              <div className="skeleton h-9 w-[min(520px,80vw)]" />
              <div className="skeleton h-4 w-56" />
            </div>

            <div className="flex gap-3">
              <div className="skeleton h-10 w-24 rounded-full" />
              <div className="skeleton h-10 w-24 rounded-full" />
              <div className="skeleton h-10 w-40 rounded-full" />
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card__glow" aria-hidden="true" />

            <div className="grid gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid gap-2">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-6 w-[70%]" />
                </div>
              ))}

              <div className="mt-2 flex flex-wrap gap-3">
                <div className="skeleton h-10 w-44 rounded-full" />
                <div className="skeleton h-10 w-36 rounded-full" />
                <div className="skeleton h-10 w-24 rounded-full" />
                <div className="skeleton h-10 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
