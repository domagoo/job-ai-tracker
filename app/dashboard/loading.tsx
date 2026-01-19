// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {/* Header skeleton */}
        <section className="relative grid gap-4">
          <div className="hero-glow" aria-hidden="true" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
              <div className="skeleton h-9 w-44" />
              <div className="skeleton h-4 w-[min(520px,70vw)]" />
            </div>

            <div className="flex gap-3">
              <div className="skeleton h-10 w-40 rounded-full" />
              <div className="skeleton h-10 w-32 rounded-full" />
              <div className="skeleton h-10 w-40 rounded-full" />
            </div>
          </div>
        </section>

        {/* Content skeleton */}
        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* Recent applications */}
          <div className="glass-card lg:col-span-2">
            <div className="glass-card__glow" aria-hidden="true" />
            <div className="skeleton h-6 w-56" />

            <div className="mt-5 grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="feature">
                  <div className="flex items-center justify-between gap-2">
                    <div className="skeleton h-5 w-[60%]" />
                    <div className="skeleton h-6 w-20 rounded-full" />
                  </div>
                  <div className="mt-3 grid gap-2">
                    <div className="skeleton h-4 w-[45%]" />
                    <div className="skeleton h-4 w-[35%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass-card">
            <div className="glass-card__glow alt" aria-hidden="true" />
            <div className="skeleton h-6 w-44" />

            <div className="mt-4 grid gap-3">
              <div className="skeleton h-11 w-full rounded-full" />
              <div className="skeleton h-11 w-full rounded-full" />
              <div className="skeleton h-11 w-full rounded-full" />
            </div>

            <div className="mt-6 skeleton h-24 w-full rounded-xl" />
          </div>
        </section>
      </div>
    </main>
  );
}
