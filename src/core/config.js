// Configuration file for the Discord Leveling Bot
// This file contains all configurable settings for the bot

const CONFIG = {
  // Bot settings
  BOT_TOKEN: process.env.DISCORD_TOKEN,
  BOT_PREFIX: '!',

  // XP System
  XP_MIN: 15,
  XP_MAX: 25,
  COOLDOWN: 60000, // 60 seconds in milliseconds
  LEVEL_MULTIPLIER: 100,

  // Streak System
  STREAK_THRESHOLD: 2, // minutes
  STREAK_MULTIPLIER: 2.0,
  MAX_STREAK_BONUS: 100,

  // Voice System
  VOICE_XP_PER_MINUTE: 10,
  VOICE_MIN_SESSION: 60, // seconds
  VOICE_MAX_DAILY: 500,

  // Game System
  MAX_DAILY_GAMES: 10,
  GAME_XP_BASE: 50,
  GAME_COINS_BASE: 25,

  // Economy System
  DAILY_REWARD_BASE: 50,
  DAILY_STREAK_MULTIPLIER: 10,
  LEVEL_UP_COINS: 100,

  // Spam Detection
  SPAM_DETECTION_ENABLED: true,
  MAX_DUPLICATE_MESSAGES: 3,
  MAX_CAPS_PERCENTAGE: 80,
  MAX_EMOJI_COUNT: 10,
  XP_PENALTY_ENABLED: true,

  // Embeds
  EMBED_COLOR: '#3498db',
  EMBED_FOOTER: 'Powered by Leveling Bot',

  // Backup
  AUTO_BACKUP_ENABLED: true,
  BACKUP_TIME: '02:00',
  BACKUP_RETENTION_DAYS: 7
};

// Validate required environment variables
if (!CONFIG.BOT_TOKEN) {
  console.error('❌ Error: DISCORD_TOKEN not found in environment variables!');
  process.exit(1);
}

module.exports = CONFIG;
