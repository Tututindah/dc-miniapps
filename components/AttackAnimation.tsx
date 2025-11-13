// Attack animation effects using Canvas and WASM
import { useEffect, useRef } from 'react';

interface AttackAnimationProps {
  animation: string; // from WASM GetAttackAnimation
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  onComplete: () => void;
}

export default function AttackAnimation({
  animation,
  sourceX,
  sourceY,
  targetX,
  targetY,
  onComplete
}: AttackAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const maxFrames = 30;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const progress = frame / maxFrames;
      const x = sourceX + (targetX - sourceX) * progress;
      const y = sourceY + (targetY - sourceY) * progress;

      // Draw based on animation type
      switch (animation) {
        case 'fire_blast':
          drawFireBlast(ctx, x, y, progress);
          break;
        case 'fire_strike':
          drawFireStrike(ctx, x, y, progress);
          break;
        case 'water_tsunami':
          drawWaterTsunami(ctx, x, y, progress);
          break;
        case 'water_splash':
          drawWaterSplash(ctx, x, y, progress);
          break;
        case 'earth_quake':
          drawEarthquake(ctx, x, y, progress);
          break;
        case 'rock_throw':
          drawRockThrow(ctx, x, y, progress);
          break;
        case 'tornado':
          drawTornado(ctx, x, y, progress);
          break;
        case 'wind_slash':
          drawWindSlash(ctx, x, y, progress);
          break;
        case 'dark_void':
          drawDarkVoid(ctx, x, y, progress);
          break;
        case 'shadow_claw':
          drawShadowClaw(ctx, x, y, progress);
          break;
        case 'holy_beam':
          drawHolyBeam(ctx, x, y, progress);
          break;
        case 'light_ray':
          drawLightRay(ctx, x, y, progress);
          break;
        case 'vine_whip':
          drawVineWhip(ctx, x, y, progress);
          break;
        case 'leaf_storm':
          drawLeafStorm(ctx, x, y, progress);
          break;
        case 'metal_burst':
          drawMetalBurst(ctx, x, y, progress);
          break;
        case 'steel_edge':
          drawSteelEdge(ctx, x, y, progress);
          break;
        case 'blizzard':
          drawBlizzard(ctx, x, y, progress);
          break;
        case 'ice_shard':
          drawIceShard(ctx, x, y, progress);
          break;
        case 'thunderbolt':
          drawThunderbolt(ctx, x, y, progress);
          break;
        case 'spark':
          drawSpark(ctx, x, y, progress);
          break;
        default:
          drawBasicAttack(ctx, x, y, progress);
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();
  }, [animation, sourceX, sourceY, targetX, targetY, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="absolute inset-0 pointer-events-none z-50"
    />
  );
}

