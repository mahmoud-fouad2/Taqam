import { LogoMark } from "@/components/logo-mark";

type BrandLoadingScreenProps = {
  label?: string;
};

export function BrandLoadingScreen({ label = "طاقم" }: BrandLoadingScreenProps) {
  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.14),transparent_30%)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.18),transparent_30%)]" />

      <div className="relative flex items-center justify-center">
        <span className="bg-primary/10 absolute inline-flex h-36 w-36 animate-ping rounded-full" />
        <span className="bg-primary/15 absolute inline-flex h-28 w-28 animate-pulse rounded-full" />
        <span className="border-primary/10 absolute inline-flex h-48 w-48 rounded-full border" />

        <div className="border-border/60 relative z-10 rounded-[2rem] border bg-white/90 px-6 py-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/90">
          <LogoMark frameClassName="rounded-none p-0" imageClassName="h-16 sm:h-20" />
        </div>
      </div>

      <p className="text-muted-foreground mt-8 animate-pulse text-sm font-semibold tracking-[0.35em]">
        {label}
      </p>

      <div className="mt-4 flex gap-1.5">
        <span className="bg-primary/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
        <span className="bg-primary/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
        <span className="bg-primary/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
      </div>
    </div>
  );
}
