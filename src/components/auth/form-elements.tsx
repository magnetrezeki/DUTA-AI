import type { InputHTMLAttributes, ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/form-control";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Field({ label, id, ...props }: FieldProps) {
  return <div><label htmlFor={id} className={labelClass}>{label}</label><input id={id} className={inputClass} {...props} /></div>;
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return <Button type="submit" className="w-full">{children}</Button>;
}

export function FormNotice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return <Alert tone={tone === "error" ? "danger" : "success"}>{children}</Alert>;
}
