import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  inverted?: boolean;
};

export function BrandMark({ compact = false, inverted = false }: BrandMarkProps) {
  return <span className="inline-flex items-center gap-2.5">
    <Image
      src="/brand/duta-rantau-mark.webp"
      alt=""
      width={512}
      height={488}
      className="size-10 rounded-[0.75rem] object-cover shadow-sm ring-1 ring-slate-950/10"
    />
    {!compact && <span className="leading-none">
      <span className={`block text-[1rem] font-black tracking-[-0.035em] ${inverted ? "text-white" : "text-slate-950"}`}>DUTA <span className="text-brand-700">RANTAU</span></span>
      <span className={`mt-1 block text-[0.6rem] font-bold uppercase tracking-[0.18em] ${inverted ? "text-slate-300" : "text-slate-500"}`}>Platform DUTA AI</span>
    </span>}
  </span>;
}
