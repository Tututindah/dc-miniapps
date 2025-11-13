'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Mission, MissionType, MissionStatus, missionManager, CreateMissionParams, MissionSystemManager } from '@/lib/missionSystem';
import { soundManager } from '@/lib/soundManager';
import { storyGenerator, StoryMission } from '@/lib/aiStoryGenerator';

interface MissionBoardProps {
  userDragonId?: bigint;
  canCreateMissions?: boolean;
}

export default function MissionBoard({ userDragonId, canCreateMissions = false }: MissionBoardProps) {
  const { address } = useAccount();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [storyMissions, setStoryMissions] = useState<StoryMission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedStoryMission, setSelectedStoryMission] = useState<StoryMission | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'story' | 'my-missions' | 'completed'>('story');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(15); // Mock player level

  // Load AI story missions
  useEffect(() => {
    const generatedMissions = storyGenerator.generateMissionBatch(playerLevel, 5);
    setStoryMissions(generatedMissions);
    soundManager.play('notification', 0.5);
  }, [playerLevel]);

  // Mock missions data
  useEffect(() => {
    const mockMissions: Mission[] = [
      {
        id: '1',
        creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        creatorDragonId: '5',
        missionType: MissionType.FOLLOW_FARCASTER,
        title: 'Follow Dragon Master',
        description: 'Follow @dragonmaster on Farcaster to unlock exclusive dragon breeding tips!',
        verificationData: { fid: '12345', farcasterUsername: 'dragonmaster' },
        rewardETH: '0.01',
        rewardTokens: '100',
        expMultiplier: 1500,
        maxCompletions: 100,
        completionsCount: 45,
        expiresAt: Date.now() / 1000 + 604800,
        status: MissionStatus.ACTIVE,
        requiresVerification: true
      },
      {
        id: '2',
        creator: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        creatorDragonId: '12',
        missionType: MissionType.ADD_LIQUIDITY,
        title: 'Become a Liquidity Provider',
        description: 'Add at least 0.1 ETH to the DRAGON/ETH pool and earn trading fees!',
        verificationData: { poolContract: '0x...', minAmount: '0.1', tokenA: 'DRAGON', tokenB: 'ETH' },
        rewardETH: '0.05',
        rewardTokens: '500',
        expMultiplier: 3000,
        maxCompletions: 50,
        completionsCount: 12,
        expiresAt: Date.now() / 1000 + 1209600,
        status: MissionStatus.ACTIVE,
        requiresVerification: true
      },
      {
        id: '3',
        creator: address || '',
        creatorDragonId: userDragonId?.toString() || '0',
        missionType: MissionType.BATTLE_WIN,
        title: 'Battle Challenge',
        description: 'Win 5 battles with dragons level 5 or higher!',
        verificationData: { minWins: 5, minLevel: 5 },
        rewardETH: '0.02',
        rewardTokens: '200',
        expMultiplier: 2500,
        maxCompletions: 100,
        completionsCount: 67,
        expiresAt: Date.now() / 1000 + 2592000,
        status: MissionStatus.ACTIVE,
        requiresVerification: false
      }
    ];

    setMissions(mockMissions);
  }, [address, userDragonId]);

  const handleCreateMission = async (params: CreateMissionParams) => {
    setCreating(true);
    soundManager.play('notification', 0.8);

    try {
      // TODO: Call smart contract to create mission
      console.log('Creating mission:', params);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      soundManager.play('quest_complete', 1.0);
      setShowCreateModal(false);
      alert('Mission created successfully!');
    } catch (error) {
      console.error('Failed to create mission:', error);
      soundManager.play('error', 0.8);
      alert('Failed to create mission');
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteMission = async (mission: Mission) => {
    soundManager.play('click', 0.8);

    // Open verification UI based on mission type
    switch (mission.missionType) {
      case MissionType.FOLLOW_FARCASTER:
        window.open(`https://warpcast.com/${mission.verificationData.farcasterUsername}`, '_blank');
        break;

      case MissionType.OPEN_MINIAPP:
        window.open(mission.verificationData.miniAppUrl, '_blank');
        break;

      case MissionType.ADD_LIQUIDITY:
      case MissionType.SWAP_TOKENS:
        // Open DEX
        alert('Opening DEX...');
        break;

      default:
        alert('Complete the mission requirements and submit proof!');
    }
  };

  const filteredMissions = missions.filter(m => {
    if (activeTab === 'my-missions') {
      return m.creator.toLowerCase() === address?.toLowerCase();
    }
    if (activeTab === 'completed') {
      return false; // TODO: Filter completed missions
    }
    return m.status === MissionStatus.ACTIVE;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">🎯 Mission Board</h1>
            <p className="text-gray-300">Complete missions to earn rewards and EXP!</p>
          </div>

          {canCreateMissions && (
            <button
              onClick={() => {
                soundManager.play('click', 0.8);
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all"
            >
              ✨ Create Mission
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto">
          {[
            { id: 'story', label: '📖 AI Story', icon: '🤖' },
            { id: 'available', label: '🌟 Available', icon: '🎯' },
            { id: 'my-missions', label: '📝 My Missions', icon: '✍️' },
            { id: 'completed', label: '✅ Completed', icon: '🏆' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.play('click', 0.5);
                setActiveTab(tab.id as any);
              }}
              className={`px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Story Chapter Progress */}
        {activeTab === 'story' && (
          <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border-2 border-purple-400/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {storyGenerator.getCurrentChapter().title}
                </h2>
                <p className="text-gray-300">{storyGenerator.getCurrentChapter().description}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-yellow-400">
                  Chapter {storyGenerator.getCurrentChapter().number}
                </div>
                <div className="text-sm text-gray-400">
                  {storyGenerator.getProgressionStats().totalStoryPoints.toLocaleString()} Story Points
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">
                  {storyGenerator.getProgressionStats().uniqueDragonsDiscovered}
                </div>
                <div className="text-xs text-gray-400">Dragons Discovered</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">
                  {storyGenerator.getProgressionStats().ridgesEstablished}
                </div>
                <div className="text-xs text-gray-400">Ridges Established</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">
                  {storyGenerator.getProgressionStats().chaosEventsResolved}
                </div>
                <div className="text-xs text-gray-400">Chaos Resolved</div>
              </div>
            </div>
          </div>
        )}

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {/* Story Missions */}
            {activeTab === 'story' && storyMissions.map((mission) => {
              const difficultyColors = {
                easy: 'green',
                medium: 'blue',
                hard: 'orange',
                legendary: 'purple'
              };
              const color = difficultyColors[mission.difficulty];
              const typeIcons = {
                discovery: '🔍',
                ridge: '🏔️',
                chaos: '⚡',
                evolution: '🌟',
                prophecy: '📜'
              };

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-gradient-to-br from-${color}-900/40 to-${color}-800/20 backdrop-blur-sm rounded-xl p-6 border-2 border-${color}-400/30 hover:border-${color}-400/60 transition-all cursor-pointer relative overflow-hidden`}
                  onClick={() => {
                    soundManager.play('hover', 0.6);
                    setSelectedStoryMission(mission);
                  }}
                >
                  {/* AI Badge */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <span>🤖</span>
                    <span>AI Story</span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">{typeIcons[mission.type]}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{mission.title}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded bg-${color}-600/70 text-white font-semibold uppercase`}>
                          {mission.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-purple-600/50 text-white">
                          {mission.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Story Text */}
                  <div className="bg-black/40 rounded-lg p-3 mb-4 border border-white/10">
                    <p className="text-gray-300 text-sm italic line-clamp-3">"{mission.storyText}"</p>
                  </div>

                  {/* Objectives */}
                  <div className="mb-4 space-y-2">
                    {mission.objectives.slice(0, 2).map((obj) => (
                      <div key={obj.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-5 h-5 rounded-full border-2 ${obj.completed ? 'bg-green-500 border-green-400' : 'border-gray-500'} flex items-center justify-center`}>
                          {obj.completed && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-gray-300">{obj.description}</span>
                      </div>
                    ))}
                    {mission.objectives.length > 2 && (
                      <div className="text-xs text-gray-500 ml-7">
                        +{mission.objectives.length - 2} more objectives...
                      </div>
                    )}
                  </div>

                  {/* Rewards */}
                  <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-lg p-3 border border-yellow-600/30">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400 block">💰 Gold</span>
                        <span className="text-yellow-400 font-bold">{mission.rewards.gold.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">💎 Gems</span>
                        <span className="text-cyan-400 font-bold">{mission.rewards.gems}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">⭐ EXP</span>
                        <span className="text-green-400 font-bold">+{mission.rewards.experience}</span>
                      </div>
                      {mission.rewards.dragonEgg && (
                        <div>
                          <span className="text-gray-400 block">🥚 Dragon</span>
                          <span className="text-purple-400 font-bold text-xs">{mission.rewards.dragonEgg.element}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Limit */}
                  {mission.expiresAt && (
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                      <span>⏱️</span>
                      <span>Expires: {new Date(mission.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* User-Created Missions */}
            {activeTab !== 'story' && filteredMissions.map((mission) => {
              const format = missionManager.formatMission(mission);
              const timeRemaining = missionManager.getTimeRemaining(mission.expiresAt);
              const progress = (mission.completionsCount / mission.maxCompletions) * 100;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer"
                  onClick={() => setSelectedMission(mission)}
                >
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`text-5xl`}>{format.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{mission.title}</h3>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded bg-${format.color}-600/50 text-white`}>
                          {format.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">
                          {format.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{mission.description}</p>

                  {/* Rewards */}
                  <div className="bg-black/30 rounded-lg p-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-yellow-400 font-bold">{mission.rewardETH} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">EXP Bonus:</span>
                      <span className="text-green-400 font-bold">{mission.expMultiplier / 1000}x</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{mission.completionsCount}/{mission.maxCompletions}</span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Time & Action */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">⏰ {timeRemaining}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteMission(mission);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      Start →
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredMissions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-400 text-xl">No missions available</p>
          </div>
        )}
      </div>

      {/* Create Mission Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateMissionModal
            userDragonId={userDragonId}
            onCreate={handleCreateMission}
            onClose={() => setShowCreateModal(false)}
            creating={creating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Create Mission Modal Component
function CreateMissionModal({
  userDragonId,
  onCreate,
  onClose,
  creating
}: {
  userDragonId?: bigint;
  onCreate: (params: CreateMissionParams) => void;
  onClose: () => void;
  creating: boolean;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof MissionSystemManager.MISSION_TEMPLATES | null>(null);
  const [customData, setCustomData] = useState<any>({});

  const handleCreate = () => {
    if (!selectedTemplate || !userDragonId) return;

    const template = MissionSystemManager.MISSION_TEMPLATES[selectedTemplate];

    const params: CreateMissionParams = {
      dragonId: userDragonId,
      missionType: template.missionType,
      title: customData.title || template.title,
      description: customData.description || template.description,
      verificationData: customData.verificationData || {},
      expMultiplier: template.expMultiplier,
      maxCompletions: customData.maxCompletions || template.maxCompletions,
      durationDays: template.durationDays,
      requiresVerification: template.requiresVerification,
      fundingETH: customData.fundingETH || '0.1'
    };

    onCreate(params);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-white mb-6">✨ Create Mission</h2>

        {/* Mission Templates */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Object.entries(MissionSystemManager.MISSION_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key as keyof typeof MissionSystemManager.MISSION_TEMPLATES)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedTemplate === key
                  ? 'border-yellow-400 bg-yellow-400/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-white font-bold mb-1">{template.title}</div>
              <div className="text-xs text-gray-300">{template.description.slice(0, 50)}...</div>
            </button>
          ))}
        </div>

        {/* Custom Fields */}
        {selectedTemplate && (
          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Reward Amount (ETH)"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20"
              onChange={(e) => setCustomData({ ...customData, fundingETH: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max Completions"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20"
              onChange={(e) => setCustomData({ ...customData, maxCompletions: parseInt(e.target.value) })}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-all"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedTemplate || creating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Mission'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