// Animation drawing functions
function drawFireBlast(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  const size = 40 + progress * 60;
  const opacity = 1 - progress;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Fire ball
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, '#ffff00');
  gradient.addColorStop(0.5, '#ff6600');
  gradient.addColorStop(1, '#ff0000');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  
  // Flames
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
    const flameX = x + Math.cos(angle) * size;
    const flameY = y + Math.sin(angle) * size;
    
    ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${opacity * 0.8})`;
    ctx.beginPath();
    ctx.arc(flameX, flameY, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawFireStrike(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.strokeStyle = '#ff4400';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 30);
  ctx.lineTo(x + 30, y + 30);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 30);
  ctx.lineTo(x - 30, y + 30);
  ctx.stroke();
  
  ctx.restore();
}

function drawWaterSplash(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const distance = progress * 100;
    const dropX = x + Math.cos(angle) * distance;
    const dropY = y + Math.sin(angle) * distance;
    
    ctx.fillStyle = `rgba(0, 100, 255, ${1 - progress})`;
    ctx.beginPath();
    ctx.arc(dropX, dropY, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawWaterTsunami(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  const waveHeight = 60;
  const waveLength = 100;
  
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 12;
  ctx.beginPath();
  
  for (let i = -50; i < 50; i++) {
    const waveX = x + i * 2;
    const waveY = y + Math.sin((i / waveLength) * Math.PI * 2 + progress * Math.PI * 4) * waveHeight;
    
    if (i === -50) {
      ctx.moveTo(waveX, waveY);
    } else {
      ctx.lineTo(waveX, waveY);
    }
  }
  
  ctx.stroke();
  ctx.restore();
}

function drawRockThrow(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  const rotation = progress * Math.PI * 4;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-20, -20, 40, 40);
  
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 2;
  ctx.strokeRect(-20, -20, 40, 40);
  
  ctx.restore();
}

function drawEarthquake(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  for (let i = 0; i < 5; i++) {
    const offsetY = Math.sin(progress * Math.PI * 8 + i) * 10;
    ctx.fillStyle = `rgba(139, 69, 19, ${0.8 - progress})`;
    ctx.fillRect(x - 100 + i * 40, y + offsetY, 30, 200);
  }
  
  ctx.restore();
}

function drawWindSlash(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < 3; i++) {
    const offset = i * 15;
    ctx.beginPath();
    ctx.moveTo(x - 50, y - offset);
    ctx.quadraticCurveTo(x, y - offset + 20, x + 50, y - offset);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawTornado(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  const spiralTurns = 5;
  ctx.strokeStyle = `rgba(200, 200, 255, ${1 - progress})`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2 * spiralTurns + progress * Math.PI * 2;
    const radius = (i / 100) * 80;
    const spiralX = x + Math.cos(angle) * radius;
    const spiralY = y - (i / 100) * 150;
    
    if (i === 0) {
      ctx.moveTo(spiralX, spiralY);
    } else {
      ctx.lineTo(spiralX, spiralY);
    }
  }
  
  ctx.stroke();
  ctx.restore();
}

function drawShadowClaw(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.strokeStyle = '#4b0082';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < 4; i++) {
    const offset = i * 20;
    ctx.beginPath();
    ctx.moveTo(x - 40 + offset, y - 40);
    ctx.lineTo(x - 20 + offset, y + 40);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawDarkVoid(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  const size = progress * 150;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, 'rgba(75, 0, 130, 0.9)');
  gradient.addColorStop(0.7, 'rgba(25, 0, 51, 0.7)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawLightRay(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 6;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffff00';
  
  ctx.beginPath();
  ctx.moveTo(x, y - 100);
  ctx.lineTo(x, y + 100);
  ctx.stroke();
  
  ctx.restore();
}

function drawHolyBeam(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  const beamWidth = 60;
  const gradient = ctx.createLinearGradient(x - beamWidth, y, x + beamWidth, y);
  gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
  gradient.addColorStop(0.5, `rgba(255, 255, 0, ${1 - progress})`);
  gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x - beamWidth, y - 200, beamWidth * 2, 400);
  
  ctx.restore();
}

function drawLeafStorm(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + progress * Math.PI * 4;
    const distance = 50 + progress * 100;
    const leafX = x + Math.cos(angle) * distance;
    const leafY = y + Math.sin(angle) * distance;
    
    ctx.fillStyle = `rgba(34, 139, 34, ${1 - progress})`;
    ctx.save();
    ctx.translate(leafX, leafY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  ctx.restore();
}

function drawVineWhip(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.strokeStyle = '#228b22';
  ctx.lineWidth = 8;
  ctx.globalAlpha = 1 - progress;
  
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const segmentX = x + (i / 10) * 100;
    const segmentY = y + Math.sin((i / 10) * Math.PI * 2 + progress * Math.PI * 2) * 30;
    
    if (i === 0) {
      ctx.moveTo(segmentX, segmentY);
    } else {
      ctx.lineTo(segmentX, segmentY);
    }
  }
  ctx.stroke();
  
  ctx.restore();
}

function drawIceShard(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.fillStyle = '#00ffff';
  ctx.strokeStyle = '#0088ff';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 15, y + 40);
  ctx.lineTo(x - 15, y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
}

function drawBlizzard(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  for (let i = 0; i < 50; i++) {
    const flakeX = x + (Math.random() - 0.5) * 200;
    const flakeY = y + (Math.random() - 0.5) * 200 + progress * 100;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - progress})`;
    ctx.beginPath();
    ctx.arc(flakeX, flakeY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawSteelEdge(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.fillStyle = '#c0c0c0';
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 3;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(progress * Math.PI);
  
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(40, 0);
  ctx.lineTo(50, -10);
  ctx.lineTo(50, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
  ctx.restore();
}

function drawMetalBurst(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const length = progress * 80;
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    ctx.strokeStyle = `rgba(192, 192, 192, ${1 - progress})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * 40 * (1 - progress);
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawThunderbolt(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 8;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffff00';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'miter';
  
  ctx.beginPath();
  ctx.moveTo(x, y - 100);
  ctx.lineTo(x + 20, y - 50);
  ctx.lineTo(x - 10, y);
  ctx.lineTo(x + 15, y + 50);
  ctx.lineTo(x, y + 100);
  ctx.stroke();
  
  ctx.restore();
}

function drawBasicAttack(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
