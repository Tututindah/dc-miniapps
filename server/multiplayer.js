// WebSocket Multiplayer Server with WebRTC Voice Chat Support
// Run with: node server/multiplayer.js

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Dragon City Multiplayer Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active rooms and players
const rooms = new Map();
const players = new Map(); // Map<websocket, playerData>

console.log('🚀 Dragon City Multiplayer Server starting...');

wss.on('connection', (ws) => {
  console.log('📡 New connection established');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join':
          handleJoin(ws, message.data);
          break;

        case 'player_update':
          handlePlayerUpdate(ws, message.data);
          break;

        case 'chat':
          handleChat(ws, message.data);
          break;

        case 'voice_update':
          handleVoiceUpdate(ws, message.data);
          break;

        case 'webrtc_signal':
          handleWebRTCSignal(ws, message.data);
          break;

        case 'leave':
          handleLeave(ws);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleJoin(ws, data) {
  const { roomId, address, username, dragonId } = data;
  const playerId = generatePlayerId();

  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }

  const room = rooms.get(roomId);
  
  // Create player data
  const playerData = {
    id: playerId,
    ws,
    roomId,
    address,
    username,
    dragonId,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    isSpeaking: false,
    connectedAt: Date.now()
  };

  // Store player
  players.set(ws, playerData);
  room.set(playerId, playerData);

  console.log(`✅ Player ${username} (${playerId}) joined room ${roomId}`);

  // Send join confirmation with current players
  const currentPlayers = Array.from(room.values()).map(p => ({
    id: p.id,
    username: p.username,
    address: p.address,
    dragonId: p.dragonId,
    position: p.position,
    isSpeaking: p.isSpeaking
  }));

  ws.send(JSON.stringify({
    type: 'joined',
    data: {
      playerId,
      players: currentPlayers
    }
  }));

  // Notify other players
  broadcast(roomId, {
    type: 'player_joined',
    data: {
      id: playerId,
      username,
      address,
      dragonId,
      position: playerData.position
    }
  }, playerId);
}

function handlePlayerUpdate(ws, data) {
  const player = players.get(ws);
  if (!player) return;

  // Update player position/rotation
  if (data.position) player.position = data.position;
  if (data.rotation) player.rotation = data.rotation;

  // Broadcast to other players in room
  broadcast(player.roomId, {
    type: 'player_update',
    data: {
      playerId: player.id,
      position: player.position,
      rotation: player.rotation
    }
  }, player.id);
}

function handleChat(ws, data) {
  const player = players.get(ws);
  if (!player) return;

  console.log(`💬 ${player.username}: ${data.message}`);

  // Broadcast chat to room
  broadcast(player.roomId, {
    type: 'chat',
    data: {
      playerId: player.id,
      username: player.username,
      message: data.message,
      timestamp: Date.now()
    }
  });
}

function handleVoiceUpdate(ws, data) {
  const player = players.get(ws);
  if (!player) return;

  player.isSpeaking = data.isSpeaking;

  console.log(`🎤 ${player.username} is ${data.isSpeaking ? 'speaking' : 'silent'}`);

  // Broadcast voice status to room
  broadcast(player.roomId, {
    type: 'voice_update',
    data: {
      playerId: player.id,
      isSpeaking: data.isSpeaking
    }
  }, player.id);
}

function handleWebRTCSignal(ws, data) {
  const player = players.get(ws);
  if (!player) return;

  const { to, signal } = data;
  const room = rooms.get(player.roomId);
  if (!room) return;

  // Find target player
  const targetPlayer = Array.from(room.values()).find(p => p.id === to);
  if (!targetPlayer || !targetPlayer.ws) return;

  console.log(`🔄 WebRTC signal from ${player.id} to ${to}`);

  // Forward signal to target player
  targetPlayer.ws.send(JSON.stringify({
    type: 'webrtc_signal',
    data: {
      from: player.id,
      signal
    }
  }));
}

function handleLeave(ws) {
  const player = players.get(ws);
  if (!player) return;

  const room = rooms.get(player.roomId);
  if (room) {
    room.delete(player.id);
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(player.roomId);
    }

    // Notify other players
    broadcast(player.roomId, {
      type: 'player_left',
      data: {
        playerId: player.id
      }
    });
  }

  players.delete(ws);
  console.log(`👋 Player ${player.username} left room ${player.roomId}`);
}

function handleDisconnect(ws) {
  handleLeave(ws);
}

function broadcast(roomId, message, excludePlayerId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);

  room.forEach((player) => {
    if (player.id !== excludePlayerId && player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(messageStr);
    }
  });
}

function generatePlayerId() {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start server
server.listen(PORT, () => {
  console.log(`🌍 Dragon City Multiplayer Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🎤 WebRTC voice chat signaling enabled`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  wss.clients.forEach((ws) => {
    ws.close();
  });
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Stats logging
setInterval(() => {
  const totalPlayers = players.size;
  const totalRooms = rooms.size;
  if (totalPlayers > 0) {
    console.log(`📊 Stats: ${totalPlayers} players, ${totalRooms} rooms`);
  }
}, 60000); // Every minute
