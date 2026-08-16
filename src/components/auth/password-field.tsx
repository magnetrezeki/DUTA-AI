"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { inputClass, labelClass } from "@/components/ui/form-control";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={labelClass}>{label}</label>
        <button
          type="button"
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="min-h-11 rounded-lg px-2 text-sm font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
        >
          {visible ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <input id={id} type={visible ? "text" : "password"} className={`${inputClass} mt-1`} {...props} />
    </div>
  );
}
