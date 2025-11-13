export interface AIWorldSeed {
  biome: 'plains' | 'mountains' | 'desert' | 'forest' | 'volcanic' | 'frozen';
  mood: 'peaceful' | 'mysterious' | 'dangerous' | 'magical';
  landmarks: string[];
  story: string;
}

export interface AIQuest {
  id: string;
  title: string;
  description: string;
  location: { x: number; z: number };
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIWorldRegion {
  centerX: number;
  centerZ: number;
  radius: number;
  biome: string;
  features: AIWorldFeature[];
  quests: AIQuest[];
  story: string;
}

export interface AIWorldFeature {
  type: 'village' | 'dungeon' | 'temple' | 'tower' | 'cave' | 'monument';
  x: number;
  z: number;
  name: string;
  description: string;
}

class AIWorldGenerator {
  private regions: Map<string, AIWorldRegion> = new Map();
  private seenCoordinates: Set<string> = new Set();

  // Generate AI-powered world region
  async generateRegion(centerX: number, centerZ: number): Promise<AIWorldRegion> {
    const key = `${Math.floor(centerX / 100)}_${Math.floor(centerZ / 100)}`;
    
    if (this.regions.has(key)) {
      return this.regions.get(key)!;
    }

    // AI-generated biome based on coordinates
    const biomes = ['plains', 'mountains', 'desert', 'forest', 'volcanic', 'frozen'];
    const biome = biomes[Math.abs(Math.floor(centerX + centerZ)) % biomes.length];

    // Generate AI story for this region
    const story = this.generateRegionStory(biome, centerX, centerZ);

    // Generate features (villages, dungeons, etc)
    const features = this.generateFeatures(biome, centerX, centerZ);

    // Generate quests based on features and story
    const quests = this.generateQuests(features, biome, story);

    const region: AIWorldRegion = {
      centerX,
      centerZ,
      radius: 100,
      biome,
      features,
      quests,
      story,
    };

    this.regions.set(key, region);
    return region;
  }

  // AI-powered story generation
  private generateRegionStory(biome: string, x: number, z: number): string {
    const storyTemplates = {
      plains: [
        `The Golden Plains stretch endlessly, where ancient dragon riders once trained their mighty companions. Whispers say a legendary egg lies buried beneath the windmills.`,
        `Peaceful grasslands hide a dark secret - nighttime brings shadow beasts. The village elder seeks brave souls to investigate.`,
        `A mysterious portal has appeared in the meadow, leaking magical energy. Dragons are drawn to its power.`,
      ],
      mountains: [
        `The Skyreach Peaks hold the ruins of an ancient civilization. Crystal caves within contain dragon soul shards.`,
        `Mountain clans speak of a sleeping dragon at the summit. Its awakening could change the world forever.`,
        `Treacherous paths lead to a hidden monastery where monks train telepathic bonds with dragons.`,
      ],
      desert: [
        `The Burning Sands conceal an oasis city where fire dragons are worshipped as gods.`,
        `Ancient pyramids pulse with elemental energy. Inside, trials await worthy dragon tamers.`,
        `Sandstorms reveal forgotten ruins - temples dedicated to the Sun Dragon, first of its kind.`,
      ],
      forest: [
        `The Whispering Woods are alive with magic. Nature dragons protect an ancient World Tree.`,
        `Deep within the forest, a circle of druids maintains balance. They need help defending against corruption.`,
        `Fairy dragons lead adventurers to hidden groves where time flows differently.`,
      ],
      volcanic: [
        `The Molten Wastes are home to fire dragon clans. Lava flows form natural arenas for combat trials.`,
        `A volcano about to erupt contains the heart of an elder dragon. Its power could forge legendary weapons.`,
        `Obsidian towers rise from magma lakes - forges where dragon armor is crafted.`,
      ],
      frozen: [
        `The Frost Lands preserve dragons from ancient times, frozen in ice but still alive.`,
        `Ice castles house a kingdom of frost dragons at war with fire clans from the south.`,
        `Northern lights reveal paths to the Aurora Temple, where cosmic dragons gather.`,
      ],
    };

    const templates = storyTemplates[biome as keyof typeof storyTemplates] || storyTemplates.plains;
    const seed = Math.abs(x + z * 1000);
    return templates[seed % templates.length];
  }

  // Generate world features procedurally
  private generateFeatures(biome: string, centerX: number, centerZ: number): AIWorldFeature[] {
    const features: AIWorldFeature[] = [];
    const featureCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < featureCount; i++) {
      const angle = (Math.PI * 2 * i) / featureCount;
      const distance = 30 + Math.random() * 50;
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;

      const types: AIWorldFeature['type'][] = ['village', 'dungeon', 'temple', 'tower', 'cave', 'monument'];
      const type = types[Math.floor(Math.random() * types.length)];

      features.push({
        type,
        x: Math.floor(x),
        z: Math.floor(z),
        name: this.generateFeatureName(type, biome),
        description: this.generateFeatureDescription(type, biome),
      });
    }

