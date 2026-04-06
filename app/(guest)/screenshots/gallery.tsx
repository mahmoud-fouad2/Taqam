"use client";

import * as React from "react";
import Image from "next/image";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BadgeColor = "indigo" | "blue" | "purple" | "green" | "orange" | "teal";

const BADGE_CLASSES: Record<BadgeColor, string> = {
  indigo: "bg-indigo-500/80 text-white",
  blue: "bg-blue-500/80 text-white",
  purple: "bg-purple-500/80 text-white",
  green: "bg-emerald-500/80 text-white",
  orange: "bg-orange-500/80 text-white",
  teal: "bg-teal-500/80 text-white",
};

export type MarketingShot = {
  src: string;
  titleAr: string;
  titleEn?: string;
  badgeAr?: string;
  badgeEn?: string;
  badgeColor?: BadgeColor;
};

function getShotGridClass(currentView: View, idx: number) {
  if (currentView === "mobile") {
    return idx === 0 ? "md:col-span-2 lg:col-span-1" : "";
  }

  if (idx === 0) return "md:col-span-2 lg:col-span-2";
  if (idx === 1 || idx === 2) return "lg:col-span-2";
  return "lg:col-span-3";
}

function getShotAspectClass(currentView: View, idx: number) {
  if (currentView === "mobile") {
    return "aspect-[10/16] sm:aspect-[9/15]";
  }

  if (idx === 0) return "aspect-[16/8.8] md:aspect-[16/8.4] lg:aspect-[16/10]";
  return "aspect-[16/10]";
}

type View = "desktop" | "mobile";

type Props = {
  locale: "ar" | "en";
  desktop: MarketingShot[];
  mobile: MarketingShot[];
};

