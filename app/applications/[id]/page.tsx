// app/applications/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteConfirmButton from "./DeleteConfirmButton";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type PageProps = {
  // works whether Next gives params as an object or Promise in your version
  params: { id: string } | Promise<{ id: string }>;
};

export default async function ApplicationDetailsPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isFinite(id)) {
    return (
      <main className="min-h-dvh text-white">
        <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
        <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

        <div className="mx-auto w-[min(900px,92vw)] py-10">
          <div className="glass-card">
            <div className="glass-card__glow" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold">Invalid Application ID</h1>
            <p className="mt-2 text-white/70">That link doesn’t look right.</p>

            <div className="mt-6">
              <Link className="btn-glass btn-ghost" href="/dashboard">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const application = await prisma.application.findUnique({
    where: { id },
  });

  if (!application) {
    return (
      <main className="min-h-dvh text-white">
        <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
        <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

        <div className="mx-auto w-[min(900px,92vw)] py-10">
          <div className="glass-card">
            <div className="glass-card__glow" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold">Not Found</h1>
            <p className="mt-2 text-white/70">
              We couldn’t find an application with ID {id}.
            </p>

            <div className="mt-6 flex gap-3">
              <Link className="btn-glass btn-ghost" href="/dashboard">
                Back to Dashboard
              </Link>
              <Link className="btn-glass btn-ghost" href="/applications/new">
                Add Application
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ✅ take the id out so the server action never touches a possibly-null object
  const appId = application.id;

  async function deleteApplication() {
    "use server";

    await prisma.application.delete({ where: { id: appId } });

    // update any server-rendered pages if you have them
    revalidatePath("/dashboard");
    revalidatePath("/kanban");

    // ✅ navigate away + trigger toast
    redirect("/dashboard?toast=deleted");
  }

  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(900px,92vw)] py-10">
        <section className="relative grid gap-5">
          <div className="hero-glow" aria-hidden="true" />

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {application.company} — {application.role}
              </h1>
              <p className="mt-2 text-white/70">
                Status:{" "}
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
                  {application.status}
                </span>
              </p>
            </div>

            {/* Keep your header buttons */}
            <div className="flex gap-3">
              <Link className="btn-glass btn-ghost" href="/dashboard">
                Back
              </Link>
              <Link className="btn-glass btn-ghost" href="/kanban">
                Kanban
              </Link>
              <Link className="btn-glass" href="/applications/new">
                Add Application
              </Link>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card__glow" aria-hidden="true" />

            <div className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-white/60">Company</div>
                <div className="text-lg font-semibold">{application.company}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-white/60">Role</div>
                <div className="text-lg font-semibold">{application.role}</div>
              </div>

              <div className="grid gap-1 sm:grid-cols-2 sm:gap-6">
                <div className="grid gap-1">
                  <div className="text-sm text-white/60">Location</div>
                  <div className="text-base">{application.location ?? "Not set"}</div>
                </div>

                <div className="grid gap-1">
                  <div className="text-sm text-white/60">Job URL</div>
                  {application.jobUrl ? (
                    <a
                      className="text-base underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
                      href={application.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open link
                    </a>
                  ) : (
                    <div className="text-base">Not set</div>
                  )}
                </div>
              </div>

              <div className="grid gap-1 sm:grid-cols-2 sm:gap-6">
                <div className="grid gap-1">
                  <div className="text-sm text-white/60">Created</div>
                  <div className="text-base">
                    {new Date(application.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="grid gap-1">
                  <div className="text-sm text-white/60">Updated</div>
                  <div className="text-base">
                    {new Date(application.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Actions - keep all your buttons */}
              <div className="mt-2 flex flex-wrap gap-3">
                <Link className="btn-glass btn-ghost" href="/dashboard">
                  Back to Dashboard
                </Link>

                <Link className="btn-glass btn-ghost" href="/kanban">
                  View in Kanban
                </Link>

                <Link className="btn-glass" href={`/applications/${application.id}/edit`}>
                  Edit
                </Link>

                <DeleteConfirmButton action={deleteApplication} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
