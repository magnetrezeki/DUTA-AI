import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, id, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
        {...props}
      />
    </div>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
    >
      {children}
    </button>
  );
}

export function FormNotice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border p-3 text-sm ${toneClass}`}
    >
      {children}
    </p>
  );
}
