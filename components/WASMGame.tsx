'use client';

import { useEffect, useRef, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, Element, PowerType } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { motion, AnimatePresence } from 'framer-motion';
import { aiWorldGen, AIQuest } from '@/lib/aiWorldGenerator';
import { soundManager } from '@/lib/soundManager';
import { getVoiceChat, VoiceChatState } from '@/lib/voiceChat';

interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

interface TouchPosition {
  x: number;
  y: number;
}

interface WASMGameProps {
  onBack?: () => void;
}

export default function WASMGame({ onBack }: WASMGameProps): JSX.Element {
  const { address } = useAccount();
  const chainId = useChainId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moduleRef = useRef<any>(null);
  const wrappedFunctionsRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());
  
  // NFT Dragon Selection
  const [selectedDragonId, setSelectedDragonId] = useState<bigint | null>(null);
  const [showDragonSelect, setShowDragonSelect] = useState(false);
  
  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220 
    ? CONTRACTS.celo.dragonNFT 
    : CONTRACTS.localhost.dragonNFT;

  const { data: userDragons } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  });

  const { data: selectedDragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: selectedDragonId ? [selectedDragonId] : undefined,
  }) as { data: Dragon | undefined };
  
  // Mobile controls
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState<TouchPosition>({ x: 0, y: 0 });
  const [attackPressed, setAttackPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [farcasterProfile, setFarcasterProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const [fps, setFps] = useState(60);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMaxHealth, setPlayerMaxHealth] = useState(100);
  const [currentWeapon, setCurrentWeapon] = useState(0);
  const [enemyCount, setEnemyCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [roomId] = useState('dragon-metaverse-main');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [nearbyPlayers, setNearbyPlayers] = useState<Map<string, any>>(new Map());
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  // Voice Chat
  const voiceChatRef = useRef<any>(null);
  const [voiceState, setVoiceState] = useState<VoiceChatState>({
    isMuted: true,
    isDeafened: false,
    volume: 1.0,
    hasLocalStream: false,
    activePeers: 0,
    connectedPeers: []
  });
  
  // AI World Generation
  const [currentQuests, setCurrentQuests] = useState<AIQuest[]>([]);
  const [regionStory, setRegionStory] = useState<string>('');
  const [showQuestPanel, setShowQuestPanel] = useState(false);
  const lastPlayerPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  useEffect(() => {
    if (!address || !selectedDragonId) return;

    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('🌍 Connected to multiplayer server');
      
      // Join room
      ws.send(JSON.stringify({
        type: 'join',
        data: {
          roomId,
          address,
          username: farcasterProfile?.username || address.slice(0, 8),
          dragonId: selectedDragonId?.toString() || '0',
        },
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'joined':
          setPlayerId(message.data.playerId);
          setOnlinePlayers(message.data.players.length);
          // Initialize other players
          message.data.players.forEach((player: any) => {
            if (player.id !== message.data.playerId) {
              setNearbyPlayers(prev => new Map(prev).set(player.id, player));
            }
          });
          console.log(`✅ Joined room with ${message.data.players.length} players`);
          break;

        case 'player_joined':
          setNearbyPlayers(prev => new Map(prev).set(message.data.id, message.data));
          setOnlinePlayers(prev => prev + 1);
          console.log(`👤 Player joined: ${message.data.username}`);
          break;

        case 'player_left':
          setNearbyPlayers(prev => {
            const newMap = new Map(prev);
            newMap.delete(message.data.playerId);
            return newMap;
          });
          setOnlinePlayers(prev => Math.max(0, prev - 1));
          break;

        case 'player_update':
          setNearbyPlayers(prev => {
            const player = prev.get(message.data.playerId);
            if (player) {
              return new Map(prev).set(message.data.playerId, {
                ...player,
                ...message.data,
              });
            }
            return prev;
          });
          break;

        case 'chat':
          console.log(`💬 ${message.data.username}: ${message.data.message}`);
          break;

        case 'voice_update':
          setNearbyPlayers(prev => {
            const player = prev.get(message.data.playerId);
            if (player) {
              return new Map(prev).set(message.data.playerId, {
                ...player,
                isSpeaking: message.data.isSpeaking,
              });
            }
            return prev;
          });
          break;

        case 'webrtc_signal':
          // Handle WebRTC signaling for voice chat
          if (voiceChatRef.current) {
            voiceChatRef.current.handleSignal(message.data.from, message.data.signal)
              .then((response: any) => {
                if (response && wsConnection) {
                  wsConnection.send(JSON.stringify({
                    type: 'webrtc_signal',
                    data: {
                      to: message.data.from,
                      signal: response
                    }
                  }));
                }
              });
          }
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from server');
      setWsConnection(null);
      setOnlinePlayers(0);
    };

    setWsConnection(ws);

    return () => {
      ws.close();
    };
  }, [address, selectedDragonId, roomId, farcasterProfile]);

  // Initialize voice chat
  useEffect(() => {
    const voiceChat = getVoiceChat((state) => {
      setVoiceState(state);
      setIsSpeaking(!state.isMuted && state.hasLocalStream);
      
      // Notify other players of speaking status
      if (wsConnection && playerId) {
        wsConnection.send(JSON.stringify({
          type: 'voice_update',
          data: {
            playerId,
            isSpeaking: !state.isMuted && state.hasLocalStream
          }
        }));
      }
    });

    voiceChatRef.current = voiceChat;

    // Request microphone access
    voiceChat.initializeMicrophone().then(success => {
      if (success) {
        console.log('🎤 Voice chat ready');
      } else {
        console.warn('⚠️ Microphone access denied');
      }
    });

    return () => {
      // Cleanup voice chat on unmount
      if (voiceChatRef.current) {
        voiceChatRef.current.destroy();
      }
    };
  }, []);

  // Setup WebRTC connections for nearby players
  useEffect(() => {
    if (!voiceChatRef.current || !wsConnection || !playerId) return;

    nearbyPlayers.forEach((player, peerId) => {
      if (!voiceState.connectedPeers.includes(peerId)) {
        // Create peer connection
        voiceChatRef.current.createPeerConnection(
          peerId,
          true, // We are the initiator
          (targetPeerId: string, signal: any) => {
            // Send WebRTC signal through WebSocket
            wsConnection.send(JSON.stringify({
              type: 'webrtc_signal',
              data: {
                to: targetPeerId,
                signal
              }
            }));
          }
        );
      }
    });
  }, [nearbyPlayers, wsConnection, playerId, voiceState.connectedPeers]);

  // Send position updates to server
  useEffect(() => {
    if (!wsConnection || !playerId) return;

    const interval = setInterval(() => {
      if (wrappedFunctionsRef.current) {
        // Get player position from C++
        const posX = 0, posY = 0, posZ = 0; // TODO: Get from C++ get_player_position
        
        wsConnection.send(JSON.stringify({
          type: 'update_position',
          data: {
            position: { x: posX, y: posY, z: posZ },
            rotation: { yaw: 0, pitch: 0 },
            isFlying,
            health: playerHealth,
          },
        }));
      }
    }, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, [wsConnection, playerId, isFlying, playerHealth]);

  // Auto-select first dragon if only one
  useEffect(() => {
    if (userDragons && (userDragons as bigint[]).length === 1 && !selectedDragonId) {
      setSelectedDragonId((userDragons as bigint[])[0]);
    } else if (userDragons && (userDragons as bigint[]).length > 1 && !selectedDragonId) {
      setShowDragonSelect(true);
    }
  }, [userDragons, selectedDragonId]);

  // Load Farcaster profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setFarcasterProfile({
            fid: context.user.fid,
            username: context.user.username || 'Player',
            displayName: context.user.displayName || 'Player',
            pfpUrl: context.user.pfpUrl || '',
          });
        }
      } catch (error) {
        console.log('Not running in Farcaster context:', error);
      }
    };
    loadProfile();
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Joystick handlers
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setJoystickActive(true);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive || !joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 10;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }
    
    setJoystickPosition({ x: deltaX, y: deltaY });
    
    // Update game input based on joystick position - 3D movement
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;
    
    // Horizontal movement (A/D - Left/Right)
    if (normalizedX < -0.3) {
      keysRef.current.add('a');
      keysRef.current.delete('d');
    } else if (normalizedX > 0.3) {
      keysRef.current.add('d');
      keysRef.current.delete('a');
    } else {
      keysRef.current.delete('a');
      keysRef.current.delete('d');
    }
    
    // Vertical movement (W/S - Forward/Backward in 3D)
    if (normalizedY < -0.3) {
      keysRef.current.add('w'); // Forward
      keysRef.current.delete('s');
    } else if (normalizedY > 0.3) {
      keysRef.current.add('s'); // Backward
      keysRef.current.delete('w');
    } else {
      keysRef.current.delete('w');
      keysRef.current.delete('s');
    }
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    keysRef.current.delete('a');
    keysRef.current.delete('d');
    keysRef.current.delete('w');
    keysRef.current.delete('s');
    keysRef.current.delete(' ');
  };

  // Attack/Speak button handlers
  const handleActionPress = () => {
    soundManager.play('attack_melee', 0.6);
    setAttackPressed(true);
    keysRef.current.add('e');
  };

  const handleActionRelease = () => {
    setAttackPressed(false);
    keysRef.current.delete('e');
  };

  const toggleSpeak = () => {
    if (voiceChatRef.current) {
      const newMutedState = voiceChatRef.current.toggleMute();
      setIsSpeaking(!newMutedState);
      
      // Play sound feedback
      soundManager.play(newMutedState ? 'click' : 'notification', 0.5);
      
      console.log(newMutedState ? '🔇 Muted' : '🎤 Unmuted');
    }
  };

  const toggleDeafen = () => {
    if (voiceChatRef.current) {
      const isDeafened = voiceChatRef.current.toggleDeafen();
      soundManager.play('click', 0.5);
      console.log(isDeafened ? '🔇 Deafened' : '🔊 Undeafened');
    }
  };

  // Load building texture sprites - DISABLED for 3D voxel mode
  /*
  const loadBuildingTextures = async (wasmModule: any, functions: any) => {
    const buildingTypes = [
      { name: 'castle', type: 0 },
      { name: 'fortress', type: 1 },
      { name: 'farm', type: 2 },
      { name: 'tower', type: 3 },
      { name: 'temple', type: 4 },
    ];

    for (const building of buildingTypes) {
      try {
        // Try loading PNG sprite
        const response = await fetch(`/assets/buildings/${building.name}.png`);
        if (!response.ok) {
          console.log(`[Texture] ${building.name}.png not found, using fallback`);
          continue;
        }

        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        // Create canvas to extract RGBA data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = bitmap.width;
        tempCanvas.height = bitmap.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) continue;
        
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        
        // Allocate WASM memory for texture data
        const dataPtr = wasmModule._malloc(imageData.data.length);
        wasmModule.HEAPU8.set(imageData.data, dataPtr);
        
        // Load texture into OpenGL
        const textureId = functions.load_building_texture(bitmap.width, bitmap.height, dataPtr);
        
        // Free memory
        wasmModule._free(dataPtr);
        
        // Set texture for building type
        functions.set_village_texture(building.type, textureId);
        
        console.log(`[Texture] ✅ Loaded ${building.name}.png (${bitmap.width}x${bitmap.height}) -> ID ${textureId}`);
      } catch (error) {
        console.warn(`[Texture] Failed to load ${building.name}:`, error);
      }
    }
  };
  */

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let animationId: number;
    let lastTime = 0;
    let frameCount = 0;
    let fpsTime = 0;

    const loadWASMEngine = async () => {
      try {
          // Load the WASM module by injecting the generated loader script at runtime.
          // The Emscripten build exposes a factory `DragonCityEngine` on window which
          // must be invoked to instantiate the module.
          let EngineFactory: any = (window as any).DragonCityEngine;
          if (!EngineFactory) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = `/wasm/dragon_city.js?v=${Date.now()}`;
              script.async = true;
              script.onload = () => {
                EngineFactory = (window as any).DragonCityEngine;
                if (!EngineFactory) return reject(new Error('DragonCityEngine factory not found on window'));
                resolve();
              };
              script.onerror = () => reject(new Error('Failed to load /wasm/dragon_city.js'));
              document.head.appendChild(script);
            });
          }

          const wasmModule = await EngineFactory({
            canvas: canvas,
            locateFile: (path: string) => {
              if (path.endsWith('.wasm')) {
                return `/wasm/${path}?v=${Date.now()}`;
              }
              return path;
            }
          });
          moduleRef.current = wasmModule;

        console.log('✅ WASM module loaded successfully');
        console.log('Canvas element:', canvas);
        console.log('Available functions:', Object.keys(wasmModule).filter(k => typeof wasmModule[k] === 'function'));

        // Wrap C functions for easier calling - 3D controls
        const wrappedFunctions = {
          init_game: wasmModule.cwrap('init_game', null, ['number', 'number']),
          update_game: wasmModule.cwrap('update_game', null, ['number']),
          render_game: wasmModule.cwrap('render_game', null, []),
          set_input: wasmModule.cwrap('set_input', null, ['number', 'number', 'number']),
          set_backward: wasmModule.cwrap('set_backward', null, ['number']),
          set_jump: wasmModule.cwrap('set_jump', null, ['number']),
          set_fly_mode: wasmModule.cwrap('set_fly_mode', null, ['number']),
          set_dragon_color: wasmModule.cwrap('set_dragon_color', null, ['number', 'number', 'number']),
          set_attack: wasmModule.cwrap('set_attack', null, ['number']),
          set_weapon: wasmModule.cwrap('set_weapon', null, ['number']),
          get_player_health: wasmModule.cwrap('get_player_health', 'number', []),
          get_player_max_health: wasmModule.cwrap('get_player_max_health', 'number', []),
          get_current_weapon: wasmModule.cwrap('get_current_weapon', 'number', []),
          get_entity_count: wasmModule.cwrap('get_entity_count', 'number', []),
          load_building_texture: wasmModule.cwrap('load_building_texture', 'number', ['number', 'number', 'number']),
          cleanup_game: wasmModule.cwrap('cleanup_game', null, []),
        };
        wrappedFunctionsRef.current = wrappedFunctions;

        // Initialize game
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        console.log(`🎮 Initializing game with ${width}x${height}`);
        wrappedFunctions.init_game(width, height);
        console.log('✅ Game initialized');
        
        // Building textures disabled for 3D voxel mode
        // await loadBuildingTextures(wasmModule, wrappedFunctions);

        // Set dragon color based on Farcaster profile or default
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          } : { r: 0.23, g: 0.51, b: 0.96 };
        };

        const color = hexToRgb('#3b82f6');
        wrappedFunctions.set_dragon_color(color.r, color.g, color.b);
        console.log('🐉 Dragon color set:', color);

        setIsLoading(false);
        console.log('🎬 Starting game loop...');

        // Game loop
        const gameLoop = (time: number) => {
          if (!wrappedFunctionsRef.current) return;
          
          const deltaTime = (time - lastTime) / 1000;
          lastTime = time;

          // Update input for 3D movement (WASD + flying)
          const left = keysRef.current.has('a') || keysRef.current.has('A') || keysRef.current.has('ArrowLeft');
          const right = keysRef.current.has('d') || keysRef.current.has('D') || keysRef.current.has('ArrowRight');
          const forward = keysRef.current.has('w') || keysRef.current.has('W') || keysRef.current.has('ArrowUp');
          const backward = keysRef.current.has('s') || keysRef.current.has('S') || keysRef.current.has('ArrowDown');
          const flyUp = keysRef.current.has(' '); // Space to fly up
          const flyDown = keysRef.current.has('Shift'); // Shift to fly down
          const attack = keysRef.current.has('e') || keysRef.current.has('E');

          wrappedFunctionsRef.current.set_input(left ? 1 : 0, right ? 1 : 0, forward ? 1 : 0);
          wrappedFunctionsRef.current.set_backward(backward ? 1 : 0);
          wrappedFunctionsRef.current.set_jump(flyUp ? 1 : 0);
          wrappedFunctionsRef.current.set_fly_mode(isFlying ? 1 : 0);
          wrappedFunctionsRef.current.set_attack(attack ? 1 : 0);

          // Get game state from C++
          const health = wrappedFunctionsRef.current.get_player_health();
          const maxHealth = wrappedFunctionsRef.current.get_player_max_health();
          const weapon = wrappedFunctionsRef.current.get_current_weapon();
          const entityCount = wrappedFunctionsRef.current.get_entity_count();

          // Update game
          wrappedFunctionsRef.current.update_game(time / 1000);
          
          // AI World Discovery - check every 60 frames (~1 second)
          if (frameCount % 60 === 0) {
            const playerX = 0; // You can track actual player position if needed
            const playerZ = 0;
            
            // Discover new areas
            aiWorldGen.discoverNewArea(playerX, playerZ).then(discovered => {
              if (discovered) {
                console.log('🗺️ New area discovered!');
                // Load region story
                aiWorldGen.getRegionStory(playerX, playerZ).then(story => {
                  setRegionStory(story);
                });
              }
            });
            
            // Update nearby quests
            const quests = aiWorldGen.getNearbyQuests(playerX, playerZ);
            if (quests.length > 0) {
              setCurrentQuests(quests);
            }
          }

          // Render
          wrappedFunctionsRef.current.render_game();

          // Calculate FPS
          frameCount++;
          fpsTime += deltaTime;
          if (fpsTime >= 1.0) {
            setFps(frameCount);
            setPlayerHealth(health);
            setPlayerMaxHealth(maxHealth);
            setCurrentWeapon(weapon);
            setEnemyCount(entityCount);
            frameCount = 0;
            fpsTime = 0;
          }

          animationId = requestAnimationFrame(gameLoop);
        };

        animationId = requestAnimationFrame(gameLoop);
      } catch (error) {
        console.error('Failed to load WASM engine:', error);
        setIsLoading(false);
      }
    };

    loadWASMEngine();

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      // Toggle fly mode with F key
      if (e.key === 'f' || e.key === 'F') {
        setIsFlying(prev => !prev);
      }
      
      // Weapon switching
      if (wrappedFunctionsRef.current) {
        if (e.key === '1') wrappedFunctionsRef.current.set_weapon(0); // Fist
        if (e.key === '2') wrappedFunctionsRef.current.set_weapon(1); // Sword
        if (e.key === '3') wrappedFunctionsRef.current.set_weapon(2); // Bow
        if (e.key === '4') wrappedFunctionsRef.current.set_weapon(3); // Staff
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    // Window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (wrappedFunctionsRef.current) {
        wrappedFunctionsRef.current.cleanup_game();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden" style={{ touchAction: 'none', height: '100dvh' }}>

      {/* 3D Roblox-style terrain background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #C4E4F7 100%)',
          zIndex: 0
        }}
      />
      
      {/* 3D Isometric Ground Grid - Roblox style */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Ground texture pattern - single dirt texture */}
            <pattern id="dirtTexture" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#8B7355"/>
              <rect x="0" y="0" width="50" height="50" fill="#A0826D" opacity="0.3"/>
              <rect x="50" y="50" width="50" height="50" fill="#A0826D" opacity="0.3"/>
              <rect x="25" y="25" width="10" height="10" fill="#6B5344" opacity="0.5" rx="2"/>
              <rect x="70" y="15" width="8" height="8" fill="#6B5344" opacity="0.5" rx="2"/>
              <rect x="15" y="70" width="12" height="12" fill="#6B5344" opacity="0.5" rx="2"/>
              <rect x="60" y="75" width="6" height="6" fill="#6B5344" opacity="0.5" rx="2"/>
            </pattern>
            
            {/* 3D block shadow */}
            <filter id="blockShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="4" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* 3D Terrain blocks - Roblox/GTA style isometric grid - WIDER MAP */}
          {/* Bottom layer - foundation */}
          {Array.from({ length: 20 }).map((_, row) => (
            <g key={`row-${row}`}>
              {Array.from({ length: 28 }).map((_, col) => {
                const x = col * 60 - row * 30;
                const y = row * 30 + col * 15 + 200;
                const blockHeight = 40;
                const isEdge = row === 0 || col === 0 || row === 11 || col === 15;
                
                return (
                  <g key={`block-${row}-${col}`} filter="url(#blockShadow)">
                    {/* Top face - dirt texture */}
                    <path
                      d={`M ${x},${y} L ${x + 60},${y + 15} L ${x + 60},${y + 15 + blockHeight} L ${x},${y + blockHeight} Z`}
                      fill="url(#dirtTexture)"
                      opacity="0.95"
                    />
                    {/* Right face - darker */}
                    <path
                      d={`M ${x + 60},${y + 15} L ${x + 90},${y} L ${x + 90},${y + blockHeight} L ${x + 60},${y + 15 + blockHeight} Z`}
                      fill="#6B5344"
                      opacity="0.8"
                    />
                    {/* Left face - medium */}
                    <path
                      d={`M ${x},${y} L ${x + 30},${y - 15} L ${x + 90},${y} L ${x + 60},${y + 15} Z`}
                      fill="#A0826D"
                      opacity="0.9"
                    />
                    {/* Edge highlight for depth */}
                    {isEdge && (
                      <path
                        d={`M ${x},${y} L ${x + 30},${y - 15} L ${x + 90},${y} L ${x + 60},${y + 15} Z`}
                        fill="white"
                        opacity="0.1"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          ))}
          
          {/* Grid lines for Roblox-style look - WIDER MAP */}
          {Array.from({ length: 20 }).map((_, row) => (
            <line
              key={`grid-h-${row}`}
              x1={-row * 30}
              y1={row * 30 + 100}
              x2={1680 - row * 30}
              y2={row * 30 + 640}
              stroke="#5A4A3A"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {Array.from({ length: 28 }).map((_, col) => (
            <line
              key={`grid-v-${col}`}
              x1={col * 60}
              y1={col * 15 + 100}
              x2={col * 60 - 570}
              y2={col * 15 + 730}
              stroke="#5A4A3A"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
        </svg>
      </div>

      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 2, width: '100vw', height: '100vh', display: 'block', background: 'transparent' }}
      />

      {/* UI Overlay */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 pointer-events-none z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
          {/* Player info */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-4 pointer-events-auto w-full sm:w-auto">
            {farcasterProfile ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {farcasterProfile.pfpUrl && (
                  <img
                    src={farcasterProfile.pfpUrl}
                    alt="Profile"
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-purple-500"
                  />
                )}
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base">
                    {farcasterProfile.displayName}
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    @{farcasterProfile.username}
                  </p>
                  <p className="text-purple-400 text-xs hidden sm:block">
                    FID: {farcasterProfile.fid}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-white">
                <h3 className="font-bold text-sm sm:text-base">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Player'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300">Room: {roomId}</p>
              </div>
            )}
          </div>

          {/* Performance stats - hidden on mobile */}
          <div className="hidden sm:block bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
            <div className="text-white text-sm space-y-1">
              <div>FPS: <span className="font-mono">{fps}</span></div>
              <div className="text-green-400">
                Engine: <span className="font-mono">C++ WASM</span>
              </div>
              {isFlying && (
                <div className="text-yellow-400 font-bold">
                  ✈️ FLYING
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player Health Bar */}
        <div className="mt-2 bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 max-w-xs">
          <div className="text-white text-xs mb-1">Health</div>
          <div className="w-full h-4 sm:h-6 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
              style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
            >
              <div className="text-white text-xs font-bold text-center leading-4 sm:leading-6">
                {Math.round(playerHealth)} / {playerMaxHealth}
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Mobile Controls */}
      {isMobile && (
        <>
          {/* Virtual Joystick - Left Side */}
          <div className="absolute bottom-4 left-4 pointer-events-auto z-20">
            <div
              ref={joystickRef}
              className="relative w-32 h-32 sm:w-40 sm:h-40 bg-black/40 backdrop-blur-sm rounded-full border-4 border-white/30"
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
            >
              {/* Directional indicators - 3D movement */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/70 text-xs font-bold">W</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/70 text-xs font-bold">S</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 text-xs font-bold">A</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 text-xs font-bold">D</div>
              
              {/* Center knob */}
              <div
                ref={joystickKnobRef}
                className="absolute top-1/2 left-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-4 border-white shadow-lg transition-transform"
                style={{
                  transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                  🎮
                </div>
              </div>
            </div>
            <p className="text-white/70 text-xs text-center mt-2">Move</p>
          </div>

          {/* Action Buttons - Right Side */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-3 pointer-events-auto z-20">
            {/* Voice Controls */}
            <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
              {/* Mic Toggle Button */}
              <button
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-lg transition-all active:scale-95 ${
                  !voiceState.isMuted && voiceState.hasLocalStream
                    ? 'bg-green-600 border-green-400 shadow-green-500/50 animate-pulse'
                    : 'bg-red-600 border-red-400'
                }`}
                onClick={toggleSpeak}
                title={voiceState.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                <div className="text-white text-xl sm:text-2xl">
                  {voiceState.isMuted ? '🔇' : '🎤'}
                </div>
              </button>
              <p className="text-white/70 text-xs text-center">
                {voiceState.isMuted ? 'Muted' : 'Speaking'}
              </p>

              {/* Deafen Toggle Button */}
              <button
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 shadow-lg transition-all active:scale-95 ${
                  voiceState.isDeafened
                    ? 'bg-red-600 border-red-400'
                    : 'bg-gray-600 border-gray-400'
                }`}
                onClick={toggleDeafen}
                title={voiceState.isDeafened ? 'Undeafen' : 'Deafen (mute others)'}
              >
                <div className="text-white text-lg sm:text-xl">
                  {voiceState.isDeafened ? '🔇' : '🔊'}
                </div>
              </button>
              <p className="text-white/70 text-[10px] text-center">
                {voiceState.isDeafened ? 'Deafened' : 'Hearing'}
              </p>

              {/* Active Peers Indicator */}
              {voiceState.activePeers > 0 && (
                <div className="text-white/90 text-xs font-bold bg-blue-600/80 px-2 py-1 rounded">
                  {voiceState.activePeers} 👥
                </div>
              )}
            </div>

            {/* Speak/Chat Button - LEGACY (kept for text chat) */}
            <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
              <button
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 shadow-lg transition-all active:scale-95 bg-blue-500 border-blue-300"
                onClick={() => {
                  soundManager.play('notification', 0.5);
                  // TODO: Open text chat
                }}
              >
                <div className="text-white text-lg sm:text-xl">💬</div>
              </button>
              <p className="text-white/70 text-[10px] text-center">Chat</p>
            </div>

            {/* Fly Up Button (Space) */}
            <div className="flex flex-col items-center gap-2">
              <button
                className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500 border-yellow-300 rounded-full border-4 shadow-lg transition-all active:scale-95 active:bg-yellow-600"
                onTouchStart={(e) => { e.preventDefault(); keysRef.current.add(' '); }}
                onTouchEnd={(e) => { e.preventDefault(); keysRef.current.delete(' '); }}
                onMouseDown={() => keysRef.current.add(' ')}
                onMouseUp={() => keysRef.current.delete(' ')}
              >
                <div className="text-white text-xl sm:text-2xl">🚀</div>
              </button>
              <p className="text-white/70 text-xs">Fly Up</p>
            </div>
            
            {/* Fly Down Button (Shift) */}
            <div className="flex flex-col items-center gap-2">
              <button
                className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500 border-purple-300 rounded-full border-4 shadow-lg transition-all active:scale-95 active:bg-purple-600"
                onTouchStart={(e) => { e.preventDefault(); keysRef.current.add('Shift'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysRef.current.delete('Shift'); }}
                onMouseDown={() => keysRef.current.add('Shift')}
                onMouseUp={() => keysRef.current.delete('Shift')}
              >
                <div className="text-white text-xl sm:text-2xl">⬇️</div>
              </button>
              <p className="text-white/70 text-xs">Fly Down</p>
            </div>
            
            {/* Toggle Fly Mode */}
            <div className="flex flex-col items-center gap-2">
              <button
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-lg transition-all active:scale-95 ${
                  isFlying
                    ? 'bg-cyan-600 border-cyan-400 shadow-cyan-500/50'
                    : 'bg-gray-600 border-gray-400'
                }`}
                onClick={() => setIsFlying(!isFlying)}
              >
                <div className="text-white text-xl sm:text-2xl">{isFlying ? '✈️' : '🚶'}</div>
              </button>
              <p className="text-white/70 text-xs">Fly Mode</p>
            </div>
          </div>
        </>
      )}

      {/* Desktop Controls */}
      {!isMobile && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto max-w-2xl mx-auto">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-2xl">🐉</span>
              Dragon 3D World Controls
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <div><kbd className="px-2 py-1 bg-gray-700 rounded">W/S</kbd> or <kbd className="px-2 py-1 bg-gray-700 rounded">↑/↓</kbd> Forward/Back</div>
              <div><kbd className="px-2 py-1 bg-gray-700 rounded">A/D</kbd> or <kbd className="px-2 py-1 bg-gray-700 rounded">←/→</kbd> Left/Right</div>
              <div><kbd className="px-2 py-1 bg-gray-700 rounded">Space</kbd> Fly Up</div>
              <div><kbd className="px-2 py-1 bg-gray-700 rounded">Shift</kbd> Fly Down</div>
              <div><kbd className="px-2 py-1 bg-gray-700 rounded">F</kbd> Toggle Fly Mode</div>
              <div className="text-green-400 flex items-center gap-2">
                <span className="animate-pulse">⚡</span>
                3D Sandbox Mode - Fly Anywhere!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 z-50">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <img 
                src="/assets/dragons/dragon-idle.svg" 
                alt="Loading Dragon"
                className="w-full h-full animate-bounce"
              />
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-white text-xl font-bold mb-2">Loading Dragon Engine...</p>
            <p className="text-purple-400 text-sm">Compiling C++ WebAssembly</p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {!voiceState.isMuted && voiceState.hasLocalStream && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-8 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-12 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
              <div className="w-2 h-10 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-8 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-white font-bold">🎤 Speaking...</span>
          </div>
        </div>
      )}

      {/* Online Players List with Voice Status */}
      {nearbyPlayers.size > 0 && (
        <div className="absolute top-20 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 max-w-xs z-40 pointer-events-auto">
          <div className="text-white font-bold text-sm mb-2 flex items-center gap-2">
            <span>👥 Online Players ({nearbyPlayers.size})</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Array.from(nearbyPlayers.values()).map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-2 p-2 rounded ${
                  player.isSpeaking ? 'bg-green-600/30 border border-green-400' : 'bg-white/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${player.isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-white text-xs flex-1 truncate">{player.username || player.id.slice(0, 8)}</span>
                {player.isSpeaking && (
                  <span className="text-green-400 text-xs">🎤</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Quest Panel - Toggle Button */}
      <motion.button
        onClick={() => setShowQuestPanel(!showQuestPanel)}
        className="absolute bottom-24 right-4 z-40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-full shadow-lg font-bold"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        📜 Quests {currentQuests.length > 0 && `(${currentQuests.length})`}
      </motion.button>

      {/* AI Quest Panel */}
      <AnimatePresence>
        {showQuestPanel && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 w-96 h-full bg-black/90 backdrop-blur-xl p-6 overflow-y-auto z-50 border-l-4 border-purple-500"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>📜</span> AI Quest Log
              </h2>
              <button
                onClick={() => setShowQuestPanel(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Region Story */}
            {regionStory && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-500/30">
                <h3 className="text-lg font-bold text-purple-300 mb-2">🗺️ Current Region</h3>
                <p className="text-white/80 text-sm italic">{regionStory}</p>
              </div>
            )}

            {/* Active Quests */}
            <div className="space-y-4">
              {currentQuests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🐉</div>
                  <p className="text-white/60">Explore the world to discover quests!</p>
                  <p className="text-white/40 text-sm mt-2">AI generates new adventures as you travel</p>
                </div>
              ) : (
                currentQuests.map(quest => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg border-2 border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-bold text-lg">{quest.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        quest.difficulty === 'easy' ? 'bg-green-600' :
                        quest.difficulty === 'medium' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {quest.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{quest.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-300">📍 {quest.location.x}, {quest.location.z}</span>
                      <span className="text-yellow-300">🎁 {quest.reward}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* AI Info */}
            <div className="mt-6 p-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/20">
              <p className="text-green-300 text-xs font-bold mb-1">🤖 AI World Generation</p>
              <p className="text-white/60 text-xs">The world expands dynamically as you explore. Each region has unique stories, quests, and features generated by AI.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
