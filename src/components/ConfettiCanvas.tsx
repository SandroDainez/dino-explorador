import React, { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

const CONFETTI_COLORS = [
  '#FF5722', // Orange
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#00BCD4', // Cyan
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#E91E63', // Pink
];

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

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

    const createParticle = (): Particle => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * -100 - 20, // start above screen
        size: Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
      };
    };

    // If active, initialize a burst
    if (active) {
      particlesRef.current = Array.from({ length: 150 }, createParticle);
    } else {
      particlesRef.current = [];
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y / 30) * 0.5; // add subtle swaying
        p.rotation += p.rotationSpeed;

        // Draw particle (rotating rectangle)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
        ctx.restore();

        // Recycle particle if it falls off bottom AND we are still active
        if (p.y > canvas.height) {
          if (active) {
            particles[i] = createParticle();
          } else {
            // Remove particle if inactive
            particles.splice(i, 1);
            i--;
          }
        }
      }

      // If active or we still have running particles, continue loop
      if (active || particles.length > 0) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    if (active) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  );
};
