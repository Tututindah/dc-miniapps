'use client';

import { useEffect, useRef, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { GameWorld } from '@/lib/three/world';
import { VoxelTerrain } from '@/lib/three/terrain';
import { PlayerController } from '@/lib/three/player';
import { AvatarRider } from '@/lib/three/avatar';

interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

export default function ThreeJSGame({
  playerName = 'Player',
  roomId = 'main',
}: {
  playerName?: string;
  roomId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    world: GameWorld;
    terrain: VoxelTerrain;
    player: PlayerController;
    avatar: AvatarRider;
  } | null>(null);

  const [farcasterProfile, setFarcasterProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlying, setIsFlying] = useState(false);

  // Load Farcaster profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setFarcasterProfile({
            fid: context.user.fid,
            username: context.user.username || playerName,
            displayName: context.user.displayName || playerName,
            pfpUrl: context.user.pfpUrl || '',
          });
        }
      } catch (error) {
        console.log('Not running in Farcaster context:', error);
      }
    };
    loadProfile();
  }, [playerName]);

  // Initialize Three.js game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Create game world
    const world = new GameWorld(canvas);
    const terrain = new VoxelTerrain();
    world.scene.add(terrain.getMesh());

    // Create player with dragon
    const displayName = farcasterProfile?.displayName || playerName;
    const pfpUrl = farcasterProfile?.pfpUrl;
    const player = new PlayerController(terrain, '#3b82f6');
    world.scene.add(player.getMesh());

    // Create avatar rider
    const avatar = new AvatarRider(pfpUrl, displayName);
    player.getMesh().add(avatar.getMesh());

    gameRef.current = { world, terrain, player, avatar };

    // Camera follow player
    const updateCamera = () => {
      const playerPos = player.getPosition();
      const playerRot = player.getRotation();

      // Third-person camera behind and above player
      const cameraDistance = 15;
      const cameraHeight = 8;
      const cameraX = playerPos.x + Math.sin(playerRot) * cameraDistance;
      const cameraZ = playerPos.z + Math.cos(playerRot) * cameraDistance;
      const cameraY = playerPos.y + cameraHeight;

      world.camera.position.lerp(
        { x: cameraX, y: cameraY, z: cameraZ } as any,
        0.1
      );
      world.camera.lookAt(playerPos.x, playerPos.y + 3, playerPos.z);
    };

    // Game loop
    world.startRenderLoop(() => {
      player.update();
      avatar.update();
      updateCamera();
      setIsFlying(player.getIsFlying());
    });

    setIsLoading(false);

    // Cleanup
    return () => {
      world.dispose();
      player.dispose();
      avatar.dispose();
      gameRef.current = null;
    };
  }, [farcasterProfile, playerName]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-400 to-blue-600">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">🐉</div>
            <div className="text-xl font-bold">Loading Dragon World...</div>
          </div>
        </div>
      )}

      {/* Player UI */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white z-50">
        <div className="flex items-center gap-3 mb-2">
          {farcasterProfile?.pfpUrl && (
            <img
              src={farcasterProfile.pfpUrl}
              alt={farcasterProfile.displayName}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
          )}
          <h3 className="font-bold text-lg">
            🐉 {farcasterProfile?.displayName || playerName}
          </h3>
        </div>
        <div className="text-sm space-y-1">
          <div>Level: 1</div>
          <div>HP: 100/100</div>
          <div>Status: {isFlying ? '✈️ Flying' : '🚶 Walking'}</div>
          {farcasterProfile && (
            <div className="text-xs text-gray-300 mt-2">
              FID: {farcasterProfile.fid}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white text-sm z-50">
        <h3 className="font-bold mb-2">🎮 Controls:</h3>
        <div className="space-y-1">
          <div>WASD / Arrows - Move & Rotate</div>
          <div>Space - Jump{isFlying && ' / Ascend'}</div>
          <div>
            F - Toggle Flying:{' '}
            <span className={isFlying ? 'text-green-400' : 'text-red-400'}>
              {isFlying ? 'ON' : 'OFF'}
            </span>
          </div>
          <div>Shift - Sprint</div>
          <div>C - Descend (when flying)</div>
        </div>
      </div>

      {/* FPS Counter */}
      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm z-50">
        <div>Real 3D • Vanilla Three.js</div>
        <div className="text-xs text-gray-300 mt-1">Room: {roomId}</div>
      </div>
    </div>
  );
}
