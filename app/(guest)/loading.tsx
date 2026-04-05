import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-primary/15" />
        <span className="absolute inline-flex h-18 w-18 animate-pulse rounded-full bg-primary/20" />
        <span className="relative z-10 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/8 dark:ring-white/10">
          <Image
            src="/logo-tight.jpeg"
            alt="Taqam"
            width={877}
            height={496}
            priority
            className="h-10 w-auto"
          />
        </span>
      </div>
      <p className="mt-6 animate-pulse text-sm font-semibold tracking-widest text-muted-foreground">طاقم</p>
      <div className="mt-3 flex gap-1.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
