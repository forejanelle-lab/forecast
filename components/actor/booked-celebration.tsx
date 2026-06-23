"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
];

type Particle = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
  gravity: number;
};

export function BookedCelebration({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let particles: Particle[] = [];
    const duration = 4500;
    const start = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnBurst = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -20 - Math.random() * canvas.height * 0.3,
          w: 6 + Math.random() * 8,
          h: 4 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 4,
          gravity: 0.08 + Math.random() * 0.06,
        });
      }
    };

    spawnBurst();
    const burstTimer = window.setInterval(() => {
      if (performance.now() - start < duration - 800) spawnBurst();
    }, 600);

    const draw = () => {
      const elapsed = performance.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      particles = particles.filter(
        (p) => p.y < canvas.height + 40 && p.x > -40 && p.x < canvas.width + 40,
      );

      if (elapsed < duration) {
        animationId = requestAnimationFrame(draw);
      } else {
        onComplete();
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.clearInterval(burstTimer);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[300] pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-x-0 top-16 flex justify-center">
        <div
          className="rounded-2xl bg-bg-primary/90 backdrop-blur-sm border border-border px-6 py-4 shadow-lg animate-fade-in"
        >
          <p className="text-lg font-semibold text-text-primary text-center">
            You&apos;re booked!
          </p>
          <p className="text-sm text-text-secondary text-center mt-1">
            Check your messages for booking details.
          </p>
        </div>
      </div>
    </div>
  );
}
