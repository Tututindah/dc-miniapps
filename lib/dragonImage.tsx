'use client';

import { Element, PowerType } from './types';
import { useEffect, useRef, useState } from 'react';
import { AttackEffect } from './attackEffects';

interface DragonImageProps {
  element: Element;
  powerType: PowerType;
  size?: number;
  isAttacking?: boolean;
  showAttackEffect?: boolean;
}

const ELEMENT_COLORS = {
  0: ['#ff4444', '#cc0000', '#ff8888'], // Fire - red
  1: ['#4488ff', '#0044cc', '#88ccff'], // Water - blue
  2: ['#44ff44', '#00cc00', '#88ff88'], // Earth - green
  3: ['#88ffff', '#00cccc', '#ccffff'], // Air - cyan
  4: ['#8844ff', '#4400cc', '#cc88ff'], // Dark - purple
  5: ['#ffff88', '#ffff00', '#ffffcc'], // Light - bright yellow
  6: ['#44aa44', '#006600', '#88cc88'], // Nature - forest green
  7: ['#aaaaaa', '#666666', '#dddddd'], // Metal - silver
  8: ['#88ddff', '#4499cc', '#cceeff'], // Ice - light blue
  9: ['#ffdd00', '#cc9900', '#ffee88'], // Electric - gold
};

// Cache for rendered dragon images
const imageCache = new Map<string, ImageData>();

// Cache for skeleton animation frames
let skeletonFrames: ImageData[] | null = null;

function getCacheKey(element: Element, powerType: PowerType, isAttacking: boolean): string {
  return `${element}-${powerType}-${isAttacking ? 'attack' : 'normal'}`;
}

// Helper function to draw a single pixel
function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

