"use client";

import { useFormStatus } from "react-dom";
import Button from "./Button";

type Props = React.ComponentProps<typeof Button>;

export default function FormButton(props: Props) {
  const { pending } = useFormStatus();
  return <Button {...props} pending={pending} />;
}
