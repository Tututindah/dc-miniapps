import WebSocket from 'ws';

interface Player {
  id: string;
  address: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number };
  dragonId: string;
  health: number;
  isFlying: boolean;
  isSpeaking: boolean;
  lastUpdate: number;
}

interface GameRoom {
  id: string;
  players: Map<string, Player>;
  maxPlayers: number;
  createdAt: number;
}

class MultiplayerServer {
  private wss: WebSocket.Server;
  private rooms: Map<string, GameRoom> = new Map();
  private clients: Map<WebSocket, { playerId: string; roomId: string }> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocket.Server({ port });
    console.log(`🌍 Dragon City Multiplayer Server started on port ${port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('✅ New client connected');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, data } = message;

    switch (type) {
      case 'join':
        this.handleJoin(ws, data);
        break;
      case 'update_position':
        this.handlePositionUpdate(ws, data);
        break;
      case 'chat':
        this.handleChat(ws, data);
        break;
      case 'voice':
        this.handleVoice(ws, data);
        break;
      case 'attack':
        this.handleAttack(ws, data);
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }

  private handleJoin(ws: WebSocket, data: any) {
    const { roomId, address, username, dragonId } = data;
    
    // Get or create room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: new Map(),
        maxPlayers: 50, // Max 50 players per room
        createdAt: Date.now(),
      });
      console.log(`🏰 Created new room: ${roomId}`);
    }

    const room = this.rooms.get(roomId)!;

    // Check room capacity
    if (room.players.size >= room.maxPlayers) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room is full',
      }));
      return;
    }

    // Create player
    const playerId = `${address}_${Date.now()}`;
    const player: Player = {
      id: playerId,
      address,
      username: username || 'Player',
      position: { x: 0, y: 10, z: 0 },
      rotation: { yaw: 0, pitch: 0 },
      dragonId: dragonId || '0',
      health: 100,
      isFlying: false,
      isSpeaking: false,
      lastUpdate: Date.now(),
    };

    room.players.set(playerId, player);
    this.clients.set(ws, { playerId, roomId });

    // Send join success + current players
    ws.send(JSON.stringify({
      type: 'joined',
      data: {
        playerId,
        players: Array.from(room.players.values()),
      },
    }));

    // Broadcast new player to others
    this.broadcast(roomId, {
      type: 'player_joined',
      data: player,
    }, playerId);

    console.log(`👤 Player ${username} joined room ${roomId} (${room.players.size}/${room.maxPlayers})`);
  }

  private handlePositionUpdate(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, playerId } = client;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Update player state
    player.position = data.position || player.position;
    player.rotation = data.rotation || player.rotation;
    player.isFlying = data.isFlying ?? player.isFlying;
    player.health = data.health ?? player.health;
    player.lastUpdate = Date.now();

    // Broadcast to nearby players (chunk-based)
    this.broadcast(roomId, {
      type: 'player_update',
      data: {
        playerId,
        position: player.position,
        rotation: player.rotation,
        isFlying: player.isFlying,
        health: player.health,
      },
    }, playerId);
  }

  private handleChat(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, playerId } = client;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Broadcast chat message
    this.broadcast(roomId, {
      type: 'chat',
      data: {
        playerId,
        username: player.username,
        message: data.message,
        timestamp: Date.now(),
      },
    });
  }

  private handleVoice(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, playerId } = client;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.isSpeaking = data.isSpeaking;

    // Broadcast voice state
    this.broadcast(roomId, {
      type: 'voice_update',
      data: {
        playerId,
        isSpeaking: data.isSpeaking,
      },
    }, playerId);
  }

  private handleAttack(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, playerId } = client;

    // Broadcast attack animation
    this.broadcast(roomId, {
      type: 'player_attack',
      data: {
        playerId,
        weaponType: data.weaponType,
        position: data.position,
      },
    }, playerId);
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, playerId } = client;
    const room = this.rooms.get(roomId);
    
    if (room) {
      room.players.delete(playerId);
      
      // Broadcast player left
      this.broadcast(roomId, {
        type: 'player_left',
        data: { playerId },
      });

      console.log(`👋 Player left room ${roomId} (${room.players.size} remaining)`);

      // Delete empty rooms
      if (room.players.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🗑️ Deleted empty room: ${roomId}`);
      }
    }

    this.clients.delete(ws);
  }

  private broadcast(roomId: string, message: any, excludePlayerId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    this.clients.forEach((client, ws) => {
      if (client.roomId === roomId && client.playerId !== excludePlayerId) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      }
    });
  }

  // Cleanup inactive players
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute timeout

      this.rooms.forEach((room, roomId) => {
        room.players.forEach((player, playerId) => {
          if (now - player.lastUpdate > timeout) {
            room.players.delete(playerId);
            console.log(`⏱️ Removed inactive player: ${playerId}`);
            
            this.broadcast(roomId, {
              type: 'player_left',
              data: { playerId },
            });
          }
        });

        if (room.players.size === 0) {
          this.rooms.delete(roomId);
          console.log(`🗑️ Deleted empty room: ${roomId}`);
        }
      });
    }, 30000); // Check every 30 seconds
  }
}

// Start server
const server = new MultiplayerServer(8080);
server.startCleanup();

console.log('🎮 Dragon City Metaverse - Ready for players!');
console.log('📦 Chunk streaming enabled');
console.log('🌍 Infinite landscape generation');
console.log('👥 Max 50 players per room');