function ShotsGrid({
  currentView,
  items,
  isAr,
  openAt,
}: {
  currentView: View;
  items: MarketingShot[];
  isAr: boolean;
  openAt: (nextView: View, index: number) => void;
}) {
  return (
    <div className={cn("mt-8 grid gap-4 md:grid-cols-2 lg:gap-5", currentView === "desktop" ? "lg:grid-cols-6" : "lg:grid-cols-3")}>
      {items.map((s, idx) => (
        <button
          key={s.src}
          type="button"
          onClick={() => openAt(currentView, idx)}
          className={cn(
            "group relative overflow-hidden rounded-[28px] border border-border/70 bg-background/85 p-2 text-start shadow-[0_24px_60px_-32px_rgba(79,70,229,0.24)] backdrop-blur-sm",
            "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-36px_rgba(79,70,229,0.32)]",
            getShotGridClass(currentView, idx),
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <div className="rounded-[22px] bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-2 dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-900">
            <div
              className={cn(
                "relative overflow-hidden rounded-[18px] bg-muted",
                getShotAspectClass(currentView, idx)
              )}
            >
            <Image
              src={s.src}
              alt={isAr ? s.titleAr : (s.titleEn ?? s.titleAr)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority={currentView === "desktop" ? idx === 0 : false}
              sizes={currentView === "desktop" ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"}
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
            {/* Category badge top-start */}
            {(s.badgeAr || s.badgeEn) && (
              <div
                className={cn(
                  "absolute start-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur",
                  BADGE_CLASSES[s.badgeColor ?? "indigo"]
                )}
              >
                {isAr ? s.badgeAr : s.badgeEn}
              </div>
            )}
            {/* Zoom icon top-end */}
            <div className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs text-white backdrop-blur opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Maximize2 className="h-3 w-3" />
              <span>{isAr ? "تكبير" : "Zoom"}</span>
            </div>
            <div className="absolute bottom-0 start-0 end-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/55 via-black/20 to-transparent">
              <p className="text-sm font-semibold text-white drop-shadow leading-tight">{isAr ? s.titleAr : (s.titleEn ?? s.titleAr)}</p>
              {s.titleEn && s.titleAr !== s.titleEn && (
                <p className="text-[11px] text-white/70 mt-0.5">{isAr ? s.titleEn : s.titleAr}</p>
              )}
            </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ScreenshotsGallery({ locale, desktop, mobile }: Props) {
  const [view, setView] = React.useState<View>("desktop");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const isAr = locale === "ar";

  const shots = view === "desktop" ? desktop : mobile;

  const active = shots[activeIndex];

  const openAt = React.useCallback((nextView: View, index: number) => {
    setView(nextView);
    setActiveIndex(index);
    setOpen(true);
  }, []);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < shots.length - 1;

  const prev = React.useCallback(() => setActiveIndex((i) => Math.max(0, i - 1)), []);
  const next = React.useCallback(
    () => setActiveIndex((i) => Math.min(shots.length - 1, i + 1)),
    [shots.length]
  );

  const handleSwipe = React.useRef<{ startX: number; active: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    handleSwipe.current = { startX: e.clientX, active: true };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const state = handleSwipe.current;
    handleSwipe.current = null;
    if (!state?.active) return;
    const dx = e.clientX - state.startX;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) prev();
    else next();
  };

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, prev, next]);

  return (
    <>
      <div className="mt-12 pb-16">
        <Tabs value={view} onValueChange={(v) => { setView(v as View); setActiveIndex(0); }}>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-background/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <TabsList className="h-10">
              <TabsTrigger value="desktop" className="gap-2">
                {isAr ? "سطح المكتب" : "Desktop"}
                <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                  {desktop.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2">
                {isAr ? "الجوال" : "Mobile"}
                <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                  {mobile.length}
                </span>
              </TabsTrigger>
            </TabsList>
            <p className="text-xs text-muted-foreground">
              {isAr ? "اضغط على أي لقطة للتكبير" : "Click any screenshot to zoom in"}
            </p>
          </div>
          <TabsContent value="desktop">
            <ShotsGrid currentView="desktop" items={desktop} isAr={isAr} openAt={openAt} />
          </TabsContent>
          <TabsContent value="mobile">
            <ShotsGrid currentView="mobile" items={mobile} isAr={isAr} openAt={openAt} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(1100px,calc(100%-2rem))] p-0">
          <div className="relative overflow-hidden rounded-lg">
            <div className="flex items-start justify-between gap-4 border-b bg-background px-5 py-4">
              <DialogHeader className="text-start">
                <DialogTitle className="text-base sm:text-lg">
                  {isAr ? active?.titleAr : (active?.titleEn ?? active?.titleAr)}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                    {isAr
                      ? `${active?.badgeAr ? `[${active.badgeAr}] • ` : ""}استخدم الأسهم أو اسحب للتنقل • ${activeIndex + 1} / ${shots.length}`
                      : `${active?.badgeEn ? `[${active.badgeEn}] • ` : ""}Use arrows or swipe • ${activeIndex + 1} / ${shots.length}`}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prev}
                  disabled={!canPrev}
                  aria-label={isAr ? "السابق" : "Previous"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={next}
                  disabled={!canNext}
                  aria-label={isAr ? "التالي" : "Next"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              className={cn(
                "relative bg-gradient-to-br from-muted/40 via-background to-muted/30",
                view === "desktop" ? "aspect-[16/10]" : "aspect-[10/16] sm:aspect-[4/5]"
              )}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              {active ? (
                <Image
                  src={active.src}
                  alt={isAr ? active.titleAr : (active.titleEn ?? active.titleAr)}
                  fill
                  className="object-contain p-3 sm:p-5"
                  sizes="(max-width: 640px) 100vw, 1100px"
                  key={active.src}
                />
              ) : null}
            </div>

            <div className="border-t bg-background px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {shots.map((s, idx) => (
                  <button
                    key={s.src}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "relative h-14 w-24 shrink-0 overflow-hidden rounded-md border bg-muted",
                      idx === activeIndex ? "border-primary ring-2 ring-primary/30" : "border-border"
                    )}
                    aria-label={s.titleEn ?? s.titleAr}
                  >
                    <Image src={s.src} alt={isAr ? s.titleAr : (s.titleEn ?? s.titleAr)} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

