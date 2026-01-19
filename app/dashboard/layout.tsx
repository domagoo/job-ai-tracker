// app/dashboard/layout.tsx
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh text-white">
      {/* Background layers (same glass theme) */}
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {children}
      </div>
    </main>
  );
}
