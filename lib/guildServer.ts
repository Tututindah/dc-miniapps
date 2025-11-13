// Guild Server System - Like Roblox, guild owners can create custom maps
// Server owners can design their own worlds, mini-games, and experiences

export interface GuildMap {
  id: string;
  guildId: string;
  name: string;
  description: string;
  creatorFid: number;
  creatorName: string;
  thumbnail: string;
  biome: string;
  size: { width: number; height: number };
  spawnPoint: { x: number; y: number; z: number };
  blocks: MapBlock[];
  npcs: MapNPC[];
  items: MapItem[];
  scripts: MapScript[];
  settings: MapSettings;
  plays: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapBlock {
  x: number;
  y: number;
  z: number;
  type: 'grass' | 'stone' | 'dirt' | 'water' | 'lava' | 'wood' | 'metal' | 'glass' | 'custom';
  color?: string;
  metadata?: any;
}

export interface MapNPC {
  id: string;
  name: string;
  type: 'friendly' | 'enemy' | 'vendor' | 'quest_giver';
  position: { x: number; y: number; z: number };
  dialogue?: string[];
  quests?: string[];
  shop?: ShopItem[];
}

export interface ShopItem {
  itemId: string;
  price: number;
  currency: 'gold' | 'gems' | 'tokens';
}

export interface MapItem {
  id: string;
  type: 'collectible' | 'powerup' | 'weapon' | 'treasure';
  position: { x: number; y: number; z: number };
  respawnTime?: number;
}

export interface MapScript {
  id: string;
  trigger: 'onEnter' | 'onInteract' | 'onTimer' | 'onDefeat';
  action: string; // JavaScript code to execute
  enabled: boolean;
}

export interface MapSettings {
  maxPlayers: number;
  pvpEnabled: boolean;
  friendlyFire: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  gameMode: 'sandbox' | 'survival' | 'adventure' | 'pvp' | 'racing' | 'minigame';
  weather: 'clear' | 'rain' | 'snow' | 'storm';
  timeOfDay: 'day' | 'night' | 'sunset' | 'dynamic';
}

export interface GuildServer {
  id: string;
  name: string;
  description: string;
  ownerFid: number;
  ownerName: string;
  icon: string;
  banner: string;
  members: GuildMember[];
  maps: GuildMap[];
  roles: GuildRole[];
  permissions: GuildPermissions;
  settings: GuildSettings;
  stats: GuildStats;
  createdAt: Date;
}

export interface GuildMember {
  fid: number;
  username: string;
  role: string;
  joinedAt: Date;
  contributions: number;
}

export interface GuildRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

export interface GuildPermissions {
  canCreateMaps: string[]; // role IDs
  canEditMaps: string[];
  canDeleteMaps: string[];
  canManageMembers: string[];
  canManageRoles: string[];
}

export interface GuildSettings {
  isPublic: boolean;
  requiresApproval: boolean;
  minLevel: number;
  maxMembers: number;
}

export interface GuildStats {
  totalPlays: number;
  totalLikes: number;
  activePlayers: number;
  mapsCreated: number;
}

class GuildServerManager {
  private guilds: Map<string, GuildServer> = new Map();
  private userGuilds: Map<number, string[]> = new Map(); // fid -> guild IDs

  // Create a new guild/server
  async createGuild(
    ownerFid: number,
    ownerName: string,
    name: string,
    description: string
  ): Promise<GuildServer> {
    const guildId = `guild_${Date.now()}_${ownerFid}`;

    const guild: GuildServer = {
      id: guildId,
      name,
      description,
      ownerFid,
      ownerName,
      icon: '',
      banner: '',
      members: [
        {
          fid: ownerFid,
          username: ownerName,
          role: 'owner',
          joinedAt: new Date(),
          contributions: 0,
        },
      ],
      maps: [],
      roles: [
        { id: 'owner', name: 'Owner', color: '#ff0000', permissions: ['*'] },
        { id: 'admin', name: 'Admin', color: '#ff6600', permissions: ['create_map', 'edit_map', 'manage_members'] },
        { id: 'builder', name: 'Builder', color: '#00ff00', permissions: ['create_map', 'edit_map'] },
        { id: 'member', name: 'Member', color: '#0066ff', permissions: ['play'] },
      ],
      permissions: {
        canCreateMaps: ['owner', 'admin', 'builder'],
        canEditMaps: ['owner', 'admin', 'builder'],
        canDeleteMaps: ['owner', 'admin'],
        canManageMembers: ['owner', 'admin'],
        canManageRoles: ['owner'],
      },
      settings: {
        isPublic: true,
        requiresApproval: false,
        minLevel: 1,
        maxMembers: 100,
      },
      stats: {
        totalPlays: 0,
        totalLikes: 0,
        activePlayers: 0,
        mapsCreated: 0,
      },
      createdAt: new Date(),
    };

    this.guilds.set(guildId, guild);

    // Track user's guilds
    const userGuildList = this.userGuilds.get(ownerFid) || [];
    userGuildList.push(guildId);
    this.userGuilds.set(ownerFid, userGuildList);

    return guild;
  }

