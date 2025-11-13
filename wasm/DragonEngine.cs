using System;
using System.Collections.Generic;
using System.Runtime.InteropServices.JavaScript;

namespace DragonCityEngine
{
    // Dragon Stats Structure
    public struct DragonStats
    {
        public int Hp;
        public int MaxHp;
        public int Attack;
        public int Defense;
        public int Speed;
        public int Level;
        public int Exp;
        public int ExpToNextLevel;
    }

    // Dragon Skill
    public class DragonSkill
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public int Element { get; set; }
        public int Power { get; set; }
        public int Accuracy { get; set; }
        public int Cooldown { get; set; }
        public int CurrentCooldown { get; set; }
        public string Type { get; set; } // "attack", "heal", "buff"
    }

    // Battle State
    public class BattleState
    {
        public DragonBattler Attacker { get; set; }
        public DragonBattler Defender { get; set; }
        public int Turn { get; set; }
        public string Phase { get; set; } // "battle", "result"
        public string Winner { get; set; }
        public List<BattleLog> Log { get; set; }
    }

    public class DragonBattler
    {
        public long DragonId { get; set; }
        public DragonStats Stats { get; set; }
        public int CurrentHp { get; set; }
        public int Element { get; set; }
        public int PowerType { get; set; }
        public List<DragonSkill> Skills { get; set; }
    }

    public class BattleLog
    {
        public int Turn { get; set; }
        public string Action { get; set; }
        public int Damage { get; set; }
        public bool IsCritical { get; set; }
    }

    // Main Game Engine
    public partial class GameEngine
    {
        // Element effectiveness matrix
        private static readonly Dictionary<int, (int[] strong, int[] weak)> ElementEffectiveness = new()
        {
            { 0, (new[] { 2, 6 }, new[] { 1, 8 }) },      // Fire
            { 1, (new[] { 0, 9 }, new[] { 2, 6 }) },      // Water
            { 2, (new[] { 9, 7 }, new[] { 0, 6 }) },      // Earth
            { 3, (new[] { 2, 6 }, new[] { 9, 8 }) },      // Air
            { 4, (new[] { 5, 3 }, new[] { 5, 2 }) },      // Dark
            { 5, (new[] { 4, 3 }, new[] { 4, 7 }) },      // Light
            { 6, (new[] { 1, 2 }, new[] { 0, 8 }) },      // Nature
            { 7, (new[] { 8, 6 }, new[] { 0, 9 }) },      // Metal
            { 8, (new[] { 2, 6 }, new[] { 0, 7 }) },      // Ice
            { 9, (new[] { 1, 3 }, new[] { 2 }) }          // Electric
        };

        private static readonly Random random = new Random();

        [JSExport]
        public static string CalculateStats(int element, int powerType, int level)
        {
            int baseStat = 10;
            int elementBonus = element * 2;
            float powerMultiplier = powerType switch
            {
                2 => 1.5f,  // Legendary
                1 => 1.2f,  // Rare
                _ => 1.0f   // Common
            };

            int baseValue = (int)((baseStat + elementBonus) * powerMultiplier);
            
            var stats = new DragonStats
            {
                MaxHp = (int)(baseValue * 10 * Math.Pow(1.1, level - 1)),
                Hp = (int)(baseValue * 10 * Math.Pow(1.1, level - 1)),
                Attack = (int)(baseValue * Math.Pow(1.08, level - 1)),
                Defense = (int)(baseValue * 0.8f * Math.Pow(1.08, level - 1)),
                Speed = (int)(baseValue * 1.2f * Math.Pow(1.05, level - 1)),
                Level = level,
                Exp = 0,
                ExpToNextLevel = (int)(100 * Math.Pow(level, 1.5))
            };

            return $"{stats.Hp},{stats.MaxHp},{stats.Attack},{stats.Defense},{stats.Speed},{stats.Level},{stats.Exp},{stats.ExpToNextLevel}";
        }

        [JSExport]
        public static float GetElementMultiplier(int attackerElement, int defenderElement)
        {
            if (attackerElement == defenderElement) return 1.0f;

            if (ElementEffectiveness.TryGetValue(attackerElement, out var effectiveness))
            {
                if (Array.Exists(effectiveness.strong, e => e == defenderElement))
                    return 1.5f; // Super effective
                if (Array.Exists(effectiveness.weak, e => e == defenderElement))
                    return 0.7f; // Not very effective
            }

            return 1.0f; // Normal damage
        }

        [JSExport]
        public static int CalculateDamage(int attack, int defense, int skillPower, int attackerElement, int defenderElement, out bool isCritical)
        {
            float baseDamage = (attack * skillPower / 100f) - (defense * 0.5f);
            baseDamage = Math.Max(1, baseDamage);

            float elementMultiplier = GetElementMultiplier(attackerElement, defenderElement);
            
            // Critical hit check (based on speed)
            isCritical = random.NextDouble() < 0.15;
            float critMultiplier = isCritical ? 1.5f : 1.0f;

            // Random variance
            float randomFactor = 0.85f + (float)(random.NextDouble() * 0.3);

            int finalDamage = (int)(baseDamage * elementMultiplier * critMultiplier * randomFactor);
            return Math.Max(1, finalDamage);
        }

        [JSExport]
        public static bool DoesAttackHit(int accuracy)
        {
            return random.Next(100) < accuracy;
        }

        [JSExport]
        public static int CalculateExpGain(int winnerLevel, int loserLevel)
        {
            int baseExp = 50;
            int levelDiff = Math.Max(0, loserLevel - winnerLevel);
            return baseExp + (levelDiff * 10);
        }

        [JSExport]
        public static string CheckLevelUp(int currentLevel, int currentExp, int expGained, string statsData)
        {
            int newExp = currentExp + expGained;
            int expRequired = (int)(100 * Math.Pow(currentLevel, 1.5));

            if (newExp >= expRequired)
            {
                // Level up!
                int newLevel = currentLevel + 1;
                int remainingExp = newExp - expRequired;

                // Parse stats and increase them
                var statsParts = statsData.Split(',');
                int maxHp = (int)(int.Parse(statsParts[1]) * 1.10);
                int attack = (int)(int.Parse(statsParts[2]) * 1.08);
                int defense = (int)(int.Parse(statsParts[3]) * 1.08);
                int speed = (int)(int.Parse(statsParts[4]) * 1.05);
                int newExpRequired = (int)(100 * Math.Pow(newLevel, 1.5));

                return $"true,{newLevel},{maxHp},{maxHp},{attack},{defense},{speed},{remainingExp},{newExpRequired}";
            }

            return $"false,{currentLevel},{statsData.Split(',')[1]},{statsData.Split(',')[1]},{statsData.Split(',')[2]},{statsData.Split(',')[3]},{statsData.Split(',')[4]},{newExp},{expRequired}";
        }

        // Dragon animation states
        [JSExport]
        public static string GetAttackAnimation(int element, string skillType)
        {
            return element switch
            {
                0 => skillType == "ultimate" ? "fire_blast" : "fire_strike",      // Fire
                1 => skillType == "ultimate" ? "water_tsunami" : "water_splash",  // Water
                2 => skillType == "ultimate" ? "earth_quake" : "rock_throw",      // Earth
                3 => skillType == "ultimate" ? "tornado" : "wind_slash",          // Air
                4 => skillType == "ultimate" ? "dark_void" : "shadow_claw",       // Dark
                5 => skillType == "ultimate" ? "holy_beam" : "light_ray",         // Light
                6 => skillType == "ultimate" ? "vine_whip" : "leaf_storm",        // Nature
                7 => skillType == "ultimate" ? "metal_burst" : "steel_edge",      // Metal
                8 => skillType == "ultimate" ? "blizzard" : "ice_shard",          // Ice
                9 => skillType == "ultimate" ? "thunderbolt" : "spark",           // Electric
                _ => "basic_attack"
            };
        }

        [JSExport]
        public static string GenerateSkills(int element)
        {
            var skills = new List<string>();

            // Basic attack
            skills.Add($"basic_{element},Basic Attack,{element},50,100,0,attack");

            // Special attack
            string specialName = element switch
            {
                0 => "Flame Burst",
                1 => "Water Pulse",
                2 => "Stone Edge",
                3 => "Air Slash",
                4 => "Shadow Ball",
                5 => "Light Beam",
                6 => "Leaf Blade",
                7 => "Iron Head",
                8 => "Ice Beam",
                9 => "Thunder Shock",
                _ => "Special Attack"
            };
            skills.Add($"special_{element},{specialName},{element},80,90,2,attack");

            // Ultimate attack
            string ultimateName = element switch
            {
                0 => "Inferno",
                1 => "Hydro Pump",
                2 => "Earthquake",
                3 => "Hurricane",
                4 => "Dark Pulse",
                5 => "Solar Beam",
                6 => "Frenzy Plant",
                7 => "Meteor Mash",
                8 => "Blizzard",
                9 => "Thunder",
                _ => "Ultimate Attack"
            };
            skills.Add($"ultimate_{element},{ultimateName},{element},120,75,4,attack");

            // Light element gets heal
            if (element == 5)
            {
                skills.Add($"heal_{element},Healing Light,{element},50,100,3,heal");
            }

            return string.Join("|", skills);
        }
    }
}
