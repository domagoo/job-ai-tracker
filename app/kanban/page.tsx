// app/kanban/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Status = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

type Application = {
  id: number;
  company: string;
  role: string;
  status: Status;
  location: string | null;
  order: number;
};

const COLUMNS: { key: Status; title: string }[] = [
  { key: "APPLIED", title: "Applied" },
  { key: "INTERVIEW", title: "Interview" },
  { key: "OFFER", title: "Offer" },
  { key: "REJECTED", title: "Rejected" },
];

/* ---------------- helpers ---------------- */

function stripCardId(id: string | number): number | null {
  const s = String(id);
  if (!s.startsWith("card:")) return null;
  const n = Number(s.replace("card:", ""));
  return Number.isFinite(n) ? n : null;
}

function getStatusFromColId(id: string | number): Status | null {
  const s = String(id);
  if (!s.startsWith("col:")) return null;
  return s.replace("col:", "") as Status;
}

function groupByStatus(apps: Application[]) {
  const map: Record<Status, Application[]> = {
    APPLIED: [],
    INTERVIEW: [],
    OFFER: [],
    REJECTED: [],
  };

  for (const a of apps) map[a.status].push(a);
  for (const k of Object.keys(map) as Status[]) {
    map[k].sort((a, b) => a.order - b.order);
  }
  return map;
}

async function persistColumnOrder(status: Status, orderedIds: number[]) {
  const unique = Array.from(new Set(orderedIds));

  const res = await fetch("/api/applications/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, orderedIds: unique }),
  });

  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg?.error || "Failed to persist order");
  }
}

/* ---------------- card ---------------- */

