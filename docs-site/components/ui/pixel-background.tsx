'use client';

import { useEffect, useRef, useState } from 'react';

interface Pixel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  baseSize: number;
  pulsePhase: number;
}

// Rainbow geode colors - vibrant interior colors
const COLORS = [
  '#9333EA', // purple
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow/orange
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#EF4444', // red
];

export function PixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const [isHovered, setIsHovered] = useState(false);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize pixels - more dense for geode effect
    const pixelCount = Math.floor((canvas.width * canvas.height) / 2500);
    pixelsRef.current = Array.from({ length: pixelCount }, () => {
      const baseSize = Math.random() * 2.5 + 1.5;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: baseSize,
        baseSize,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      
      // Dark background like geode exterior
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pixelsRef.current.forEach((pixel) => {
        // Update position
        pixel.x += pixel.vx;
        pixel.y += pixel.vy;

        // Bounce off walls
        if (pixel.x < 0 || pixel.x > canvas.width) pixel.vx *= -1;
        if (pixel.y < 0 || pixel.y > canvas.height) pixel.vy *= -1;

        // Keep within bounds
        pixel.x = Math.max(0, Math.min(canvas.width, pixel.x));
        pixel.y = Math.max(0, Math.min(canvas.height, pixel.y));

        // Mouse interaction - repel pixels (geode opening effect)
        if (isHovered) {
          const dx = pixel.x - mouseRef.current.x;
          const dy = pixel.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            pixel.vx += Math.cos(angle) * force * 0.4;
            pixel.vy += Math.sin(angle) * force * 0.4;
          }
        }

        // Damping
        pixel.vx *= 0.97;
        pixel.vy *= 0.97;

        // Pulsing size effect (sparkling crystals)
        pixel.size = pixel.baseSize + Math.sin(timeRef.current * 2 + pixel.pulsePhase) * 0.5;

        // Draw pixel with vibrant gradient (geode interior effect)
        const gradient = ctx.createRadialGradient(
          pixel.x,
          pixel.y,
          0,
          pixel.x,
          pixel.y,
          pixel.size * 3
        );
        
        // Bright center, fading edges
        gradient.addColorStop(0, pixel.color);
        gradient.addColorStop(0.3, pixel.color + 'FF');
        gradient.addColorStop(0.6, pixel.color + 'AA');
        gradient.addColorStop(1, pixel.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, pixel.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect for sparkle
        ctx.shadowBlur = 15;
        ctx.shadowColor = pixel.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw a small bright center (crystal facet)
        ctx.fillStyle = pixel.color;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, pixel.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-30"
      style={{ background: 'transparent' }}
      aria-hidden="true"
    />
  );
}
