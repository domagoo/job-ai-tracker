// app/ai-review/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

type Application = {
  id: number;
  company: string;
  role: string;
  status: Status;
  location: string | null;
  jobUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReviewSections = {
  strengths: string[];
  risks: string[];
  nextSteps: string[];
  recruiterSummary: string;
  tailoredPitch: string;
};

type ReviewResponse = {
  application: Application;
  reviewText: string | null;
  sections: ReviewSections | null;
  error?: string;
};

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill !py-0.5 !px-2 text-[11px]">{children}</span>;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="feature mirror-card">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-white/85">{title}</div>
        <Pill>{items.length}</Pill>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-white/75 list-disc pl-5">
        {items.map((x, i) => (
          <li key={`${title}_${i}`}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AIReviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [selectedId, setSelectedId] = useState<number | "">("");
  const [generating, setGenerating] = useState(false);

  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/applications", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        setApps(Array.isArray(json) ? json : []);
      })
      .catch(() => {
        if (!mounted) return;
        setApps([]);
      })
      .finally(() => mounted && setLoadingApps(false));

    return () => {
      mounted = false;
    };
  }, []);

  const selectedApp = useMemo(() => {
    if (selectedId === "") return null;
    return apps.find((a) => a.id === selectedId) || null;
  }, [apps, selectedId]);

  async function generateReview() {
    setError(null);
    setResult(null);

    if (selectedId === "") {
      setError("Pick an application first.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: selectedId }),
      });

      const json = (await res.json()) as ReviewResponse;

      if (!res.ok) {
        setError((json as any)?.error || "Failed to generate review.");
        return;
      }

      setResult(json);
    } catch (e: any) {
      setError(e?.message || "Failed to generate review.");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {
      // fall through
    }

    // Fallback (older browsers)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  return (
    <main className="min-h-dvh text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-app" />
      <div className="fixed inset-0 -z-10 bg-overlay" />

      <div className="mx-auto w-[min(1200px,92vw)] py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Application Review</h1>
            <p className="mt-1 text-white/65">
              Recruiter-friendly strengths, risks, and next actions for each application.
            </p>
          </div>

          <Link className="btn-glass btn-ghost" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[420px_1fr]">
          {/* Left: selector */}
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Select application</h2>
              <Pill>{loadingApps ? "Loading" : `${apps.length}`}</Pill>
            </div>

            <div className="mt-4">
              <label htmlFor="aiReviewSelect" className="text-sm text-white/70">
                Application
              </label>

              <select
                id="aiReviewSelect"
                className="select-glass mt-2 w-full"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingApps}
              >
                <option value="">Select…</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.company} — {a.role} ({a.status})
                  </option>
                ))}
              </select>

              <div className="mt-3 text-sm text-white/60">
                {selectedApp ? (
                  <>
                    <div className="font-semibold text-white/80">
                      {selectedApp.company} — {selectedApp.role}
                    </div>
                    <div className="mt-1">
                      <span className="text-white/60">Status:</span>{" "}
                      <span className="text-white/80">{selectedApp.status}</span>
                    </div>
                  </>
                ) : (
                  <span>Choose one to generate a review.</span>
                )}
              </div>

              <button
                className="btn-glass mt-4 w-full disabled:opacity-50"
                onClick={generateReview}
                disabled={generating || selectedId === ""}
              >
                {generating ? "Generating…" : "Generate Review"}
              </button>

              {error ? (
                <div className="mt-3 feature mirror-card">
                  <div className="text-sm text-white/80 font-semibold">Error</div>
                  <div className="mt-1 text-sm text-white/70">{error}</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: output */}
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">Output</h2>
                <div className="text-sm text-white/60 mt-1">
                  Generates a PM-level review you can act on immediately.
                </div>
              </div>
              <Pill>{result ? "Ready" : "Not generated"}</Pill>
            </div>

            {!result ? (
              <div className="mt-4 feature mirror-card">
                <div className="text-sm text-white/70 font-semibold">Pick an application</div>
                <div className="mt-1 text-sm text-white/60">
                  Select an application on the left, then click{" "}
                  <span className="text-white/80">Generate Review</span>.
                </div>
              </div>
            ) : result.sections ? (
              <div className="mt-4 grid gap-4">
                <div className="feature mirror-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold text-white/85">Recruiter Summary</div>
                    <button
                      className="btn-glass btn-ghost !py-2"
                      onClick={() => copy(result.sections!.recruiterSummary)}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-white/75 leading-relaxed">
                    {result.sections.recruiterSummary}
                  </p>
                </div>

                <div className="feature mirror-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold text-white/85">Tailored Pitch (paste-ready)</div>
                    <button
                      className="btn-glass btn-ghost !py-2"
                      onClick={() => copy(result.sections!.tailoredPitch)}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-white/75 leading-relaxed">
                    {result.sections.tailoredPitch}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Section title="Strengths" items={result.sections.strengths} />
                  <Section title="Risks / Gaps" items={result.sections.risks} />
                  <Section title="Next Steps" items={result.sections.nextSteps} />
                </div>
              </div>
            ) : (
              <div className="mt-4 feature mirror-card">
                <div className="text-sm text-white/70 font-semibold">Raw output</div>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                  {result.reviewText || "No output."}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