export function DragonImage({ element, powerType, size = 100, isAttacking = false, showAttackEffect = false }: DragonImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [skeletonFrame, setSkeletonFrame] = useState(0);
  const colors = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] || ELEMENT_COLORS[0]; // Fallback to Fire
  const scale = powerType === 2 ? 1.3 : powerType === 1 ? 1.15 : 1;
  const actualSize = size * scale;

  // Skeleton animation loop
  useEffect(() => {
    if (!isAttacking) return;
    
    const interval = setInterval(() => {
      setSkeletonFrame((prev) => (prev + 1) % 4); // 4 frames of animation
    }, 150); // Change frame every 150ms
    
    return () => clearInterval(interval);
  }, [isAttacking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors) return;
    
    drawPixelDragon(canvas, colors, powerType, isAttacking, element, skeletonFrame);
  }, [colors, powerType, isAttacking, element, skeletonFrame]);

  return (
    <div
      className="dragon-image-container relative inline-block"
      style={{
        width: actualSize,
        height: actualSize,
      }}
    >
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        } as React.CSSProperties}
        className={isAttacking ? 'animate-shake' : ''}
      />
      {/* Show elemental attack effect */}
      {showAttackEffect && isAttacking && (
        <AttackEffect element={element} isAttacking={isAttacking} />
      )}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-2deg); }
          75% { transform: translateX(2px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function drawPixelDragon(
  canvas: HTMLCanvasElement,
  colors: string[],
  powerType: PowerType,
  isAttacking: boolean,
  element: Element,
  skeletonFrame: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cacheKey = getCacheKey(element, powerType, isAttacking);
  
  // Clear canvas
  ctx.clearRect(0, 0, 32, 32);

  if (isAttacking) {
    // Animated skeleton mode during attack
    drawAnimatedSkeleton(ctx, skeletonFrame);
  } else {
    // Check cache first
    let imageData = imageCache.get(cacheKey);
    
    if (!imageData) {
      // Draw to offscreen canvas and cache
      const offscreen = document.createElement('canvas');
      offscreen.width = 32;
      offscreen.height = 32;
      const offscreenCtx = offscreen.getContext('2d');
      
      if (offscreenCtx) {
        const [primary, dark, light] = colors;
        drawDetailedDragon(offscreenCtx, primary, dark, light, powerType);
        imageData = offscreenCtx.getImageData(0, 0, 32, 32);
        imageCache.set(cacheKey, imageData);
      }
    }
    
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  }
}

function drawAnimatedSkeleton(ctx: CanvasRenderingContext2D, frame: number) {
  const bone = '#f5f5dc';
  const darkBone = '#c9b896';
  const glowRed = frame % 2 === 0 ? '#ff0000' : '#ff4444'; // Pulsing eyes

  // Skull (larger, more detailed)
  // Top of skull
  drawPixel(ctx, 13, 8, darkBone);
  drawPixel(ctx, 14, 8, bone);
  drawPixel(ctx, 15, 8, bone);
  drawPixel(ctx, 16, 8, darkBone);
  
  // Upper skull
  drawPixel(ctx, 12, 9, darkBone);
  drawPixel(ctx, 13, 9, bone);
  drawPixel(ctx, 14, 9, bone);
  drawPixel(ctx, 15, 9, bone);
  drawPixel(ctx, 16, 9, bone);
  drawPixel(ctx, 17, 9, darkBone);
  
  // Eye sockets with glowing red eyes
  drawPixel(ctx, 12, 10, bone);
  drawPixel(ctx, 13, 10, glowRed); // Left eye
  drawPixel(ctx, 14, 10, bone);
  drawPixel(ctx, 15, 10, bone);
  drawPixel(ctx, 16, 10, glowRed); // Right eye
  drawPixel(ctx, 17, 10, bone);
  
  // Lower skull
  drawPixel(ctx, 12, 11, bone);
  drawPixel(ctx, 13, 11, bone);
  drawPixel(ctx, 14, 11, darkBone);
  drawPixel(ctx, 15, 11, darkBone);
  drawPixel(ctx, 16, 11, bone);
  drawPixel(ctx, 17, 11, bone);
  
  // Jaw
  drawPixel(ctx, 13, 12, darkBone);
  drawPixel(ctx, 14, 12, bone);
  drawPixel(ctx, 15, 12, bone);
  drawPixel(ctx, 16, 12, darkBone);
  
  // Teeth
  drawPixel(ctx, 13, 13, bone);
  drawPixel(ctx, 16, 13, bone);

  // Neck vertebrae (animate vertically)
  const neckOffset = Math.floor(frame / 2) % 2;
  drawPixel(ctx, 14, 13 + neckOffset, bone);
  drawPixel(ctx, 15, 13 + neckOffset, bone);

  // Spine
  drawPixel(ctx, 14, 15, bone);
  drawPixel(ctx, 15, 15, bone);
  drawPixel(ctx, 14, 16, darkBone);
  drawPixel(ctx, 15, 16, darkBone);
  drawPixel(ctx, 14, 17, bone);
  drawPixel(ctx, 15, 17, bone);
  drawPixel(ctx, 14, 18, darkBone);
  drawPixel(ctx, 15, 18, darkBone);

  // Ribs (breathing animation)
  const ribOffset = frame % 2;
  drawPixel(ctx, 13 - ribOffset, 16, bone);
  drawPixel(ctx, 16 + ribOffset, 16, bone);
  drawPixel(ctx, 12 - ribOffset, 17, darkBone);
  drawPixel(ctx, 17 + ribOffset, 17, darkBone);
  drawPixel(ctx, 13 - ribOffset, 18, bone);
  drawPixel(ctx, 16 + ribOffset, 18, bone);

  // Wing bones
  drawPixel(ctx, 10, 15, darkBone);
  drawPixel(ctx, 9, 16, darkBone);
  drawPixel(ctx, 8, 17, bone);
  drawPixel(ctx, 19, 15, darkBone);
  drawPixel(ctx, 20, 16, darkBone);
  drawPixel(ctx, 21, 17, bone);

  // Tail bones (swaying animation)
  const tailSway = frame % 4 < 2 ? 0 : 1;
  drawPixel(ctx, 14, 19, bone);
  drawPixel(ctx, 15 + tailSway, 20, darkBone);
  drawPixel(ctx, 16 + tailSway, 21, bone);
  drawPixel(ctx, 17 + tailSway, 22, darkBone);
  drawPixel(ctx, 18 + tailSway, 23, bone);

  // Leg bones
  drawPixel(ctx, 13, 19, darkBone);
  drawPixel(ctx, 13, 20, bone);
  drawPixel(ctx, 13, 21, darkBone);
  
  drawPixel(ctx, 16, 19, darkBone);
  drawPixel(ctx, 16, 20, bone);
  drawPixel(ctx, 16, 21, darkBone);
}

function drawDetailedDragon(
  ctx: CanvasRenderingContext2D,
  primary: string,
  dark: string,
  light: string,
  powerType: PowerType
) {
  const outline = '#000000';
  const white = '#ffffff';
  const eyeColor = '#000000';

  // === HEAD ===
  // Horns
  drawPixel(ctx, 12, 7, dark);
  drawPixel(ctx, 11, 8, dark);
  drawPixel(ctx, 17, 7, dark);
  drawPixel(ctx, 18, 8, dark);
  
  // Horn highlights
  drawPixel(ctx, 12, 8, light);
  drawPixel(ctx, 17, 8, light);

  // Skull outline and shape
  drawPixel(ctx, 13, 8, outline);
  drawPixel(ctx, 14, 8, primary);
  drawPixel(ctx, 15, 8, primary);
  drawPixel(ctx, 16, 8, outline);
  
  drawPixel(ctx, 12, 9, outline);
  drawPixel(ctx, 13, 9, primary);
  drawPixel(ctx, 14, 9, light);
  drawPixel(ctx, 15, 9, light);
  drawPixel(ctx, 16, 9, primary);
  drawPixel(ctx, 17, 9, outline);
  
  // Eyes row
  drawPixel(ctx, 12, 10, primary);
  drawPixel(ctx, 13, 10, white);
  drawPixel(ctx, 14, 10, primary);
  drawPixel(ctx, 15, 10, primary);
  drawPixel(ctx, 16, 10, white);
  drawPixel(ctx, 17, 10, primary);
  
  // Eye pupils
  drawPixel(ctx, 13, 10, eyeColor);
  drawPixel(ctx, 16, 10, eyeColor);
  
  // Snout
  drawPixel(ctx, 12, 11, outline);
  drawPixel(ctx, 13, 11, primary);
  drawPixel(ctx, 14, 11, light);
  drawPixel(ctx, 15, 11, light);
  drawPixel(ctx, 16, 11, primary);
  drawPixel(ctx, 17, 11, outline);
  
  drawPixel(ctx, 13, 12, outline);
  drawPixel(ctx, 14, 12, primary);
  drawPixel(ctx, 15, 12, primary);
  drawPixel(ctx, 16, 12, outline);

  // === NECK ===
  drawPixel(ctx, 13, 13, dark);
  drawPixel(ctx, 14, 13, primary);
  drawPixel(ctx, 15, 13, primary);
  drawPixel(ctx, 16, 13, dark);

  // === BODY ===
  // Upper body
  drawPixel(ctx, 11, 14, outline);
  drawPixel(ctx, 12, 14, primary);
  drawPixel(ctx, 13, 14, light);
  drawPixel(ctx, 14, 14, primary);
  drawPixel(ctx, 15, 14, primary);
  drawPixel(ctx, 16, 14, light);
  drawPixel(ctx, 17, 14, primary);
  drawPixel(ctx, 18, 14, outline);
  
  // Mid body
  drawPixel(ctx, 10, 15, outline);
  drawPixel(ctx, 11, 15, primary);
  drawPixel(ctx, 12, 15, dark);
  drawPixel(ctx, 13, 15, primary);
  drawPixel(ctx, 14, 15, light);
  drawPixel(ctx, 15, 15, light);
  drawPixel(ctx, 16, 15, primary);
  drawPixel(ctx, 17, 15, dark);
  drawPixel(ctx, 18, 15, primary);
  drawPixel(ctx, 19, 15, outline);
  
  // Lower body
  drawPixel(ctx, 11, 16, outline);
  drawPixel(ctx, 12, 16, primary);
  drawPixel(ctx, 13, 16, primary);
  drawPixel(ctx, 14, 16, primary);
  drawPixel(ctx, 15, 16, primary);
  drawPixel(ctx, 16, 16, primary);
  drawPixel(ctx, 17, 16, primary);
  drawPixel(ctx, 18, 16, outline);
  
  drawPixel(ctx, 12, 17, outline);
  drawPixel(ctx, 13, 17, primary);
  drawPixel(ctx, 14, 17, primary);
  drawPixel(ctx, 15, 17, primary);
  drawPixel(ctx, 16, 17, primary);
  drawPixel(ctx, 17, 17, outline);

  // === WINGS ===
  // Left wing
  drawPixel(ctx, 7, 14, light);
  drawPixel(ctx, 8, 14, light);
  drawPixel(ctx, 9, 14, light);
  drawPixel(ctx, 6, 15, light);
  drawPixel(ctx, 7, 15, primary);
  drawPixel(ctx, 8, 15, primary);
  drawPixel(ctx, 9, 15, light);
  drawPixel(ctx, 6, 16, outline);
  drawPixel(ctx, 7, 16, light);
  drawPixel(ctx, 8, 16, light);
  drawPixel(ctx, 9, 16, outline);
  
  // Right wing
  drawPixel(ctx, 20, 14, light);
  drawPixel(ctx, 21, 14, light);
  drawPixel(ctx, 22, 14, light);
  drawPixel(ctx, 20, 15, light);
  drawPixel(ctx, 21, 15, primary);
  drawPixel(ctx, 22, 15, primary);
  drawPixel(ctx, 23, 15, light);
  drawPixel(ctx, 20, 16, outline);
  drawPixel(ctx, 21, 16, light);
  drawPixel(ctx, 22, 16, light);
  drawPixel(ctx, 23, 16, outline);

  // === LEGS ===
  // Front left leg
  drawPixel(ctx, 12, 18, dark);
  drawPixel(ctx, 12, 19, dark);
  drawPixel(ctx, 12, 20, outline);
  drawPixel(ctx, 11, 20, outline);
  drawPixel(ctx, 13, 20, outline);
  
  // Front right leg
  drawPixel(ctx, 17, 18, dark);
  drawPixel(ctx, 17, 19, dark);
  drawPixel(ctx, 17, 20, outline);
  drawPixel(ctx, 16, 20, outline);
  drawPixel(ctx, 18, 20, outline);
  
  // Back left leg
  drawPixel(ctx, 13, 18, dark);
  drawPixel(ctx, 13, 19, dark);
  drawPixel(ctx, 13, 20, outline);
  
  // Back right leg
  drawPixel(ctx, 16, 18, dark);
  drawPixel(ctx, 16, 19, dark);
  drawPixel(ctx, 16, 20, outline);

  // === TAIL ===
  drawPixel(ctx, 14, 18, primary);
  drawPixel(ctx, 15, 18, primary);
  drawPixel(ctx, 15, 19, dark);
  drawPixel(ctx, 16, 19, primary);
  drawPixel(ctx, 17, 20, primary);
  drawPixel(ctx, 18, 21, light);
  drawPixel(ctx, 19, 22, light);
  drawPixel(ctx, 20, 23, outline);
  
  // Tail spikes
  drawPixel(ctx, 16, 20, light);
  drawPixel(ctx, 18, 22, light);

  // === POWER TYPE EFFECTS ===
  if (powerType === 1) {
    // Dual power - energy aura
    drawPixel(ctx, 10, 13, '#ffff00');
    drawPixel(ctx, 19, 13, '#ffff00');
    drawPixel(ctx, 9, 14, '#ffff00');
    drawPixel(ctx, 20, 14, '#ffff00');
    drawPixel(ctx, 9, 17, '#ffff00');
    drawPixel(ctx, 20, 17, '#ffff00');
  } else if (powerType === 2) {
    // Combined power - full aura + spikes
    drawPixel(ctx, 10, 13, '#ffff00');
    drawPixel(ctx, 19, 13, '#ffff00');
    drawPixel(ctx, 9, 14, '#ffff00');
    drawPixel(ctx, 20, 14, '#ffff00');
    drawPixel(ctx, 8, 15, '#ff00ff');
    drawPixel(ctx, 21, 15, '#ff00ff');
    drawPixel(ctx, 9, 17, '#ffff00');
    drawPixel(ctx, 20, 17, '#ffff00');
    
    // Back spikes
    drawPixel(ctx, 12, 13, light);
    drawPixel(ctx, 14, 12, light);
    drawPixel(ctx, 17, 13, light);
    
    // Electric effect on horns
    drawPixel(ctx, 11, 7, '#00ffff');
    drawPixel(ctx, 18, 7, '#00ffff');
  }

  // === BELLY SCALES ===
  drawPixel(ctx, 14, 15, light);
  drawPixel(ctx, 15, 16, light);
}

// Export a version for battle animations
export { drawPixelDragon };
export function DragonBattleSprite({ element, powerType, isAttacking, showAttackEffect = true }: Omit<DragonImageProps, 'size'> & { showAttackEffect?: boolean }) {
  return <DragonImage element={element} powerType={powerType} size={120} isAttacking={isAttacking} showAttackEffect={showAttackEffect} />;
}
