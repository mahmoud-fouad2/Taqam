"use client";

import { useRef, useState } from "react";

import { Volume2, VolumeX } from "lucide-react";

export function HeroVideo({ src }: { src: string }) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted((prev) => !prev);
  }

  return (
    <div className="relative aspect-square overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        className="h-full w-full object-cover"
        loop
        muted
        playsInline
        preload="auto">
        <source src={src} type="video/mp4" />
      </video>

      <button
        aria-label={muted ? "تفعيل الصوت" : "كتم الصوت"}
        onClick={toggleMute}
        type="button"
        className="absolute end-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none">
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