  // Create custom map in guild (Roblox-style)
  async createGuildMap(
    guildId: string,
    creatorFid: number,
    creatorName: string,
    mapData: Partial<GuildMap>
  ): Promise<GuildMap> {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error('Guild not found');

    // Check permissions
    const member = guild.members.find(m => m.fid === creatorFid);
    if (!member) throw new Error('Not a guild member');

    const hasPermission = guild.permissions.canCreateMaps.includes(member.role);
    if (!hasPermission) throw new Error('No permission to create maps');

    const mapId = `map_${Date.now()}_${creatorFid}`;

    const map: GuildMap = {
      id: mapId,
      guildId,
      name: mapData.name || 'Untitled Map',
      description: mapData.description || '',
      creatorFid,
      creatorName,
      thumbnail: mapData.thumbnail || '',
      biome: mapData.biome || 'plains',
      size: mapData.size || { width: 100, height: 100 },
      spawnPoint: mapData.spawnPoint || { x: 0, y: 10, z: 0 },
      blocks: mapData.blocks || [],
      npcs: mapData.npcs || [],
      items: mapData.items || [],
      scripts: mapData.scripts || [],
      settings: mapData.settings || {
        maxPlayers: 20,
        pvpEnabled: false,
        friendlyFire: false,
        difficulty: 'medium',
        gameMode: 'sandbox',
        weather: 'clear',
        timeOfDay: 'day',
      },
      plays: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    guild.maps.push(map);
    guild.stats.mapsCreated++;

    return map;
  }

  // Get all public guilds
  getPublicGuilds(): GuildServer[] {
    return Array.from(this.guilds.values()).filter(g => g.settings.isPublic);
  }

  // Get user's guilds
  getUserGuilds(fid: number): GuildServer[] {
    const guildIds = this.userGuilds.get(fid) || [];
    return guildIds.map(id => this.guilds.get(id)!).filter(Boolean);
  }

  // Join guild
  async joinGuild(guildId: string, fid: number, username: string): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    if (guild.members.length >= guild.settings.maxMembers) return false;

    const alreadyMember = guild.members.some(m => m.fid === fid);
    if (alreadyMember) return false;

    guild.members.push({
      fid,
      username,
      role: 'member',
      joinedAt: new Date(),
      contributions: 0,
    });

    const userGuildList = this.userGuilds.get(fid) || [];
    userGuildList.push(guildId);
    this.userGuilds.set(fid, userGuildList);

    return true;
  }

  // Get guild maps
  getGuildMaps(guildId: string): GuildMap[] {
    const guild = this.guilds.get(guildId);
    return guild?.maps || [];
  }

  // Load specific map
  getMap(guildId: string, mapId: string): GuildMap | null {
    const guild = this.guilds.get(guildId);
    if (!guild) return null;

    return guild.maps.find(m => m.id === mapId) || null;
  }

  // Update map (for editing)
  async updateMap(
    guildId: string,
    mapId: string,
    editorFid: number,
    updates: Partial<GuildMap>
  ): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    const member = guild.members.find(m => m.fid === editorFid);
    if (!member) return false;

    const hasPermission = guild.permissions.canEditMaps.includes(member.role);
    if (!hasPermission) return false;

    const mapIndex = guild.maps.findIndex(m => m.id === mapId);
    if (mapIndex === -1) return false;

    guild.maps[mapIndex] = {
      ...guild.maps[mapIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return true;
  }

  // Track map play
  incrementMapPlays(guildId: string, mapId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    const map = guild.maps.find(m => m.id === mapId);
    if (map) {
      map.plays++;
      guild.stats.totalPlays++;
    }
  }

  // Like map
  likeMap(guildId: string, mapId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    const map = guild.maps.find(m => m.id === mapId);
    if (map) {
      map.likes++;
      guild.stats.totalLikes++;
    }
  }
}

export const guildServerManager = new GuildServerManager();
