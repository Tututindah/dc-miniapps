'use client';

import { Element } from './types';
import { useEffect, useRef } from 'react';

interface AttackEffectProps {
  element: Element;
  isAttacking: boolean;
  onComplete?: () => void;
}

export function AttackEffect({ element, isAttacking, onComplete }: AttackEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAttacking) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameRef.current = 0;
    const maxFrames = 30; // 0.5 seconds at 60fps

    const animate = () => {
      frameRef.current++;

      if (frameRef.current >= maxFrames) {
        frameRef.current = 0;
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw different attack effects based on element
      switch (element) {
        case 0: // Fire
          drawFireAttack(ctx, frameRef.current, maxFrames);
          break;
        case 1: // Water
          drawWaterAttack(ctx, frameRef.current, maxFrames);
          break;
        case 2: // Earth
          drawEarthAttack(ctx, frameRef.current, maxFrames);
          break;
        case 3: // Wind/Storm
          drawStormAttack(ctx, frameRef.current, maxFrames);
          break;
        case 4: // Dark
          drawDarkAttack(ctx, frameRef.current, maxFrames);
          break;
        case 5: // Light
          drawLightAttack(ctx, frameRef.current, maxFrames);
          break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAttacking, element, onComplete]);

  if (!isAttacking) return null;

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="absolute inset-0 pointer-events-none"
      style={{
        imageRendering: 'pixelated',
      }}
    />
  );
}

// Fire Attack - Flames shooting forward
function drawFireAttack(ctx: CanvasRenderingContext2D, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  const particles = 15;

  for (let i = 0; i < particles; i++) {
    const angle = (Math.PI / 4) * (i / particles - 0.5);
    const distance = progress * 150;
    const x = 100 + Math.cos(angle) * distance;
    const y = 100 + Math.sin(angle) * distance;
    
    const size = 8 - progress * 6;
    const opacity = 1 - progress;
    
    // Draw fire particle
    ctx.fillStyle = `rgba(255, ${100 - progress * 50}, 0, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner glow
    ctx.fillStyle = `rgba(255, 200, 0, ${opacity * 0.8})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Water Attack - Wave splash
function drawWaterAttack(ctx: CanvasRenderingContext2D, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  const drops = 20;

  for (let i = 0; i < drops; i++) {
    const angle = (Math.PI * 2) * (i / drops);
    const distance = progress * 120;
    const x = 100 + Math.cos(angle) * distance;
    const y = 100 + Math.sin(angle) * distance - progress * 30; // Arc up then down
    
    const size = 5 - progress * 3;
    const opacity = 1 - progress;
    
    ctx.fillStyle = `rgba(70, 130, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Sparkle
    ctx.fillStyle = `rgba(150, 200, 255, ${opacity * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Earth Attack - Rock shards
function drawEarthAttack(ctx: CanvasRenderingContext2D, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  const rocks = 12;

  for (let i = 0; i < rocks; i++) {
    const angle = (Math.PI * 2) * (i / rocks);
    const distance = progress * 100;
    const x = 100 + Math.cos(angle) * distance;
    const y = 100 + Math.sin(angle) * distance;
    
    const size = 10 - progress * 7;
    const opacity = 1 - progress;
    const rotation = frame * 0.1 + i;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = `rgba(100, 180, 100, ${opacity})`;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    
    // Darker edge
    ctx.fillStyle = `rgba(50, 120, 50, ${opacity})`;
    ctx.fillRect(-size / 2, -size / 2, size / 2, size / 2);
    ctx.restore();
  }
}

// Storm Attack - Wind/Lightning
function drawStormAttack(ctx: CanvasRenderingContext2D, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  
  // Wind swirls
  const swirls = 8;
  for (let i = 0; i < swirls; i++) {
    const angle = (Math.PI * 2) * (i / swirls) + progress * Math.PI * 4;
    const radius = 40 + progress * 80;
    const x = 100 + Math.cos(angle) * radius;
    const y = 100 + Math.sin(angle) * radius;
    
    const opacity = (1 - progress) * 0.8;
    ctx.strokeStyle = `rgba(255, 255, 100, ${opacity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 10, angle, angle + Math.PI * 0.5);
    ctx.stroke();
  }
  
  // Lightning bolts (every few frames)
  if (frame % 5 === 0 && progress < 0.8) {
    const bolts = 3;
    for (let i = 0; i < bolts; i++) {
      const angle = (Math.PI * 2) * (i / bolts);
      const x1 = 100;
      const y1 = 100;
      const x2 = 100 + Math.cos(angle) * 100;
      const y2 = 100 + Math.sin(angle) * 100;
      
      ctx.strokeStyle = `rgba(255, 255, 200, ${0.9 - progress})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * 0.3, y1 + (y2 - y1) * 0.3 + Math.random() * 20 - 10);
      ctx.lineTo(x1 + (x2 - x1) * 0.6, y1 + (y2 - y1) * 0.6 + Math.random() * 20 - 10);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

// Dark Attack - Shadow tendrils
function drawDarkAttack(ctx: CanvasRenderingContext2D, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  const tendrils = 10;

  for (let i = 0; i < tendrils; i++) {
    const angle = (Math.PI * 2) * (i / tendrils);
    const wave = Math.sin(progress * Math.PI * 3 + i) * 20;
    const distance = progress * 120;
    const x = 100 + Math.cos(angle) * distance + wave;
    const y = 100 + Math.sin(angle) * distance;
    
    const opacity = (1 - progress) * 0.8;
    
    ctx.strokeStyle = `rgba(100, 50, 150, ${opacity})`;
    ctx.lineWidth = 5 - progress * 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.quadraticCurveTo(
      100 + Math.cos(angle) * distance * 0.5 + wave,
      100 + Math.sin(angle) * distance * 0.5,
      x,
      y
    );
    ctx.stroke();
  }
}

// Light Attack - Radiant beams
function drawLightAttack(ctx: CanvasRenderingContext2D, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  const beams = 12;

  for (let i = 0; i < beams; i++) {
    const angle = (Math.PI * 2) * (i / beams);
    const length = progress * 150;
    const x1 = 100;
    const y1 = 100;
    const x2 = 100 + Math.cos(angle) * length;
    const y2 = 100 + Math.sin(angle) * length;
    
    const opacity = 1 - progress;
    
    // Outer beam
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, `rgba(255, 200, 255, ${opacity})`);
    gradient.addColorStop(1, `rgba(255, 200, 255, 0)`);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Inner bright beam
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Central glow
  const glowGradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 30);
  glowGradient.addColorStop(0, `rgba(255, 255, 255, ${(1 - progress) * 0.8})`);
  glowGradient.addColorStop(1, `rgba(255, 200, 255, 0)`);
  ctx.fillStyle = glowGradient;
  ctx.fillRect(70, 70, 60, 60);
}
