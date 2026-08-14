export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-2.5">
    <span aria-hidden="true" className="relative grid size-9 place-items-center rounded-[0.7rem] bg-brand-700 text-sm font-black text-white shadow-sm"><span className="absolute right-0 top-0 h-full w-1/2 rounded-r-[0.7rem] bg-white/12" />D</span>
    {!compact && <span className="text-[1.05rem] font-black tracking-[-0.035em] text-slate-950">DUTA <span className="text-brand-700">AI</span></span>}
  </span>;
}
