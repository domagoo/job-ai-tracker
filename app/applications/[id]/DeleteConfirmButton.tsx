// app/applications/[id]/DeleteConfirmButton.tsx
"use client";

import { useState } from "react";
import FormButton from "@/app/components/FormButton";
import Button from "@/app/components/Button";

export default function DeleteConfirmButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Delete
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-[420px] animate-scale-in">
            <h3 className="text-lg font-extrabold">Delete application?</h3>
            <p className="mt-2 text-white/70">
              This action cannot be undone.
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <form action={action}>
                <FormButton>
                  Confirm
                </FormButton>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