    return features;
  }

  private generateFeatureName(type: AIWorldFeature['type'], biome: string): string {
    const names = {
      village: ['Dragonhaven', 'Skywatch', 'Emberhold', 'Frostmoor', 'Verdant Rest', 'Sunspire'],
      dungeon: ['Shadow Depths', 'Cursed Crypt', 'Forgotten Lair', 'Dark Hollow', 'Nightmare Pit'],
      temple: ['Temple of Wings', 'Sacred Sanctuary', 'Shrine of Scales', 'Holy Roost', 'Divine Nest'],
      tower: ['Wizard\'s Spire', 'Mage Tower', 'Arcane Peak', 'Mystic Pinnacle', 'Star Observatory'],
      cave: ['Crystal Cavern', 'Echo Grotto', 'Hidden Hollow', 'Secret Depths', 'Ancient Cave'],
      monument: ['Dragon Statue', 'Ancient Obelisk', 'Memorial Stone', 'Victory Monument', 'Hero\'s Rest'],
    };

    const typeNames = names[type];
    return typeNames[Math.floor(Math.random() * typeNames.length)];
  }

  private generateFeatureDescription(type: AIWorldFeature['type'], biome: string): string {
    const descriptions = {
      village: `A bustling settlement where dragon riders gather. Merchants sell rare items and quests await.`,
      dungeon: `A dangerous underground complex filled with treasures and enemies. High risk, high reward.`,
      temple: `A sacred place of worship. Priests offer blessings and teach ancient dragon magic.`,
      tower: `A tall structure housing powerful mages. They study dragon bond magic and offer training.`,
      cave: `A natural formation hiding secrets. Glowing crystals illuminate mysterious passages.`,
      monument: `An ancient structure commemorating past events. Touching it reveals visions of history.`,
    };

    return descriptions[type];
  }

  // Generate quests based on region
  private generateQuests(features: AIWorldFeature[], biome: string, story: string): AIQuest[] {
    const quests: AIQuest[] = [];

    // Generate 1-3 quests per region
    const questCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < questCount; i++) {
      const feature = features[Math.floor(Math.random() * features.length)];
      
      quests.push({
        id: `quest_${Date.now()}_${i}`,
        title: this.generateQuestTitle(feature.type, biome),
        description: this.generateQuestDescription(feature, biome),
        location: { x: feature.x, z: feature.z },
        reward: this.generateQuestReward(),
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
      });
    }

    return quests;
  }

  private generateQuestTitle(featureType: string, biome: string): string {
    const titles = [
      `Explore the ${featureType}`,
      `Mystery of the ${biome}`,
      `Dragon Riders Needed`,
      `Ancient Secret Revealed`,
      `Protect the Settlement`,
      `Gather Rare Resources`,
      `Defeat the Threat`,
      `Unlock Hidden Power`,
      `Find the Lost Artifact`,
      `Help the Locals`,
    ];

    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateQuestDescription(feature: AIWorldFeature, biome: string): string {
    return `Travel to ${feature.name} and investigate strange occurrences. Locals report unusual dragon activity and mysterious energy signatures. Your skills are needed!`;
  }

  private generateQuestReward(): string {
    const rewards = [
      '500 Gold + Rare Dragon Egg',
      '1000 XP + Epic Weapon',
      'Legendary Dragon Saddle',
      '2000 Gold + Skill Point',
      'Ancient Dragon Tome',
      'Enchanted Armor Set',
      'Dragon Bond Amplifier',
    ];

    return rewards[Math.floor(Math.random() * rewards.length)];
  }

  // Get nearby quests
  getNearbyQuests(playerX: number, playerZ: number, radius: number = 200): AIQuest[] {
    const nearby: AIQuest[] = [];

    for (const region of Array.from(this.regions.values())) {
      for (const quest of region.quests) {
        const dx = quest.location.x - playerX;
        const dz = quest.location.z - playerZ;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= radius) {
          nearby.push(quest);
        }
      }
    }

    return nearby;
  }

  // Get region story
  async getRegionStory(playerX: number, playerZ: number): Promise<string> {
    const region = await this.generateRegion(playerX, playerZ);
    return region.story;
  }

  // Discover new area (expansion system)
  async discoverNewArea(playerX: number, playerZ: number): Promise<boolean> {
    const key = `${Math.floor(playerX / 10)}_${Math.floor(playerZ / 10)}`;
    
    if (this.seenCoordinates.has(key)) {
      return false;
    }

    this.seenCoordinates.add(key);
    await this.generateRegion(playerX, playerZ);
    return true; // New area discovered!
  }
}

export const aiWorldGen = new AIWorldGenerator();
