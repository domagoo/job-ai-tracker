"use client";

import { useFormStatus } from "react-dom";
import Button from "@/app/components/Button";

export default function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" pending={pending}>
      Save Changes
    </Button>
  );
}
