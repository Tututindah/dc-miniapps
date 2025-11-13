'use client';

import { useEffect, useRef } from 'react';

/**
 * Enhanced Dragon Image Renderer
 * Matches real Dragon City aesthetic with detailed sprites
 * Supports: 10 elements × 5 rarities × 4 evolution forms = 200 variants
 */

export interface DragonImageProps {
  element: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 10 elements
  rarity: 0 | 1 | 2 | 3 | 4; // 5 rarities
  form: 0 | 1 | 2 | 3; // 4 evolution forms
  size?: number;
  animated?: boolean;
}

const ELEMENTS = [
  'FIRE', 'WATER', 'EARTH', 'AIR', 'DARK', 
  'LIGHT', 'NATURE', 'METAL', 'ICE', 'ELECTRIC'
] as const;

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as const;
const FORMS = ['BASIC', 'EVOLVED1', 'EVOLVED2', 'ULTIMATE'] as const;

// Element color palettes (like real Dragon City)
const ELEMENT_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  FIRE: { primary: '#FF4500', secondary: '#FF8C00', accent: '#FFD700' },
  WATER: { primary: '#1E90FF', secondary: '#00BFFF', accent: '#87CEEB' },
  EARTH: { primary: '#8B4513', secondary: '#D2691E', accent: '#F4A460' },
  AIR: { primary: '#E0FFFF', secondary: '#B0E0E6', accent: '#FFFFFF' },
  DARK: { primary: '#4B0082', secondary: '#8B008B', accent: '#9400D3' },
  LIGHT: { primary: '#FFD700', secondary: '#FFFF00', accent: '#FFFFFF' },
  NATURE: { primary: '#228B22', secondary: '#32CD32', accent: '#90EE90' },
  METAL: { primary: '#C0C0C0', secondary: '#A9A9A9', accent: '#DCDCDC' },
  ICE: { primary: '#00CED1', secondary: '#40E0D0', accent: '#AFEEEE' },
  ELECTRIC: { primary: '#FFFF00', secondary: '#FFD700', accent: '#FFA500' },
};

export function DragonCityImage({ element, rarity, form, size = 120, animated = true }: DragonImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    let animationId: number;
    let frame = 0;

    const colors = ELEMENT_COLORS[ELEMENTS[element]];
    const sizeMultiplier = 1 + (form * 0.2); // Bigger as they evolve
    const detailLevel = rarity + 1; // More details for higher rarity

    const drawDragon = () => {
      ctx.clearRect(0, 0, size, size);
      
      const centerX = size / 2;
      const centerY = size / 2;
      const baseSize = (size / 3) * sizeMultiplier;

      // Animation
      const breathe = animated ? Math.sin(frame * 0.1) * 3 : 0;
      const wingFlap = animated ? Math.sin(frame * 0.15) * 5 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(centerX, size - 15, baseSize * 0.8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail (behind body)
      drawTail(ctx, centerX, centerY, baseSize, colors, form, frame);

      // Wings (behind body)
      if (form >= 1) {
        drawWings(ctx, centerX, centerY - 10, baseSize, colors, wingFlap, form);
      }

      // Body
      drawBody(ctx, centerX, centerY + breathe, baseSize, colors, rarity, form);

      // Head
      drawHead(ctx, centerX, centerY - baseSize / 2 + breathe, baseSize, colors, rarity, form);

      // Legs
      drawLegs(ctx, centerX, centerY + baseSize / 2, baseSize, colors);

      // Special effects based on element
      drawElementalEffects(ctx, centerX, centerY, baseSize, element, frame);

      // Rarity glow
      if (rarity >= 2) {
        drawRarityGlow(ctx, centerX, centerY, baseSize * 1.5, colors, rarity);
      }

      // Evolution aura
      if (form >= 2) {
        drawEvolutionAura(ctx, centerX, centerY, baseSize * 1.8, colors, frame);
      }

      if (animated) {
        frame++;
        animationId = requestAnimationFrame(drawDragon);
      }
    };

    drawDragon();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [element, rarity, form, size, animated]);

  return <canvas ref={canvasRef} className="dragon-sprite" />;
}

// ============ DRAWING FUNCTIONS ============

function drawBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  rarity: number,
  form: number
) {
  // Main body (scaled by evolution form)
  const bodyWidth = size * 0.8;
  const bodyHeight = size * 0.6;

  // Gradient body
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, bodyWidth);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(0.5, colors.secondary);
  gradient.addColorStop(1, colors.primary);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scales (more detailed for higher rarity)
  if (rarity >= 1) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5 + rarity * 2; i++) {
      const offsetX = (i % 3 - 1) * (bodyWidth / 3);
      const offsetY = Math.floor(i / 3) * (bodyHeight / 4) - bodyHeight / 2;
      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, 5 + rarity, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Belly (lighter color)
  ctx.fillStyle = colors.accent + '40';
  ctx.beginPath();
  ctx.ellipse(x, y + bodyHeight / 3, bodyWidth * 0.6, bodyHeight * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  rarity: number,
  form: number
) {
  const headSize = size * 0.4;

  // Head
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.ellipse(x, y, headSize, headSize * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.ellipse(x, y + headSize / 2, headSize * 0.5, headSize * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  const eyeOffset = headSize * 0.25;
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(x - eyeOffset, y - 5, 6, 0, Math.PI * 2);
  ctx.arc(x + eyeOffset, y - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x - eyeOffset, y - 5, 3, 0, Math.PI * 2);
  ctx.arc(x + eyeOffset, y - 5, 3, 0, Math.PI * 2);
  ctx.fill();

  // Horns (more prominent in evolved forms)
  if (form >= 1) {
    drawHorns(ctx, x, y - headSize, headSize, colors, form);
  }

  // Nose holes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x - 5, y + headSize / 2, 2, 0, Math.PI * 2);
  ctx.arc(x + 5, y + headSize / 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawLegs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any
) {
  const legWidth = size * 0.15;
  const legHeight = size * 0.4;

  ctx.fillStyle = colors.primary;

  // Front legs
  [-1, 1].forEach(side => {
    ctx.beginPath();
    ctx.ellipse(x + side * size * 0.4, y, legWidth, legHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    // Claws
    ctx.fillStyle = colors.accent;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x + side * size * 0.4 + i * 4, y + legHeight, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = colors.primary;
  });
}

function drawTail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  form: number,
  frame: number
) {
  const tailLength = size * (1.2 + form * 0.3);
  const segments = 5 + form * 2;

  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = size * 0.2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);

  for (let i = 0; i < segments; i++) {
    const progress = i / segments;
    const waveOffset = Math.sin((frame + i * 10) * 0.1) * 10;
    const targetX = x + size * 1.5 + waveOffset;
    const targetY = y + size * 0.5 + progress * tailLength;
    
    ctx.quadraticCurveTo(
      targetX + waveOffset,
      targetY - 10,
      targetX,
      targetY
    );
  }

  ctx.stroke();

  // Tail tip (spike or flame)
  const tipX = x + size * 1.5;
  const tipY = y + size * 0.5 + tailLength;
  
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - 10, tipY + 15);
  ctx.lineTo(tipX + 10, tipY + 15);
  ctx.closePath();
  ctx.fill();
}

function drawWings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  wingFlap: number,
  form: number
) {
  const wingSpan = size * (1 + form * 0.3);
  const wingHeight = size * 0.8;

  ctx.fillStyle = colors.secondary + '80';
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;

  [-1, 1].forEach(side => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * (Math.PI / 6 + wingFlap * 0.01));

    // Wing membrane
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * wingSpan * 0.5, -wingHeight / 2, side * wingSpan, -wingHeight / 3);
    ctx.quadraticCurveTo(side * wingSpan * 0.7, wingHeight / 4, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Wing bones
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * wingSpan * (i / 3), -wingHeight / 3);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawHorns(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  form: number
) {
  const hornLength = size * (0.3 + form * 0.2);

  ctx.fillStyle = colors.accent;
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1;

  [-1, 1].forEach(side => {
    ctx.beginPath();
    ctx.moveTo(x + side * size * 0.3, y);
    ctx.lineTo(x + side * size * 0.4, y - hornLength);
    ctx.lineTo(x + side * size * 0.25, y - hornLength * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function drawElementalEffects(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  element: number,
  frame: number
) {
  const elementName = ELEMENTS[element];

  switch (elementName) {
    case 'FIRE':
      // Floating flames
      for (let i = 0; i < 3; i++) {
        const offsetX = Math.sin((frame + i * 20) * 0.1) * 20;
        const offsetY = -size / 2 - (frame + i * 30) % 40;
        
        const gradient = ctx.createRadialGradient(x + offsetX, y + offsetY, 0, x + offsetX, y + offsetY, 8);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.5, '#FF8C00');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'WATER':
      // Water drops
      ctx.fillStyle = 'rgba(0, 191, 255, 0.6)';
      for (let i = 0; i < 5; i++) {
        const dropY = y - size / 2 + ((frame + i * 15) % 100);
        ctx.beginPath();
        ctx.arc(x + (i - 2) * 15, dropY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'ELECTRIC':
      // Lightning bolts
      if (frame % 30 < 5) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 20, y - size / 2);
        ctx.lineTo(x - 10, y - size / 3);
        ctx.lineTo(x - 15, y - size / 4);
        ctx.lineTo(x - 5, y);
        ctx.stroke();
      }
      break;
  }
}

function drawRarityGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  rarity: number
) {
  const glowIntensity = 0.1 + rarity * 0.05;
  
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, `${colors.primary}${Math.floor(glowIntensity * 255).toString(16)}`);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawEvolutionAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: any,
  frame: number
) {
  const rotation = (frame * 0.02) % (Math.PI * 2);
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  ctx.strokeStyle = colors.accent + '60';
  ctx.lineWidth = 3;
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const startX = Math.cos(angle) * size * 0.8;
    const startY = Math.sin(angle) * size * 0.8;
    const endX = Math.cos(angle) * size;
    const endY = Math.sin(angle) * size;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  ctx.restore();
}
