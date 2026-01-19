// app/applications/[id]/edit/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SubmitButton from "./SubmitButton";

type PageProps = {
  params: Promise<{ id: string }>; // ✅ Next 15
};

export default async function EditApplicationPage({ params }: PageProps) {
  const { id } = await params; // ✅ unwrap the Promise
  const appId = Number(id);

  if (!Number.isFinite(appId)) {
    redirect("/dashboard");
  }

  const application = await prisma.application.findUnique({
    where: { id: appId },
  });

  if (!application) {
    redirect("/dashboard");
  }

  async function updateApplication(formData: FormData) {
    "use server";

    const company = String(formData.get("company") || "").trim();
    const role = String(formData.get("role") || "").trim();
    const status = String(formData.get("status") || "APPLIED");
    const locationRaw = String(formData.get("location") || "").trim();
    const jobUrlRaw = String(formData.get("jobUrl") || "").trim();

    await prisma.application.update({
      where: { id: appId },
      data: {
        company,
        role,
        status: status as any,
        location: locationRaw.length ? locationRaw : null,
        jobUrl: jobUrlRaw.length ? jobUrlRaw : null,
      },
    });

    // ✅ refresh any pages that read from DB on the server
    revalidatePath("/dashboard");
    revalidatePath("/kanban");

    // ✅ go to dashboard and trigger ToastBridge
    redirect("/dashboard?toast=updated");
  }

  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(900px,92vw)] py-10">
        <section className="relative grid gap-5">
          <div className="hero-glow" aria-hidden="true" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Edit Application
              </h1>
              <p className="mt-2 text-white/70">
                Update the details for {application.company} — {application.role}
              </p>
            </div>

            <div className="flex gap-3">
              <Link className="btn-glass btn-ghost" href={`/applications/${application.id}`}>
                Back
              </Link>
              <Link className="btn-glass btn-ghost" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card__glow" aria-hidden="true" />

            <form action={updateApplication} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-white/70" htmlFor="company">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  defaultValue={application.company}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-white/70" htmlFor="role">
                  Role
                </label>
                <input
                  id="role"
                  name="role"
                  defaultValue={application.role}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  required
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/70" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={application.status}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm text-white/70" htmlFor="location">
                    Location (optional)
                  </label>
                  <input
                    id="location"
                    name="location"
                    defaultValue={application.location ?? ""}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                    placeholder="Remote / Charlotte, NC"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-white/70" htmlFor="jobUrl">
                  Job URL (optional)
                </label>
                <input
                  id="jobUrl"
                  name="jobUrl"
                  defaultValue={application.jobUrl ?? ""}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {/* ✅ pending state + spinner */}
                <SubmitButton />

                {/* ✅ you asked cancel to go back to dashboard */}
                <Link className="btn-glass btn-ghost" href="/dashboard">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