function KanbanCard({
  app,
  onOpen,
}: {
  app: Application;
  onOpen: (id: number) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card:${app.id}` });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={[
        "feature mirror-card transition",
        isDragging ? "ring-1 ring-white/20" : "",
      ].join(" ")}
    >
      {/* The interactive element is the BUTTON (better for a11y than role hacks) */}
      <button
        type="button"
        onDoubleClick={() => onOpen(app.id)}
        className={[
          "w-full text-left cursor-grab active:cursor-grabbing",
          "hover:brightness-110 transition outline-none",
          "focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0",
        ].join(" ")}
        aria-label={`Application: ${app.company}, ${app.role}. Status: ${app.status}. Drag to reorder or move columns.`}
        {...attributes}
        {...listeners}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="featureTitle">{app.company}</div>
          <span className="pill">{app.status}</span>
        </div>

        <div className="featureText mt-1">
          <div className="font-semibold">{app.role}</div>
          <div>{app.location ? `📍 ${app.location}` : "📍 Not set"}</div>
        </div>
      </button>
    </li>
  );
}

/* ---------------- drop zone ---------------- */

function ColumnDropZone({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <ul
      ref={setNodeRef}
      aria-label={label}
      className={[
        "grid gap-3 rounded-xl p-1 transition",
        "min-h-[220px]",
        isOver ? "bg-white/5 ring-1 ring-white/15" : "",
      ].join(" ")}
    >
      {children}
    </ul>
  );
}

/* ---------------- page ---------------- */

export default function KanbanPage() {
  const router = useRouter();
  const toast = useToast();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  // ✅ pointer + keyboard sensors (keyboard is a big resume signal)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then((r) => r.json())
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  const byStatus = useMemo(() => groupByStatus(apps), [apps]);
  const activeApp = apps.find((a) => a.id === activeCardId) ?? null;

  function openDetails(id: number) {
    router.push(`/applications/${id}`);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveCardId(null);
    if (!over) return;

    const appId = stripCardId(active.id);
    if (!appId) return;

    const current = apps.find((a) => a.id === appId);
    if (!current) return;

    const sourceStatus = current.status;

    // determine destination status
    const overColStatus = getStatusFromColId(over.id);
    const overCardId = stripCardId(over.id);

    const destStatus: Status | null =
      overColStatus ??
      (overCardId ? apps.find((a) => a.id === overCardId)?.status ?? null : null);

    if (!destStatus) return;

    const prev = apps;

    /* -------------------------------------------------------
       A) SAME COLUMN REORDER
       ------------------------------------------------------- */
    if (destStatus === sourceStatus && overCardId) {
      const colIds = byStatus[sourceStatus].map((a) => a.id);
      const oldIndex = colIds.indexOf(appId);
      const newIndex = colIds.indexOf(overCardId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const nextIds = arrayMove(colIds, oldIndex, newIndex);

      // optimistic: update order values for this column
      setApps((p) =>
        p.map((a) =>
          a.status !== sourceStatus ? a : { ...a, order: nextIds.indexOf(a.id) }
        )
      );

      try {
        await persistColumnOrder(sourceStatus, nextIds);
        toast.success("Order saved");
      } catch (err: any) {
        setApps(prev);
        toast.error(err?.message || "Failed to save order");
      }

      return;
    }

    /* -------------------------------------------------------
       B) CROSS COLUMN MOVE (STATUS + ORDER)
       ------------------------------------------------------- */
    const sourceIds = byStatus[sourceStatus]
      .map((a) => a.id)
      .filter((id) => id !== appId);

    const destIds = byStatus[destStatus].map((a) => a.id);

    // insert position: on a card -> before it, on column -> end
    let insertIndex = destIds.length;
    if (overCardId) {
      const idx = destIds.indexOf(overCardId);
      insertIndex = idx >= 0 ? idx : destIds.length;
    }

    const nextDest = [...destIds];
    nextDest.splice(insertIndex, 0, appId);

    // optimistic: status + both columns order
    setApps((p) =>
      p.map((a) => {
        if (a.id === appId)
          return {
            ...a,
            status: destStatus!,
            order: nextDest.indexOf(a.id),
          };

        if (a.status === sourceStatus)
          return { ...a, order: sourceIds.indexOf(a.id) };

        if (a.status === destStatus)
          return { ...a, order: nextDest.indexOf(a.id) };

        return a;
      })
    );

    try {
      // persist status change
      const r = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destStatus }),
      });
      if (!r.ok) throw new Error("Status update failed");

      // persist ordering for both columns
      await persistColumnOrder(destStatus, nextDest);
      await persistColumnOrder(sourceStatus, sourceIds);

      toast.success("Moved + saved");
    } catch (err: any) {
      setApps(prev);
      toast.error(err?.message || "Failed to move");
    }
  }

  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" />
      <div className="fixed inset-0 -z-10 bg-overlay" />

      <div className="mx-auto w-[min(1200px,92vw)] py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Kanban</h1>
          <Link className="btn-glass btn-ghost" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="mt-6">Loading…</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveCardId(stripCardId(e.active.id))}
            onDragEnd={onDragEnd}
          >
            <div className="mt-6 grid lg:grid-cols-4 gap-4">
              {COLUMNS.map((col) => (
                <section
                  key={col.key}
                  className="glass-card mirror-glass"
                  aria-label={`${col.title} column`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold">{col.title}</h2>
                    <span className="pill">{byStatus[col.key].length}</span>
                  </div>

                  <SortableContext
                    items={byStatus[col.key].map((a) => `card:${a.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ColumnDropZone
                      id={`col:${col.key}`}
                      label={`${col.title} applications`}
                    >
                      {byStatus[col.key].map((a) => (
                        <KanbanCard key={a.id} app={a} onOpen={openDetails} />
                      ))}

                      {byStatus[col.key].length === 0 && (
                        <li className="featureText text-white/60">Drop here</li>
                      )}
                    </ColumnDropZone>
                  </SortableContext>
                </section>
              ))}
            </div>

            <DragOverlay>
              {activeApp ? (
                <div className="feature mirror-card w-[300px]">
                  <div className="featureTitle">{activeApp.company}</div>
                  <div className="featureText">{activeApp.role}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </main>
  );
}
