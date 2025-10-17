const fs = require('fs');
const path = require('path');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_message INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    join_date INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS role_rewards (
    guild_id TEXT,
    level INTEGER,
    role_id TEXT,
    PRIMARY KEY (guild_id, level)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_streaks (
    user_id TEXT,
    guild_id TEXT,
    streak_count INTEGER DEFAULT 1,
    last_streak_time INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, guild_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS time_stats (
    user_id TEXT,
    guild_id TEXT,
    week_start INTEGER, -- Unix timestamp of Monday of the week
    month_start INTEGER, -- Unix timestamp of 1st day of the month
    weekly_xp INTEGER DEFAULT 0,
    monthly_xp INTEGER DEFAULT 0,
    weekly_messages INTEGER DEFAULT 0,
    monthly_messages INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id, week_start, month_start)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT,
    guild_id TEXT,
    coins INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    daily_last_claim INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    best_daily_streak INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS shop_items (
    guild_id TEXT,
    item_id TEXT,
    name TEXT,
    description TEXT,
    price INTEGER,
    category TEXT, -- 'xp_boost', 'cosmetic', 'utility', 'special'
    item_data TEXT, -- JSON data for item-specific properties
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at INTEGER,
    PRIMARY KEY (guild_id, item_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_inventory (
    user_id TEXT,
    guild_id TEXT,
    item_id TEXT,
    quantity INTEGER DEFAULT 1,
    acquired_at INTEGER,
    expires_at INTEGER, -- For temporary items
    item_data TEXT, -- User-specific item data
    PRIMARY KEY (user_id, guild_id, item_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_achievements (
    user_id TEXT,
    guild_id TEXT,
    achievement_id TEXT,
    unlocked_at INTEGER,
    progress INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id, achievement_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS achievements (
    guild_id TEXT,
    achievement_id TEXT,
    name TEXT,
    description TEXT,
    category TEXT, -- 'leveling', 'social', 'economy', 'special'
    requirement_type TEXT, -- 'level', 'messages', 'coins', 'streak', 'custom'
    requirement_value INTEGER,
    reward_coins INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_items TEXT, -- JSON array of item_ids
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at INTEGER,
    PRIMARY KEY (guild_id, achievement_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS voice_sessions (
    user_id TEXT,
    guild_id TEXT,
    session_start INTEGER,
    session_end INTEGER,
    channel_id TEXT,
    voice_time INTEGER DEFAULT 0, -- Total seconds in voice
    speaking_time INTEGER DEFAULT 0, -- Total seconds speaking
    is_muted INTEGER DEFAULT 0,
    is_deafened INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id, session_start)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS voice_settings (
    guild_id TEXT PRIMARY KEY,
    xp_per_minute INTEGER DEFAULT 10,
    min_session_time INTEGER DEFAULT 60, -- Minimum 1 minute for XP
    max_daily_voice_xp INTEGER DEFAULT 500,
    voice_xp_enabled INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS spam_settings (
    guild_id TEXT PRIMARY KEY,
    spam_detection_enabled INTEGER DEFAULT 1,
    max_duplicate_messages INTEGER DEFAULT 3,
    max_caps_percentage INTEGER DEFAULT 80,
    max_emoji_count INTEGER DEFAULT 10,
    cooldown_multiplier REAL DEFAULT 1.5,
    xp_penalty_enabled INTEGER DEFAULT 1,
    warning_threshold INTEGER DEFAULT 3,
    mute_threshold INTEGER DEFAULT 5
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS spam_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    guild_id TEXT,
    message_content TEXT,
    spam_type TEXT, -- 'duplicate', 'caps', 'emoji', 'pattern', 'cooldown'
    severity INTEGER, -- 1-5 scale
    timestamp INTEGER,
    action_taken TEXT, -- 'warning', 'xp_penalty', 'mute', 'none'
    is_resolved INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_warnings (
    user_id TEXT,
    guild_id TEXT,
    warning_type TEXT, -- 'spam', 'cooldown_bypass', 'suspicious_activity'
    warning_count INTEGER DEFAULT 1,
    last_warning INTEGER,
    reason TEXT,
    PRIMARY KEY (user_id, guild_id, warning_type)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS mini_games (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    game_type TEXT, -- 'trivia', 'hangman', 'number_guess', 'rps', 'coin_flip'
    game_data TEXT, -- JSON data for game state
    status TEXT, -- 'active', 'completed', 'cancelled'
    created_at INTEGER,
    completed_at INTEGER,
    reward_xp INTEGER DEFAULT 0,
    reward_coins INTEGER DEFAULT 0,
    is_won INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS game_settings (
    guild_id TEXT PRIMARY KEY,
    trivia_enabled INTEGER DEFAULT 1,
    hangman_enabled INTEGER DEFAULT 1,
    number_guess_enabled INTEGER DEFAULT 1,
    rps_enabled INTEGER DEFAULT 1,
    coin_flip_enabled INTEGER DEFAULT 1,
    max_daily_games INTEGER DEFAULT 10,
    xp_reward_base INTEGER DEFAULT 50,
    coins_reward_base INTEGER DEFAULT 25,
    difficulty_multiplier REAL DEFAULT 1.0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS server_settings (
    guild_id TEXT PRIMARY KEY,
    xp_base_min INTEGER DEFAULT 15,
    xp_base_max INTEGER DEFAULT 25,
    level_formula TEXT DEFAULT '100 * (level ** 2)',
    streak_bonus_enabled INTEGER DEFAULT 1,
    streak_threshold INTEGER DEFAULT 2,
    streak_multiplier REAL DEFAULT 2.0,
    max_streak_bonus INTEGER DEFAULT 100,
    embed_color TEXT DEFAULT '#3498db',
    embed_footer TEXT DEFAULT 'Powered by Leveling Bot',
    bot_prefix TEXT DEFAULT '!',
    welcome_message_enabled INTEGER DEFAULT 1,
    welcome_message TEXT DEFAULT 'Welcome to {server}! Start chatting to earn XP and level up!',
    level_up_message TEXT DEFAULT 'Congratulations {user}! You\'ve reached **Level {level}**!',
    auto_backup_enabled INTEGER DEFAULT 1,
    backup_time TEXT DEFAULT '02:00'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS channel_multipliers (
    guild_id TEXT,
    channel_id TEXT,
    xp_multiplier REAL DEFAULT 1.0,
    coins_multiplier REAL DEFAULT 1.0,
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at INTEGER,
    PRIMARY KEY (guild_id, channel_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS role_multipliers (
    guild_id TEXT,
    role_id TEXT,
    xp_multiplier REAL DEFAULT 1.0,
    coins_multiplier REAL DEFAULT 1.0,
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at INTEGER,
    PRIMARY KEY (guild_id, role_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_titles (
    user_id TEXT,
    guild_id TEXT,
    title TEXT,
    color TEXT DEFAULT '#ffffff',
    is_active INTEGER DEFAULT 1,
    acquired_at INTEGER,
    PRIMARY KEY (user_id, guild_id)
  )
`);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Configuration
const CONFIG = {
  XP_MIN: 15,
  XP_MAX: 25,
  COOLDOWN: 60000, // 60 seconds in milliseconds
  LEVEL_MULTIPLIER: 100
};

// Slash Commands Collection
const commands = [
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your rank card or another user\'s rank')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check rank for')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server leaderboard'),

  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your current level and XP'),

  new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('Set a user\'s XP (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to set XP for')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of XP to set')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('Reset a user\'s XP and level (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to reset')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View detailed user statistics')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check stats for')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('addrolereward')
    .setDescription('Add a role reward for reaching a specific level (Admin only)')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Level to assign the role at')
        .setRequired(true)
        .setMinValue(1))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to assign')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('removerolereward')
    .setDescription('Remove a role reward for a specific level (Admin only)')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Level to remove the role reward from')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('listrolerewards')
    .setDescription('List all role rewards in this server'),

  new SlashCommandBuilder()
    .setName('streak')
    .setDescription('View your current chat streak'),

  new SlashCommandBuilder()
    .setName('weeklylb')
    .setDescription('View the weekly leaderboard'),

  new SlashCommandBuilder()
    .setName('monthlylb')
    .setDescription('View the monthly leaderboard'),

  new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Create a database backup (Admin only)'),

  new SlashCommandBuilder()
    .setName('dbstats')
    .setDescription('View database statistics'),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coin reward'),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your coin balance'),

  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse the shop items'),

  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the shop')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Item ID to purchase')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory'),

  new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('View your unlocked achievements'),

  new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Check voice activity statistics'),

  new SlashCommandBuilder()
    .setName('voice-settings')
    .setDescription('Configure voice XP settings (Admin only)')
    .addIntegerOption(option =>
      option.setName('xp_per_minute')
        .setDescription('XP awarded per minute in voice')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100))
    .addIntegerOption(option =>
      option.setName('min_session_time')
        .setDescription('Minimum minutes required for XP (default: 1)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(60))
    .addIntegerOption(option =>
      option.setName('max_daily_xp')
        .setDescription('Maximum daily voice XP (default: 500)')
        .setRequired(false)
        .setMinValue(100)
        .setMaxValue(2000))
    .addBooleanOption(option =>
      option.setName('enabled')
        .setDescription('Enable/disable voice XP')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Play a trivia game'),

  new SlashCommandBuilder()
    .setName('hangman')
    .setDescription('Play hangman word guessing game'),

  new SlashCommandBuilder()
    .setName('numberguess')
    .setDescription('Play number guessing game'),

  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors')
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Your choice')
        .setRequired(true)
        .addChoices(
          { name: 'Rock', value: 'rock' },
          { name: 'Paper', value: 'paper' },
          { name: 'Scissors', value: 'scissors' }
        )),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin and bet coins')
    .addStringOption(option =>
      option.setName('side')
        .setDescription('Heads or Tails')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        ))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)),

  new SlashCommandBuilder()
    .setName('server-settings')
    .setDescription('Configure server-specific settings (Admin only)')
    .addIntegerOption(option =>
      option.setName('xp_min')
        .setDescription('Minimum XP per message (default: 15)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100))
    .addIntegerOption(option =>
      option.setName('xp_max')
        .setDescription('Maximum XP per message (default: 25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100))
    .addStringOption(option =>
      option.setName('level_formula')
        .setDescription('Custom level formula (e.g., "100 * (level ** 2)")')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('embed_color')
        .setDescription('Embed color (hex code, e.g., "#3498db")')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('streak_enabled')
        .setDescription('Enable/disable streak bonus')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('channel-multiplier')
    .setDescription('Set XP/coins multiplier for a channel (Admin only)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to set multiplier for')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('xp_multiplier')
        .setDescription('XP multiplier (default: 1.0)')
        .setRequired(false)
        .setMinValue(0.1)
        .setMaxValue(10.0))
    .addNumberOption(option =>
      option.setName('coins_multiplier')
        .setDescription('Coins multiplier (default: 1.0)')
        .setRequired(false)
        .setMinValue(0.1)
        .setMaxValue(10.0)),

  new SlashCommandBuilder()
    .setName('role-multiplier')
    .setDescription('Set XP/coins multiplier for a role (Admin only)')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to set multiplier for')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('xp_multiplier')
        .setDescription('XP multiplier (default: 1.0)')
        .setRequired(false)
        .setMinValue(0.1)
        .setMaxValue(10.0))
    .addNumberOption(option =>
      option.setName('coins_multiplier')
        .setDescription('Coins multiplier (default: 1.0)')
        .setRequired(false)
        .setMinValue(0.1)
        .setMaxValue(10.0)),

  new SlashCommandBuilder()
    .setName('set-title')
    .setDescription('Set your custom title')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Your custom title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Title color (hex code, default: #ffffff)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('spam-settings')
    .setDescription('Configure spam detection settings (Admin only)')
    .addBooleanOption(option =>
      option.setName('enabled')
        .setDescription('Enable/disable spam detection')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('max_duplicates')
        .setDescription('Max duplicate messages allowed (default: 3)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10))
    .addIntegerOption(option =>
      option.setName('max_caps_percent')
        .setDescription('Max caps percentage (default: 80)')
        .setRequired(false)
        .setMinValue(50)
        .setMaxValue(100))
    .addIntegerOption(option =>
      option.setName('max_emojis')
        .setDescription('Max emojis allowed (default: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50))
    .addBooleanOption(option =>
      option.setName('xp_penalty')
        .setDescription('Enable/disable XP penalties for spam')
        .setRequired(false))
];

// Calculate XP needed for next level
function getXPForLevel(level) {
  return CONFIG.LEVEL_MULTIPLIER * (level ** 2);
}

// Get user from database
function getUser(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

// Create or update user
function updateUser(userId, guildId, xp, level, lastMessage, totalMessages = null, joinDate = null) {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, guild_id, xp, level, last_message, total_messages, join_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      xp = excluded.xp,
      level = excluded.level,
      last_message = excluded.last_message,
      total_messages = excluded.total_messages
  `);

  if (totalMessages === null || joinDate === null) {
    // For existing users, preserve current values
    const currentUser = getUser(userId, guildId);
    totalMessages = (currentUser?.total_messages || 0);
    joinDate = (currentUser?.join_date || Date.now());
  }

  stmt.run(userId, guildId, xp, level, lastMessage, totalMessages, joinDate);
}

// Get user streak
function getUserStreak(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM user_streaks WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

// Update user streak
function updateUserStreak(userId, guildId, streakCount, lastStreakTime, bestStreak) {
  const stmt = db.prepare(`
    INSERT INTO user_streaks (user_id, guild_id, streak_count, last_streak_time, best_streak)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      streak_count = excluded.streak_count,
      last_streak_time = excluded.last_streak_time,
      best_streak = excluded.best_streak
  `);
  stmt.run(userId, guildId, streakCount, lastStreakTime, bestStreak);
}

// Calculate streak bonus XP
function calculateStreakBonus(streakCount) {
  // Bonus XP = streak_length * 2, max bonus 100 XP (streak 50)
  return Math.min(streakCount * 2, 100);
}

// Get start of week (Monday) timestamp
function getWeekStart(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

// Get start of month timestamp
function getMonthStart(timestamp) {
  const date = new Date(timestamp);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Get or create time stats for user
function getOrCreateTimeStats(userId, guildId, timestamp) {
  const weekStart = getWeekStart(timestamp);
  const monthStart = getMonthStart(timestamp);

  const stmt = db.prepare(`
    SELECT * FROM time_stats
    WHERE user_id = ? AND guild_id = ? AND week_start = ? AND month_start = ?
  `);

  let stats = stmt.get(userId, guildId, weekStart, monthStart);

  if (!stats) {
    const insertStmt = db.prepare(`
      INSERT INTO time_stats (user_id, guild_id, week_start, month_start, weekly_xp, monthly_xp, weekly_messages, monthly_messages)
      VALUES (?, ?, ?, ?, 0, 0, 0, 0)
    `);
    insertStmt.run(userId, guildId, weekStart, monthStart);

    stats = {
      user_id: userId,
      guild_id: guildId,
      week_start: weekStart,
      month_start: monthStart,
      weekly_xp: 0,
      monthly_xp: 0,
      weekly_messages: 0,
      monthly_messages: 0
    };
  }

  return stats;
}

// Get user economy data
function getUserEconomy(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM economy WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

// Update user economy
function updateUserEconomy(userId, guildId, coins, totalEarned = null, dailyLastClaim = null, dailyStreak = null, bestDailyStreak = null) {
  const stmt = db.prepare(`
    INSERT INTO economy (user_id, guild_id, coins, total_earned, daily_last_claim, daily_streak, best_daily_streak)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      coins = excluded.coins,
      total_earned = excluded.total_earned,
      daily_last_claim = excluded.daily_last_claim,
      daily_streak = excluded.daily_streak,
      best_daily_streak = excluded.best_daily_streak
  `);

  if (totalEarned === null || dailyLastClaim === null || dailyStreak === null || bestDailyStreak === null) {
    const currentEconomy = getUserEconomy(userId, guildId);
    totalEarned = (currentEconomy?.total_earned || 0);
    dailyLastClaim = (currentEconomy?.daily_last_claim || 0);
    dailyStreak = (currentEconomy?.daily_streak || 0);
    bestDailyStreak = (currentEconomy?.best_daily_streak || 0);
  }

  stmt.run(userId, guildId, coins, totalEarned, dailyLastClaim, dailyStreak, bestDailyStreak);
}

// Add coins to user
function addCoins(userId, guildId, amount, reason = 'general') {
  const currentEconomy = getUserEconomy(userId, guildId) || { coins: 0, total_earned: 0 };
  const newCoins = currentEconomy.coins + amount;
  const newTotalEarned = currentEconomy.total_earned + amount;

  updateUserEconomy(userId, guildId, newCoins, newTotalEarned);

  return { previousCoins: currentEconomy.coins, newCoins, earned: amount };
}

// Remove coins from user
function removeCoins(userId, guildId, amount, reason = 'purchase') {
  const currentEconomy = getUserEconomy(userId, guildId) || { coins: 0 };
  const newCoins = Math.max(0, currentEconomy.coins - amount);

  updateUserEconomy(userId, guildId, newCoins);

  return { previousCoins: currentEconomy.coins, newCoins, spent: amount };
}

// Claim daily reward
function claimDailyReward(userId, guildId) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  let economy = getUserEconomy(userId, guildId);
  if (!economy) {
    economy = {
      coins: 0,
      total_earned: 0,
      daily_last_claim: 0,
      daily_streak: 0,
      best_daily_streak: 0
    };
  }

  const lastClaim = economy.daily_last_claim || 0;
  const daysSinceLastClaim = Math.floor((now - lastClaim) / oneDay);

  let coinsReward = 50; // Base daily reward
  let streakBonus = 0;

  if (daysSinceLastClaim === 1) {
    // Consecutive daily claim
    economy.daily_streak++;
    if (economy.daily_streak > economy.best_daily_streak) {
      economy.best_daily_streak = economy.daily_streak;
    }
    streakBonus = Math.min(economy.daily_streak * 10, 100); // Max 100 bonus
  } else if (daysSinceLastClaim > 1) {
    // Streak broken
    economy.daily_streak = 1;
  }

  const totalReward = coinsReward + streakBonus;
  const newCoins = economy.coins + totalReward;
  const newTotalEarned = economy.total_earned + totalReward;

  updateUserEconomy(userId, guildId, newCoins, newTotalEarned, now, economy.daily_streak, economy.best_daily_streak);

  return {
    coinsEarned: totalReward,
    streakBonus,
    newStreak: economy.daily_streak,
    bestStreak: economy.best_daily_streak
  };
}

// Check if user can claim daily reward
function canClaimDaily(userId, guildId) {
  const economy = getUserEconomy(userId, guildId);
  if (!economy) return true;

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const lastClaim = economy.daily_last_claim || 0;

  return (now - lastClaim) >= oneDay;
}

// Get shop items for guild
function getShopItems(guildId) {
  const stmt = db.prepare('SELECT * FROM shop_items WHERE guild_id = ? AND is_active = 1 ORDER BY category, price');
  return stmt.all(guildId);
}

// Get shop item by ID
function getShopItem(guildId, itemId) {
  const stmt = db.prepare('SELECT * FROM shop_items WHERE guild_id = ? AND item_id = ? AND is_active = 1');
  return stmt.get(guildId, itemId);
}

// Add item to user inventory
function addToInventory(userId, guildId, itemId, quantity = 1, expiresAt = null, itemData = null) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO user_inventory (user_id, guild_id, item_id, quantity, acquired_at, expires_at, item_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id, item_id) DO UPDATE SET
      quantity = quantity + excluded.quantity,
      acquired_at = excluded.acquired_at
  `);

  stmt.run(userId, guildId, itemId, quantity, now, expiresAt, itemData);
}

// Get user inventory
function getUserInventory(userId, guildId) {
  const stmt = db.prepare(`
    SELECT ui.*, si.name, si.description, si.category
    FROM user_inventory ui
    JOIN shop_items si ON ui.guild_id = si.guild_id AND ui.item_id = si.item_id
    WHERE ui.user_id = ? AND ui.guild_id = ? AND si.is_active = 1
    ORDER BY si.category, si.name
  `);
  return stmt.all(userId, guildId);
}

// Purchase item
function purchaseItem(userId, guildId, itemId) {
  const item = getShopItem(guildId, itemId);
  if (!item) {
    return { success: false, error: 'Item not found or not available' };
  }

  const economy = getUserEconomy(userId, guildId);
  if (!economy || economy.coins < item.price) {
    return { success: false, error: 'Insufficient coins' };
  }

  // Remove coins
  removeCoins(userId, guildId, item.price, 'purchase');

  // Add to inventory
  const itemData = item.item_data ? JSON.parse(item.item_data) : null;
  addToInventory(userId, guildId, itemId, 1, null, JSON.stringify(itemData));

  return {
    success: true,
    item: item,
    spent: item.price
  };
}

// Get achievements for guild
function getAchievements(guildId) {
  const stmt = db.prepare('SELECT * FROM achievements WHERE guild_id = ? AND is_active = 1 ORDER BY category, requirement_value');
  return stmt.all(guildId);
}

// Get user achievements
function getUserAchievements(userId, guildId) {
  const stmt = db.prepare(`
    SELECT ua.*, a.name, a.description, a.category, a.reward_coins, a.reward_xp, a.reward_items
    FROM user_achievements ua
    JOIN achievements a ON ua.guild_id = a.guild_id AND ua.achievement_id = a.achievement_id
    WHERE ua.user_id = ? AND ua.guild_id = ? AND a.is_active = 1
    ORDER BY ua.unlocked_at DESC
  `);
  return stmt.all(userId, guildId);
}

// Check and unlock achievements for user
function checkAndUnlockAchievements(userId, guildId, userData) {
  const achievements = getAchievements(guildId);
  const userAchievements = getUserAchievements(userId, guildId);
  const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const newlyUnlocked = [];

  for (const achievement of achievements) {
    if (unlockedAchievementIds.has(achievement.achievement_id)) continue;

    let shouldUnlock = false;

    switch (achievement.requirement_type) {
      case 'level':
        shouldUnlock = userData.level >= achievement.requirement_value;
        break;
      case 'messages':
        shouldUnlock = userData.total_messages >= achievement.requirement_value;
        break;
      case 'coins':
        const economy = getUserEconomy(userId, guildId);
        shouldUnlock = (economy?.total_earned || 0) >= achievement.requirement_value;
        break;
      case 'streak':
        const streak = getUserStreak(userId, guildId);
        shouldUnlock = (streak?.best_streak || 0) >= achievement.requirement_value;
        break;
      case 'custom':
        // Custom logic can be added here
        break;
    }

    if (shouldUnlock) {
      // Unlock achievement
      const stmt = db.prepare(`
        INSERT INTO user_achievements (user_id, guild_id, achievement_id, unlocked_at, progress, is_completed)
        VALUES (?, ?, ?, ?, 100, 1)
      `);
      stmt.run(userId, guildId, achievement.achievement_id, Date.now());

      // Give rewards
      if (achievement.reward_coins > 0) {
        addCoins(userId, guildId, achievement.reward_coins, 'achievement');
      }

      if (achievement.reward_xp > 0) {
        // Add XP to user (this will trigger level up checks)
        const currentUser = getUser(userId, guildId) || { xp: 0, level: 1 };
        updateUser(userId, guildId, currentUser.xp + achievement.reward_xp, currentUser.level, currentUser.last_message, currentUser.total_messages, currentUser.join_date);
      }

      // Give item rewards
      if (achievement.reward_items) {
        try {
          const itemIds = JSON.parse(achievement.reward_items);
          itemIds.forEach(itemId => {
            addToInventory(userId, guildId, itemId, 1);
          });
        } catch (error) {
          console.error('Error parsing achievement reward items:', error);
        }
      }

      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

// Initialize default achievements for new guilds
function initializeDefaultAchievements(guildId) {
  const defaultAchievements = [
    {
      achievement_id: 'first_level',
      name: 'Getting Started',
      description: 'Reach Level 5',
      category: 'leveling',
      requirement_type: 'level',
      requirement_value: 5,
      reward_coins: 100,
      reward_xp: 0,
      reward_items: null
    },
    {
      achievement_id: 'level_10',
      name: 'Rising Star',
      description: 'Reach Level 10',
      category: 'leveling',
      requirement_type: 'level',
      requirement_value: 10,
      reward_coins: 250,
      reward_xp: 0,
      reward_items: JSON.stringify(['xp_boost_2x'])
    },
    {
      achievement_id: 'level_25',
      name: 'Veteran',
      description: 'Reach Level 25',
      category: 'leveling',
      requirement_type: 'level',
      requirement_value: 25,
      reward_coins: 500,
      reward_xp: 0,
      reward_items: JSON.stringify(['xp_boost_3x'])
    },
    {
      achievement_id: 'message_milestone',
      name: 'Chatty Cathy',
      description: 'Send 1000 messages',
      category: 'social',
      requirement_type: 'messages',
      requirement_value: 1000,
      reward_coins: 200,
      reward_xp: 0,
      reward_items: null
    },
    {
      achievement_id: 'streak_master',
      name: 'Streak Master',
      description: 'Achieve a 25-message streak',
      category: 'social',
      requirement_type: 'streak',
      requirement_value: 25,
      reward_coins: 300,
      reward_xp: 0,
      reward_items: JSON.stringify(['custom_title'])
    },
    {
      achievement_id: 'coin_collector',
      name: 'Coin Collector',
      description: 'Earn 5000 coins total',
      category: 'economy',
      requirement_type: 'coins',
      requirement_value: 5000,
      reward_coins: 500,
      reward_xp: 0,
      reward_items: null
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO achievements (guild_id, achievement_id, name, description, category, requirement_type, requirement_value, reward_coins, reward_xp, reward_items, is_active, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'SYSTEM', ?)
  `);

  defaultAchievements.forEach(achievement => {
    stmt.run(
      guildId,
      achievement.achievement_id,
      achievement.name,
      achievement.description,
      achievement.category,
      achievement.requirement_type,
      achievement.requirement_value,
      achievement.reward_coins,
      achievement.reward_xp,
      achievement.reward_items,
      Date.now()
    );
  });
}

// Get voice settings for guild
function getVoiceSettings(guildId) {
  const stmt = db.prepare('SELECT * FROM voice_settings WHERE guild_id = ?');
  return stmt.get(guildId);
}

// Update voice settings
function updateVoiceSettings(guildId, xpPerMinute, minSessionTime, maxDailyVoiceXP, voiceXPEnabled) {
  const stmt = db.prepare(`
    INSERT INTO voice_settings (guild_id, xp_per_minute, min_session_time, max_daily_voice_xp, voice_xp_enabled)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      xp_per_minute = excluded.xp_per_minute,
      min_session_time = excluded.min_session_time,
      max_daily_voice_xp = excluded.max_daily_voice_xp,
      voice_xp_enabled = excluded.voice_xp_enabled
  `);
  stmt.run(guildId, xpPerMinute, minSessionTime, maxDailyVoiceXP, voiceXPEnabled);
}

// Initialize default voice settings for new guilds
function initializeDefaultVoiceSettings(guildId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO voice_settings (guild_id, xp_per_minute, min_session_time, max_daily_voice_xp, voice_xp_enabled)
    VALUES (?, 10, 60, 500, 1)
  `);
  stmt.run(guildId);
}

// Start voice session
function startVoiceSession(userId, guildId, channelId) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO voice_sessions (user_id, guild_id, session_start, channel_id)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(userId, guildId, now, channelId);
}

// Update voice session
function updateVoiceSession(userId, guildId, sessionStart, speakingTime, isMuted, isDeafened) {
  const stmt = db.prepare(`
    UPDATE voice_sessions
    SET speaking_time = speaking_time + ?, is_muted = ?, is_deafened = ?
    WHERE user_id = ? AND guild_id = ? AND session_start = ?
  `);
  stmt.run(speakingTime, isMuted ? 1 : 0, isDeafened ? 1 : 0, userId, guildId, sessionStart);
}

// End voice session
function endVoiceSession(userId, guildId, sessionStart) {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE voice_sessions
    SET session_end = ?, voice_time = ?
    WHERE user_id = ? AND guild_id = ? AND session_start = ?
  `);
  stmt.run(now, Math.floor((now - sessionStart) / 1000), userId, guildId, sessionStart);
}

// Get active voice session for user
function getActiveVoiceSession(userId, guildId) {
  const stmt = db.prepare(`
    SELECT * FROM voice_sessions
    WHERE user_id = ? AND guild_id = ? AND session_end IS NULL
    ORDER BY session_start DESC LIMIT 1
  `);
  return stmt.get(userId, guildId);
}

// Get daily voice XP for user
function getDailyVoiceXP(userId, guildId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();

  const stmt = db.prepare(`
    SELECT SUM(voice_time) as total_voice_seconds,
           SUM(speaking_time) as total_speaking_seconds
    FROM voice_sessions
    WHERE user_id = ? AND guild_id = ? AND session_start >= ?
  `);

  return stmt.get(userId, guildId, todayTimestamp);
}

// Get spam settings for guild
function getSpamSettings(guildId) {
  const stmt = db.prepare('SELECT * FROM spam_settings WHERE guild_id = ?');
  return stmt.get(guildId);
}

// Update spam settings
function updateSpamSettings(guildId, settings) {
  const stmt = db.prepare(`
    INSERT INTO spam_settings (guild_id, spam_detection_enabled, max_duplicate_messages, max_caps_percentage, max_emoji_count, cooldown_multiplier, xp_penalty_enabled, warning_threshold, mute_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      spam_detection_enabled = excluded.spam_detection_enabled,
      max_duplicate_messages = excluded.max_duplicate_messages,
      max_caps_percentage = excluded.max_caps_percentage,
      max_emoji_count = excluded.max_emoji_count,
      cooldown_multiplier = excluded.cooldown_multiplier,
      xp_penalty_enabled = excluded.xp_penalty_enabled,
      warning_threshold = excluded.warning_threshold,
      mute_threshold = excluded.mute_threshold
  `);
  stmt.run(
    guildId,
    settings.spam_detection_enabled ?? 1,
    settings.max_duplicate_messages ?? 3,
    settings.max_caps_percentage ?? 80,
    settings.max_emoji_count ?? 10,
    settings.cooldown_multiplier ?? 1.5,
    settings.xp_penalty_enabled ?? 1,
    settings.warning_threshold ?? 3,
    settings.mute_threshold ?? 5
  );
}

// Initialize default spam settings for new guilds
function initializeDefaultSpamSettings(guildId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO spam_settings (guild_id, spam_detection_enabled, max_duplicate_messages, max_caps_percentage, max_emoji_count, cooldown_multiplier, xp_penalty_enabled, warning_threshold, mute_threshold)
    VALUES (?, 1, 3, 80, 10, 1.5, 1, 3, 5)
  `);
  stmt.run(guildId);
}

// Report spam activity
function reportSpam(userId, guildId, messageContent, spamType, severity, actionTaken) {
  const stmt = db.prepare(`
    INSERT INTO spam_reports (user_id, guild_id, message_content, spam_type, severity, timestamp, action_taken)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId, guildId, messageContent, spamType, severity, Date.now(), actionTaken);
}

// Add warning to user
function addWarning(userId, guildId, warningType, reason) {
  const stmt = db.prepare(`
    INSERT INTO user_warnings (user_id, guild_id, warning_type, warning_count, last_warning, reason)
    VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(user_id, guild_id, warning_type) DO UPDATE SET
      warning_count = warning_count + 1,
      last_warning = excluded.last_warning,
      reason = excluded.reason
  `);
  stmt.run(userId, guildId, warningType, Date.now(), reason);
}

// Get user warnings
function getUserWarnings(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM user_warnings WHERE user_id = ? AND guild_id = ?');
  return stmt.all(userId, guildId);
}

// Check if message is spam
function isSpamMessage(message, userMessageHistory = []) {
  const content = message.content.toLowerCase();
  const settings = getSpamSettings(message.guild.id) || {};

  if (!settings.spam_detection_enabled) return { isSpam: false, type: null, severity: 0 };

  // Check for duplicate messages
  const duplicateCount = userMessageHistory.filter(msg =>
    msg.content.toLowerCase() === content && (Date.now() - msg.timestamp) < 60000 // 1 minute window
  ).length;

  if (duplicateCount >= settings.max_duplicate_messages) {
    return { isSpam: true, type: 'duplicate', severity: 3 };
  }

  // Check for excessive caps
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const capsPercentage = content.length > 0 ? (capsCount / content.length) * 100 : 0;

  if (capsPercentage >= settings.max_caps_percentage && content.length > 10) {
    return { isSpam: true, type: 'caps', severity: 2 };
  }

  // Check for excessive emojis
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;

  if (emojiCount >= settings.max_emoji_count) {
    return { isSpam: true, type: 'emoji', severity: 2 };
  }

  // Check for suspicious patterns (all same character, excessive repetition)
  if (content.length > 20) {
    const uniqueChars = new Set(content.split('')).size;
    const repetitionRatio = uniqueChars / content.length;

    if (repetitionRatio < 0.1) { // Less than 10% unique characters
      return { isSpam: true, type: 'pattern', severity: 4 };
    }
  }

  return { isSpam: false, type: null, severity: 0 };
}

// Apply XP penalty for spam
function applyXPPenalty(userId, guildId, baseXP, spamType) {
  const settings = getSpamSettings(guildId);

  if (!settings.xp_penalty_enabled) return baseXP;

  // Apply penalty based on spam type
  let penaltyMultiplier = 1.0;

  switch (spamType) {
    case 'duplicate':
      penaltyMultiplier = 0.5; // 50% reduction
      break;
    case 'caps':
      penaltyMultiplier = 0.7; // 30% reduction
      break;
    case 'emoji':
      penaltyMultiplier = 0.8; // 20% reduction
      break;
    case 'pattern':
      penaltyMultiplier = 0.3; // 70% reduction
      break;
  }

  return Math.floor(baseXP * penaltyMultiplier);
}

// Get user message history for spam detection
function getUserMessageHistory(userId, guildId) {
  // In a real implementation, you'd want to store recent messages in memory or cache
  // For now, we'll return an empty array and rely on database patterns
  return [];
}

// Add message to history for spam detection
function addMessageToHistory(userId, guildId, content, timestamp) {
  // In a real implementation, you'd store this in memory with a TTL
  // For now, we'll just pass through since we don't need persistent message history
  return true;
}

// Get game settings for guild
function getGameSettings(guildId) {
  const stmt = db.prepare('SELECT * FROM game_settings WHERE guild_id = ?');
  return stmt.get(guildId);
}

// Update game settings
function updateGameSettings(guildId, settings) {
  const stmt = db.prepare(`
    INSERT INTO game_settings (guild_id, trivia_enabled, hangman_enabled, number_guess_enabled, rps_enabled, coin_flip_enabled, max_daily_games, xp_reward_base, coins_reward_base, difficulty_multiplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      trivia_enabled = excluded.trivia_enabled,
      hangman_enabled = excluded.hangman_enabled,
      number_guess_enabled = excluded.number_guess_enabled,
      rps_enabled = excluded.rps_enabled,
      coin_flip_enabled = excluded.coin_flip_enabled,
      max_daily_games = excluded.max_daily_games,
      xp_reward_base = excluded.xp_reward_base,
      coins_reward_base = excluded.coins_reward_base,
      difficulty_multiplier = excluded.difficulty_multiplier
  `);
  stmt.run(
    guildId,
    settings.trivia_enabled ?? 1,
    settings.hangman_enabled ?? 1,
    settings.number_guess_enabled ?? 1,
    settings.rps_enabled ?? 1,
    settings.coin_flip_enabled ?? 1,
    settings.max_daily_games ?? 10,
    settings.xp_reward_base ?? 50,
    settings.coins_reward_base ?? 25,
    settings.difficulty_multiplier ?? 1.0
  );
}

// Initialize default game settings for new guilds
function initializeDefaultGameSettings(guildId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO game_settings (guild_id, trivia_enabled, hangman_enabled, number_guess_enabled, rps_enabled, coin_flip_enabled, max_daily_games, xp_reward_base, coins_reward_base, difficulty_multiplier)
    VALUES (?, 1, 1, 1, 1, 1, 10, 50, 25, 1.0)
  `);
  stmt.run(guildId);
}

// Create new game
function createGame(guildId, channelId, userId, gameType, gameData) {
  const stmt = db.prepare(`
    INSERT INTO mini_games (guild_id, channel_id, user_id, game_type, game_data, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `);
  const result = stmt.run(guildId, channelId, userId, gameType, JSON.stringify(gameData), Date.now());

  return result.lastInsertRowid;
}

// Update game
function updateGame(gameId, gameData, status = 'active', rewardXP = 0, rewardCoins = 0, isWon = 0) {
  const stmt = db.prepare(`
    UPDATE mini_games
    SET game_data = ?, status = ?, completed_at = ?, reward_xp = ?, reward_coins = ?, is_won = ?
    WHERE game_id = ?
  `);
  stmt.run(JSON.stringify(gameData), status, status === 'completed' ? Date.now() : null, rewardXP, rewardCoins, isWon, gameId);
}

// Get active game for user in channel
function getActiveGame(guildId, channelId, userId) {
  const stmt = db.prepare(`
    SELECT * FROM mini_games
    WHERE guild_id = ? AND channel_id = ? AND user_id = ? AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `);
  return stmt.get(guildId, channelId, userId);
}

// Get daily game count for user
function getDailyGameCount(userId, guildId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM mini_games
    WHERE user_id = ? AND guild_id = ? AND created_at >= ?
  `);

  return stmt.get(userId, guildId, todayTimestamp).count;
}

// Trivia questions database
const triviaQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    answer: 2,
    category: "Geography",
    difficulty: "easy"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answer: 1,
    category: "Science",
    difficulty: "easy"
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    answer: 2,
    category: "Art",
    difficulty: "medium"
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    answer: 1,
    category: "Nature",
    difficulty: "easy"
  },
  {
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    answer: 1,
    category: "History",
    difficulty: "medium"
  }
];

// Get random trivia question
function getRandomTriviaQuestion() {
  return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
}

// Word list for hangman
const hangmanWords = [
  "JAVASCRIPT", "DISCORD", "GAMING", "PROGRAMMING", "COMPUTER",
  "KEYBOARD", "MONITOR", "SOFTWARE", "HARDWARE", "INTERNET",
  "BROWSER", "WEBSITE", "DATABASE", "ALGORITHM", "FUNCTION"
];

// Get server settings for guild
function getServerSettings(guildId) {
  const stmt = db.prepare('SELECT * FROM server_settings WHERE guild_id = ?');
  return stmt.get(guildId);
}

// Update server settings
function updateServerSettings(guildId, settings) {
  const stmt = db.prepare(`
    INSERT INTO server_settings (guild_id, xp_base_min, xp_base_max, level_formula, streak_bonus_enabled, streak_threshold, streak_multiplier, max_streak_bonus, embed_color, embed_footer, bot_prefix, welcome_message_enabled, welcome_message, level_up_message, auto_backup_enabled, backup_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      xp_base_min = excluded.xp_base_min,
      xp_base_max = excluded.xp_base_max,
      level_formula = excluded.level_formula,
      streak_bonus_enabled = excluded.streak_bonus_enabled,
      streak_threshold = excluded.streak_threshold,
      streak_multiplier = excluded.streak_multiplier,
      max_streak_bonus = excluded.max_streak_bonus,
      embed_color = excluded.embed_color,
      embed_footer = excluded.embed_footer,
      bot_prefix = excluded.bot_prefix,
      welcome_message_enabled = excluded.welcome_message_enabled,
      welcome_message = excluded.welcome_message,
      level_up_message = excluded.level_up_message,
      auto_backup_enabled = excluded.auto_backup_enabled,
      backup_time = excluded.backup_time
  `);
  stmt.run(
    guildId,
    settings.xp_base_min ?? 15,
    settings.xp_base_max ?? 25,
    settings.level_formula ?? '100 * (level ** 2)',
    settings.streak_bonus_enabled ?? 1,
    settings.streak_threshold ?? 2,
    settings.streak_multiplier ?? 2.0,
    settings.max_streak_bonus ?? 100,
    settings.embed_color ?? '#3498db',
    settings.embed_footer ?? 'Powered by Leveling Bot',
    settings.bot_prefix ?? '!',
    settings.welcome_message_enabled ?? 1,
    settings.welcome_message ?? 'Welcome to {server}! Start chatting to earn XP and level up!',
    settings.level_up_message ?? 'Congratulations {user}! You\'ve reached **Level {level}**!',
    settings.auto_backup_enabled ?? 1,
    settings.backup_time ?? '02:00'
  );
}

// Initialize default server settings for new guilds
function initializeDefaultServerSettings(guildId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO server_settings (guild_id, xp_base_min, xp_base_max, level_formula, streak_bonus_enabled, streak_threshold, streak_multiplier, max_streak_bonus, embed_color, embed_footer, bot_prefix, welcome_message_enabled, welcome_message, level_up_message, auto_backup_enabled, backup_time)
    VALUES (?, 15, 25, '100 * (level ** 2)', 1, 2, 2.0, 100, '#3498db', 'Powered by Leveling Bot', '!', 1, 'Welcome to {server}! Start chatting to earn XP and level up!', 'Congratulations {user}! You\'ve reached **Level {level}**!', 1, '02:00')
  `);
  stmt.run(guildId);
}

// Get channel multipliers for guild
function getChannelMultipliers(guildId) {
  const stmt = db.prepare('SELECT * FROM channel_multipliers WHERE guild_id = ? AND is_active = 1');
  return stmt.all(guildId);
}

// Set channel multiplier
function setChannelMultiplier(guildId, channelId, xpMultiplier, coinsMultiplier, createdBy) {
  const stmt = db.prepare(`
    INSERT INTO channel_multipliers (guild_id, channel_id, xp_multiplier, coins_multiplier, is_active, created_by, created_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(guild_id, channel_id) DO UPDATE SET
      xp_multiplier = excluded.xp_multiplier,
      coins_multiplier = excluded.coins_multiplier,
      created_by = excluded.created_by,
      created_at = excluded.created_at
  `);
  stmt.run(guildId, channelId, xpMultiplier, coinsMultiplier, createdBy, Date.now());
}

// Remove channel multiplier
function removeChannelMultiplier(guildId, channelId) {
  const stmt = db.prepare('UPDATE channel_multipliers SET is_active = 0 WHERE guild_id = ? AND channel_id = ?');
  stmt.run(guildId, channelId);
}

// Get role multipliers for guild
function getRoleMultipliers(guildId) {
  const stmt = db.prepare('SELECT * FROM role_multipliers WHERE guild_id = ? AND is_active = 1');
  return stmt.all(guildId);
}

// Set role multiplier
function setRoleMultiplier(guildId, roleId, xpMultiplier, coinsMultiplier, createdBy) {
  const stmt = db.prepare(`
    INSERT INTO role_multipliers (guild_id, role_id, xp_multiplier, coins_multiplier, is_active, created_by, created_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(guild_id, role_id) DO UPDATE SET
      xp_multiplier = excluded.xp_multiplier,
      coins_multiplier = excluded.coins_multiplier,
      created_by = excluded.created_by,
      created_at = excluded.created_at
  `);
  stmt.run(guildId, roleId, xpMultiplier, coinsMultiplier, createdBy, Date.now());
}

// Remove role multiplier
function removeRoleMultiplier(guildId, roleId) {
  const stmt = db.prepare('UPDATE role_multipliers SET is_active = 0 WHERE guild_id = ? AND role_id = ?');
  stmt.run(guildId, roleId);
}

// Set user title
function setUserTitle(userId, guildId, title, color) {
  const stmt = db.prepare(`
    INSERT INTO user_titles (user_id, guild_id, title, color, is_active, acquired_at)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      title = excluded.title,
      color = excluded.color,
      acquired_at = excluded.acquired_at
  `);
  stmt.run(userId, guildId, title, color, Date.now());
}

// Get user title
function getUserTitle(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM user_titles WHERE user_id = ? AND guild_id = ? AND is_active = 1');
  return stmt.get(userId, guildId);
}

// Calculate XP needed for level with custom formula
function getXPForLevel(level, guildId = null) {
  if (guildId) {
    const serverSettings = getServerSettings(guildId);
    if (serverSettings && serverSettings.level_formula) {
      return getXPForLevelCustom(level, serverSettings.level_formula);
    }
  }

  // Default formula
  return 100 * (level ** 2);
}

// Get applicable multipliers for message
function getApplicableMultipliers(userId, guildId, channelId) {
  const channelMultipliers = getChannelMultipliers(guildId);
  const roleMultipliers = getRoleMultipliers(guildId);

  // Find channel multiplier
  const channelMultiplier = channelMultipliers.find(cm => cm.channel_id === channelId);

  // Find applicable role multipliers for user
  let userRoleMultiplier = { xp_multiplier: 1.0, coins_multiplier: 1.0 };

  // Get user's roles (this would need to be implemented based on Discord.js guild member roles)
  // For now, we'll use a simplified approach
  const member = client.guilds.cache.get(guildId)?.members.cache.get(userId);
  if (member) {
    for (const role of member.roles.cache.values()) {
      const roleMultiplier = roleMultipliers.find(rm => rm.role_id === role.id);
      if (roleMultiplier) {
        userRoleMultiplier.xp_multiplier *= roleMultiplier.xp_multiplier;
        userRoleMultiplier.coins_multiplier *= roleMultiplier.coins_multiplier;
      }
    }
  }

  return {
    channel: channelMultiplier || { xp_multiplier: 1.0, coins_multiplier: 1.0 },
    role: userRoleMultiplier
  };
}

// Add XP to user with streak bonus
function addXP(message) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  const now = Date.now();

  // Initialize spam settings for new guilds
  initializeDefaultSpamSettings(guildId);

  let user = getUser(userId, guildId);

  // Check cooldown
  if (user && (now - user.last_message) < CONFIG.COOLDOWN) {
    return;
  }

  // Initialize user if doesn't exist
  if (!user) {
    user = { xp: 0, level: 1, last_message: 0, total_messages: 0, join_date: now };
  }

  // Get user's recent message history for spam detection
  const userMessageHistory = getUserMessageHistory(userId, guildId);

  // Check for spam
  const spamResult = handleSpamDetection(message, userMessageHistory);
  if (!spamResult.shouldAwardXP) {
    return; // Don't award XP for spam
  }

  // Add message to history for future spam detection
  addMessageToHistory(userId, guildId, message.content, now);

  // Increment total messages
  user.total_messages += 1;

  // Calculate XP gain with spam penalty
  const baseXP = Math.floor(Math.random() * (CONFIG.XP_MAX - CONFIG.XP_MIN + 1)) + CONFIG.XP_MIN;
  const penalizedXP = Math.floor(baseXP * spamResult.xpMultiplier);
  const streak = getUserStreak(userId, guildId);
  if (!streak) {
    streak = { streak_count: 1, last_streak_time: 0, best_streak: 1 };
  }

  // Check if streak should continue (within 2 minutes)
  const STREAK_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds
  if ((now - streak.last_streak_time) <= STREAK_THRESHOLD && streak.last_streak_time > 0) {
    // Continue streak
    streak.streak_count++;
    if (streak.streak_count > streak.best_streak) {
      streak.best_streak = streak.streak_count;
    }
  } else {
    // Reset streak
    streak.streak_count = 1;
  }

  // Update streak timestamp
  streak.last_streak_time = now;
  updateUserStreak(userId, guildId, streak.streak_count, streak.last_streak_time, streak.best_streak);

  // Calculate XP gain
  const streakBonus = calculateStreakBonus(streak.streak_count);
  const totalXP = penalizedXP + streakBonus;

  user.xp += totalXP;

  // Check for level up with custom formula
  const serverSettings = getServerSettings(guildId);
  const xpNeeded = getXPForLevel(user.level, guildId);
  let leveledUp = false;
  const oldLevel = user.level;

  if (user.xp >= xpNeeded) {
    user.level++;
    user.xp = user.xp - xpNeeded; // Carry over excess XP
    leveledUp = true;
  }

  // Update database
  updateUser(userId, guildId, user.xp, user.level, now, user.total_messages, user.join_date);

  // Update time stats
  updateTimeStats(userId, guildId, totalXP, 1, now);

  // Check for new achievements (after updating user data)
  const newlyUnlocked = checkAndUnlockAchievements(userId, guildId, user);

  // Send achievement notifications
  for (const achievement of newlyUnlocked) {
    const achievementEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Achievement Unlocked!')
      .setDescription(`**${achievement.name}**\n${achievement.description}`)
      .addFields(
        { name: 'Rewards', value: `${achievement.reward_coins > 0 ? `💰 ${achievement.reward_coins} coins` : ''}${achievement.reward_xp > 0 ? ` ⭐ ${achievement.reward_xp} XP` : ''}`.trim() || 'None', inline: true }
      )
      .setFooter({ text: `${achievement.category} Achievement` })
      .setTimestamp();

    message.channel.send({ embeds: [achievementEmbed] }).then(sent => {
      setTimeout(() => sent.delete().catch(() => {}), 15000);
    }).catch(() => {});
  }

  // Send level up message if leveled up with custom message
  if (leveledUp) {
    let levelUpMessage = serverSettings.level_up_message || 'Congratulations {user}! You\'ve reached **Level {level}**!';
    levelUpMessage = levelUpMessage.replace('{user}', message.author.toString()).replace('{level}', user.level.toString());

    const embed = new EmbedBuilder()
      .setColor(serverSettings.embed_color || '#FFD700')
      .setDescription(levelUpMessage)
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

    // Check and assign role rewards
    checkAndAssignRoleRewards(message.member, user.level, oldLevel);

    // Give coins for leveling up (100 coins per level)
    const levelUpCoins = user.level * 100;
    addCoins(userId, guildId, levelUpCoins, 'level_up');

    // Send level up coins notification with custom embed color
    const coinEmbed = new EmbedBuilder()
      .setColor(serverSettings.embed_color || '#FFD700')
      .setDescription(`💰 **Level Up Bonus!** +${levelUpCoins} coins for reaching Level ${user.level}!`)
      .setFooter({ text: 'Use /daily to earn more coins!' });

    message.channel.send({ embeds: [coinEmbed] }).then(sent => {
      setTimeout(() => sent.delete().catch(() => {}), 10000);
    }).catch(() => {});

    // Check for level-based achievements (additional check after level up)
    const levelAchievements = checkAndUnlockAchievements(userId, guildId, user);
    for (const achievement of levelAchievements) {
      if (achievement.requirement_type === 'level') {
        const achievementEmbed = new EmbedBuilder()
          .setColor(serverSettings.embed_color || '#FFD700')
          .setTitle('🏆 Achievement Unlocked!')
          .setDescription(`**${achievement.name}**\n${achievement.description}`)
          .addFields(
            { name: 'Rewards', value: `${achievement.reward_coins > 0 ? `💰 ${achievement.reward_coins} coins` : ''}${achievement.reward_xp > 0 ? ` ⭐ ${achievement.reward_xp} XP` : ''}`.trim() || 'None', inline: true }
          )
          .setFooter({ text: `${achievement.category} Achievement` })
          .setTimestamp();

        message.channel.send({ embeds: [achievementEmbed] }).then(sent => {
          setTimeout(() => sent.delete().catch(() => {}), 15000);
        }).catch(() => {});
      }
    }
  }

  // Send streak bonus message if streak > 1 with custom embed color
  if (streakBonus > 0) {
    const streakEmbed = new EmbedBuilder()
      .setColor(serverSettings.embed_color || '#ff6b35')
      .setDescription(`🔥 **Streak Bonus!** +${streakBonus} XP (Streak: ${streak.streak_count})`)
      .setFooter({ text: 'Keep chatting to maintain your streak!' });

    message.channel.send({ embeds: [streakEmbed] }).then(sent => {
      setTimeout(() => sent.delete().catch(() => {}), 5000);
    }).catch(() => {});
  }

  return leveledUp;
}

// Create beautiful rank card image
async function createRankCardImage(user, targetUser, guild) {
  if (!user) return null;

  // Get user title
  const userTitle = getUserTitle(targetUser.id, guild.id);

  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // User avatar
  try {
    const avatar = await Canvas.loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 128 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 60, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 65, 65, 120, 120);
    ctx.restore();

    // Avatar border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.stroke();
  } catch (error) {
    // Fallback if avatar fails to load
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(125, 125, 60, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(targetUser.username.charAt(0).toUpperCase(), 125, 140);
  }

  // Username and title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';

  // Display custom title if available
  if (userTitle && userTitle.title) {
    ctx.fillStyle = userTitle.color;
    ctx.font = 'bold 20px Arial';
    ctx.fillText(userTitle.title, 250, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(targetUser.username, 250, 85);
  } else {
    ctx.fillText(targetUser.username, 250, 80);
  }

  // Level
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`Level ${user.level}`, 250, 120);

  // XP Progress Bar
  const xpNeeded = getXPForLevel(user.level);
  const progress = user.xp / xpNeeded;
  const progressWidth = 300;

  // Progress bar background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(250, 140, progressWidth, 25);

  // Progress bar fill
  const progressGradient = ctx.createLinearGradient(250, 140, 250 + (progressWidth * progress), 165);
  progressGradient.addColorStop(0, '#00ff88');
  progressGradient.addColorStop(1, '#00ccff');

  ctx.fillStyle = progressGradient;
  ctx.fillRect(250, 140, progressWidth * progress, 25);

  // Progress text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${user.xp}/${xpNeeded} XP`, 250 + (progressWidth / 2), 157);

  // Stats
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';

  // Rank
  const rank = getUserRank(targetUser.id, guild.id);
  ctx.fillText(`Rank: #${rank}`, 250, 190);

  // Total Messages
  ctx.fillText(`Messages: ${user.total_messages}`, 400, 190);

  // Join Date
  const joinDate = new Date(user.join_date);
  const daysSinceJoin = Math.floor((Date.now() - user.join_date) / (1000 * 60 * 60 * 24));
  ctx.fillText(`Member for: ${daysSinceJoin} days`, 250, 220);

  return canvas.toBuffer();
}

// Create rank card embed (fallback if image creation fails)
function createRankCard(user, targetUser, guild) {
  if (!user) {
    return null;
  }

  const xpNeeded = getXPForLevel(user.level);
  const progress = Math.floor((user.xp / xpNeeded) * 100);

  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
    .setTitle('📊 Rank Card')
    .addFields(
      { name: 'Level', value: `${user.level}`, inline: true },
      { name: 'XP', value: `${user.xp}/${xpNeeded}`, inline: true },
      { name: 'Progress', value: `${progress}%`, inline: true },
      { name: 'Total Messages', value: `${user.total_messages}`, inline: true },
      { name: 'Rank', value: `#${getUserRank(targetUser.id, guild.id)}`, inline: true },
      { name: '\u200B', value: '\u200B', inline: true }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();

  return embed;
}

// Get role rewards for a guild
function getRoleRewards(guildId) {
  const stmt = db.prepare('SELECT level, role_id FROM role_rewards WHERE guild_id = ? ORDER BY level');
  return stmt.all(guildId);
}

// Set role reward for a level
function setRoleReward(guildId, level, roleId) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO role_rewards (guild_id, level, role_id)
    VALUES (?, ?, ?)
  `);
  stmt.run(guildId, level, roleId);
}

// Remove role reward for a level
function removeRoleReward(guildId, level) {
  const stmt = db.prepare('DELETE FROM role_rewards WHERE guild_id = ? AND level = ?');
  stmt.run(guildId, level);
}

// Get weekly leaderboard
function getWeeklyLeaderboard(guildId) {
  const currentWeekStart = getWeekStart(Date.now());

  const stmt = db.prepare(`
    SELECT user_id, weekly_xp, weekly_messages
    FROM time_stats
    WHERE guild_id = ? AND week_start = ?
    ORDER BY weekly_xp DESC, weekly_messages DESC
    LIMIT 10
  `);

  return stmt.all(guildId, currentWeekStart);
}

// Get monthly leaderboard
function getMonthlyLeaderboard(guildId) {
  const currentMonthStart = getMonthStart(Date.now());

  const stmt = db.prepare(`
    SELECT user_id, monthly_xp, monthly_messages
    FROM time_stats
    WHERE guild_id = ? AND month_start = ?
    ORDER BY monthly_xp DESC, monthly_messages DESC
    LIMIT 10
  `);

  return stmt.all(guildId, currentMonthStart);
}

// Bot ready event
client.once('ready', async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);

  // Register slash commands
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }

  client.user.setActivity('members level up! Use /help for commands', { type: 'WATCHING' });

  // Schedule daily backup at 2 AM
  scheduleDailyBackup();

  console.log('✅ Daily backup scheduled for 2:00 AM');
});

// Schedule daily backup
function scheduleDailyBackup() {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(2, 0, 0, 0); // 2:00 AM

  // If it's already past 2 AM today, schedule for tomorrow
  if (now.getTime() > targetTime.getTime()) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const msUntilBackup = targetTime.getTime() - now.getTime();

  setTimeout(() => {
    performDailyBackup();
    // Schedule next backup for tomorrow
    setInterval(performDailyBackup, 24 * 60 * 60 * 1000); // Every 24 hours
  }, msUntilBackup);
}

// Perform daily backup
function performDailyBackup() {
  console.log('🔄 Performing scheduled daily backup...');
  const backupPath = backupDatabase();

  if (backupPath) {
    // Clean up old backups (keep only last 7 days)
    cleanupOldBackups();
  }
}

// Clean up old backups (keep only last 7 days)
function cleanupOldBackups() {
  try {
    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) return;

    const files = fs.readdirSync(backupsDir);
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    files.forEach(file => {
      if (file.endsWith('.db')) {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error cleaning up old backups:', error);
  }
}

// Message event for XP gain
client.on('messageCreate', async (message) => {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;

  // Add XP
  addXP(message);
});

// Voice state update event for voice XP
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    const userId = newState.member.id;
    const guildId = newState.guild.id;

    // Initialize voice settings for new guilds
    initializeDefaultVoiceSettings(guildId);

    // User joined voice channel
    if (!oldState.channel && newState.channel) {
      startVoiceSession(userId, guildId, newState.channel.id);
      return;
    }

    // User left voice channel
    if (oldState.channel && !newState.channel) {
      const activeSession = getActiveVoiceSession(userId, guildId);
      if (activeSession) {
        endVoiceSession(userId, guildId, activeSession.session_start);

        // Award XP for voice session
        const sessionDuration = activeSession.voice_time || Math.floor((Date.now() - activeSession.session_start) / 1000);
        if (sessionDuration >= 60) { // Minimum 1 minute
          const awardedXP = awardVoiceXP(userId, guildId, sessionDuration);

          if (awardedXP > 0) {
            // Send voice XP notification (if in a text channel)
            const embed = new EmbedBuilder()
              .setColor('#9b59b6')
              .setDescription(`🎤 **Voice Activity Bonus!** +${awardedXP} XP for ${Math.floor(sessionDuration / 60)} minutes in voice!`)
              .setFooter({ text: 'Keep talking in voice channels to earn more!' });

            // Try to send in the first text channel
            const textChannel = newState.guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(newState.guild.members.me).has('SendMessages'));
            if (textChannel) {
              textChannel.send({ embeds: [embed] }).then(sent => {
                setTimeout(() => sent.delete().catch(() => {}), 10000);
              }).catch(() => {});
            }
          }
        }
      }
      return;
    }

    // User moved between voice channels or changed state
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      // End old session
      const activeSession = getActiveVoiceSession(userId, guildId);
      if (activeSession) {
        endVoiceSession(userId, guildId, activeSession.session_start);
      }

      // Start new session
      startVoiceSession(userId, guildId, newState.channel.id);
    }

    // Update speaking/mute status (if in same channel)
    if (oldState.channel && newState.channel && oldState.channel.id === newState.channel.id) {
      const activeSession = getActiveVoiceSession(userId, guildId);
      if (activeSession) {
        const speakingTime = newState.speaking ? 1 : 0; // Simplified - in real implementation you'd track actual speaking time
        updateVoiceSession(userId, guildId, activeSession.session_start, speakingTime, newState.mute, newState.deaf);
      }
    }
  } catch (error) {
    console.error('Error handling voice state update:', error);
  }
});

// Slash Command Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, guild, user } = interaction;

  try {
    switch (commandName) {
      case 'rank': {
        const targetUser = options.getUser('user') || user;
        const targetMember = guild.members.cache.get(targetUser.id);

        if (!targetMember) {
          return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        const userData = getUser(targetUser.id, guild.id);

        if (!userData) {
          return interaction.reply({
            content: `${targetUser.username} hasn't earned any XP yet!`,
            ephemeral: true
          });
        }

        try {
          // Try to create image rank card
          const rankCardBuffer = await createRankCardImage(userData, targetUser, guild);

          if (rankCardBuffer) {
            const attachment = new AttachmentBuilder(rankCardBuffer, { name: 'rank-card.png' });
            await interaction.reply({ files: [attachment] });
          } else {
            // Fallback to embed if image creation fails
            const embed = createRankCard(userData, targetUser, guild);
            await interaction.reply({ embeds: [embed] });
          }
        } catch (error) {
          console.error('Error creating rank card image:', error);
          // Fallback to embed if image creation fails
          const embed = createRankCard(userData, targetUser, guild);
          await interaction.reply({ embeds: [embed] });
        }
        break;
      }

      // ...
      case 'leaderboard': {
        const stmt = db.prepare(`
          SELECT user_id, xp, level, total_messages
          FROM users
          WHERE guild_id = ?
          ORDER BY level DESC, xp DESC
          LIMIT 10
        `);
        const topUsers = stmt.all(guild.id);

        if (topUsers.length === 0) {
          return interaction.reply({ content: 'No users on the leaderboard yet!', ephemeral: true });
        }

        let description = '';
        for (let i = 0; i < topUsers.length; i++) {
          const topUser = await client.users.fetch(topUsers[i].user_id).catch(() => null);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const username = topUser ? topUser.username : 'Unknown User';
          description += `${medal} **${username}** - Level ${topUsers[i].level} (${topUsers[i].xp} XP, ${topUsers[i].total_messages} msgs)\n`;
        }

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏆 Server Leaderboard')
          .setDescription(description)
          .setFooter({ text: guild.name })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'level': {
        const userData = getUser(user.id, guild.id);

        if (!userData) {
          return interaction.reply({
            content: "You haven't earned any XP yet! Start chatting to gain XP!",
            ephemeral: true
          });
        }

        const xpNeeded = getXPForLevel(userData.level);
        await interaction.reply({
          content: `You are **Level ${userData.level}** with **${userData.xp}/${xpNeeded} XP**! (${userData.total_messages} total messages)`,
          ephemeral: true
        });
        break;
      }

      case 'setxp': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const targetUser = options.getUser('user');
        const amount = options.getInteger('amount');

        if (amount < 0) {
          return interaction.reply({ content: '❌ XP amount cannot be negative!', ephemeral: true });
        }

        const targetMember = guild.members.cache.get(targetUser.id);
        if (!targetMember) {
          return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        const currentUser = getUser(targetUser.id, guild.id) || { xp: 0, level: 1, last_message: 0, total_messages: 0, join_date: Date.now() };
        currentUser.xp = amount;

        // Check if user should level up
        let newLevel = 1;
        let tempXP = amount;
        while (tempXP >= getXPForLevel(newLevel)) {
          tempXP -= getXPForLevel(newLevel);
          newLevel++;
        }
        currentUser.level = newLevel;
        currentUser.xp = tempXP;

        updateUser(targetUser.id, guild.id, currentUser.xp, currentUser.level, currentUser.last_message, currentUser.total_messages, currentUser.join_date);

        await interaction.reply({
          content: `✅ Set ${targetUser.username}'s XP to ${amount} (now Level ${currentUser.level})!`
        });
        break;
      }

      case 'resetxp': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const targetUser = options.getUser('user');
        const targetMember = guild.members.cache.get(targetUser.id);

        if (!targetMember) {
          return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        updateUser(targetUser.id, guild.id, 0, 1, 0, 0, Date.now());

        await interaction.reply({
          content: `✅ Reset ${targetUser.username}'s XP and level!`
        });
        break;
      }

      case 'stats': {
        const targetUser = options.getUser('user') || user;
        const targetMember = guild.members.cache.get(targetUser.id);

        if (!targetMember) {
          return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
        }

        const userData = getUser(targetUser.id, guild.id);

        if (!userData) {
          return interaction.reply({
            content: `${targetUser.username} hasn't earned any XP yet!`,
            ephemeral: true
          });
        }

        const xpNeeded = getXPForLevel(userData.level);
        const progress = Math.floor((userData.xp / xpNeeded) * 100);
        const joinDate = new Date(userData.join_date);
        const daysSinceJoin = Math.floor((Date.now() - userData.join_date) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
          .setTitle('📈 User Statistics')
          .addFields(
            { name: 'Current Level', value: `${userData.level}`, inline: true },
            { name: 'Current XP', value: `${userData.xp}/${xpNeeded}`, inline: true },
            { name: 'Progress', value: `${progress}%`, inline: true },
            { name: 'Total Messages', value: `${userData.total_messages}`, inline: true },
            { name: 'Server Rank', value: `#${getUserRank(targetUser.id, guild.id)}`, inline: true },
            { name: 'Member Since', value: `${daysSinceJoin} days ago`, inline: true }
          )
          .setFooter({ text: guild.name })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'addrolereward': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const level = interaction.options.getInteger('level');
        const role = interaction.options.getRole('role');

        // Check if role is manageable by the bot
        if (!role.editable) {
          return interaction.reply({
            content: '❌ I cannot assign this role! Make sure the role is below my highest role.',
            ephemeral: true
          });
        }

        // Check if level already has a reward
        const existingRewards = getRoleRewards(guild.id);
        const existingReward = existingRewards.find(r => r.level === level);

        if (existingReward) {
          return interaction.reply({
            content: `❌ Level ${level} already has a role reward set to <@&${existingReward.role_id}>! Use \`/removerolereward\` first.`,
            ephemeral: true
          });
        }

        setRoleReward(guild.id, level, role.id);

        await interaction.reply({
          content: `✅ Added role reward: **${role.name}** will be assigned when users reach **Level ${level}**!`
        });
        break;
      }

      case 'removerolereward': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const level = interaction.options.getInteger('level');

        const existingRewards = getRoleRewards(guild.id);
        const existingReward = existingRewards.find(r => r.level === level);

        if (!existingReward) {
          return interaction.reply({
            content: `❌ No role reward found for Level ${level}!`,
            ephemeral: true
          });
        }

        removeRoleReward(guild.id, level);

        const role = guild.roles.cache.get(existingReward.role_id);

        await interaction.reply({
          content: `✅ Removed role reward for Level ${level} (${role ? role.name : 'Unknown Role'})!`
        });
        break;
      }

      case 'listrolerewards': {
        const roleRewards = getRoleRewards(guild.id);

        if (roleRewards.length === 0) {
          return interaction.reply({
            content: '📋 No role rewards configured for this server. Use `/addrolereward` to add some!',
            ephemeral: true
          });
        }

        let description = '';
        for (const reward of roleRewards) {
          const role = guild.roles.cache.get(reward.role_id);
          const roleName = role ? role.name : 'Deleted Role';
          description += `**Level ${reward.level}**: ${roleName}\n`;
        }

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('🏆 Role Rewards')
          .setDescription(description)
          .setFooter({ text: guild.name })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'weeklylb': {
        const topUsers = getWeeklyLeaderboard(guild.id);

        if (topUsers.length === 0) {
          return interaction.reply({ content: '📊 No weekly stats available yet!', ephemeral: true });
        }

        let description = '';
        for (let i = 0; i < topUsers.length; i++) {
          const topUser = await client.users.fetch(topUsers[i].user_id).catch(() => null);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const username = topUser ? topUser.username : 'Unknown User';
          description += `${medal} **${username}** - ${topUsers[i].weekly_xp} XP (${topUsers[i].weekly_messages} msgs)\n`;
        }

        const weekStart = getWeekStart(Date.now());
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStart + (7 * 24 * 60 * 60 * 1000));

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📊 Weekly Leaderboard')
          .setDescription(description)
          .setFooter({ text: `Week: ${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'monthlylb': {
        const topUsers = getMonthlyLeaderboard(guild.id);

        if (topUsers.length === 0) {
          return interaction.reply({ content: '📊 No monthly stats available yet!', ephemeral: true });
        }

        let description = '';
        for (let i = 0; i < topUsers.length; i++) {
          const topUser = await client.users.fetch(topUsers[i].user_id).catch(() => null);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const username = topUser ? topUser.username : 'Unknown User';
          description += `${medal} **${username}** - ${topUsers[i].monthly_xp} XP (${topUsers[i].monthly_messages} msgs)\n`;
        }

        const monthStart = getMonthStart(Date.now());
        const monthStartDate = new Date(monthStart);
        const nextMonth = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 1);
        const monthEndDate = new Date(nextMonth.getTime() - 1);

        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('📊 Monthly Leaderboard')
          .setDescription(description)
          .setFooter({ text: `Month: ${monthStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'streak': {
        const streak = getUserStreak(user.id, guild.id);

        if (!streak) {
          return interaction.reply({
            content: '🔥 You haven\'t started a streak yet! Send some messages to begin building your streak!',
            ephemeral: true
          });
        }

        const streakBonus = calculateStreakBonus(streak.streak_count);
        const timeSinceLastMessage = Date.now() - streak.last_streak_time;
        const minutesSinceLastMessage = Math.floor(timeSinceLastMessage / (1000 * 60));

        const embed = new EmbedBuilder()
          .setColor('#ff6b35')
          .setTitle('🔥 Chat Streak')
          .setDescription(`**Current Streak:** ${streak.streak_count} messages\n**Best Streak:** ${streak.best_streak} messages\n**Streak Bonus:** +${streakBonus} XP`)
          .setFooter({ text: `Last message: ${minutesSinceLastMessage} minutes ago • Keep chatting within 2 minutes to maintain your streak!` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'daily': {
        if (!canClaimDaily(user.id, guild.id)) {
          const economy = getUserEconomy(user.id, guild.id);
          const nextClaim = new Date((economy.daily_last_claim || 0) + 24 * 60 * 60 * 1000);
          const timeUntilNext = nextClaim.getTime() - Date.now();
          const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));

          return interaction.reply({
            content: `⏰ **Daily reward already claimed!**\nNext claim available in **${hoursUntilNext} hours**!`,
            ephemeral: true
          });
        }

        const reward = claimDailyReward(user.id, guild.id);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('💰 Daily Reward Claimed!')
          .setDescription(`**Coins Earned:** ${reward.coinsEarned} 🪙\n**Streak Bonus:** +${reward.streakBonus} 🪙\n**Current Streak:** ${reward.newStreak} days\n**Best Streak:** ${reward.bestStreak} days`)
          .setFooter({ text: 'Come back tomorrow for more coins!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'balance': {
        const economy = getUserEconomy(user.id, guild.id) || { coins: 0, total_earned: 0 };

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('💰 Coin Balance')
          .setDescription(`**Current Balance:** ${economy.coins} 🪙\n**Total Earned:** ${economy.total_earned} 🪙\n**Daily Streak:** ${economy.daily_streak || 0} days`)
          .setFooter({ text: 'Use /daily to earn more coins!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'shop': {
        // Initialize default items and achievements if this is the first time
        initializeDefaultShopItems(guild.id);
        initializeDefaultAchievements(guild.id);
        initializeDefaultSpamSettings(guild.id);
        initializeDefaultServerSettings(guild.id);

        const items = getShopItems(guild.id);

        if (items.length === 0) {
          return interaction.reply({
            content: '🛒 **Shop is empty!**\nNo items are currently available for purchase.',
            ephemeral: true
          });
        }

        // Group items by category
        const categories = {};
        items.forEach(item => {
          if (!categories[item.category]) {
            categories[item.category] = [];
          }
          categories[item.category].push(item);
        });

        let description = '';
        Object.entries(categories).forEach(([category, categoryItems]) => {
          description += `\n**${category.toUpperCase()}**\n`;
          categoryItems.forEach(item => {
            description += `🔹 **${item.name}** - ${item.price} 🪙\n   ${item.description}\n`;
          });
        });

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('🛒 Server Shop')
          .setDescription(description)
          .setFooter({ text: 'Use /buy <item_id> to purchase items' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'buy': {
        const itemId = interaction.options.getString('item');

        // Initialize default items if needed
        initializeDefaultShopItems(guild.id);
        initializeDefaultAchievements(guild.id);
        initializeDefaultSpamSettings(guild.id);
        initializeDefaultServerSettings(guild.id);

        const purchase = purchaseItem(user.id, guild.id, itemId);

        if (!purchase.success) {
          return interaction.reply({
            content: `❌ **Purchase Failed:** ${purchase.error}`,
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Purchase Successful!')
          .setDescription(`**Item:** ${purchase.item.name}\n**Price:** ${purchase.spent} 🪙\n**Description:** ${purchase.item.description}`)
          .setFooter({ text: 'Check your inventory with /inventory' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'inventory': {
        const inventory = getUserInventory(user.id, guild.id);

        if (inventory.length === 0) {
          return interaction.reply({
            content: '🎒 **Your inventory is empty!**\nUse `/shop` to browse available items and `/buy` to purchase them.',
            ephemeral: true
          });
        }

        // Group items by category
        const categories = {};
        inventory.forEach(item => {
          if (!categories[item.category]) {
            categories[item.category] = [];
          }
          categories[item.category].push(item);
        });

        let description = '';
        Object.entries(categories).forEach(([category, categoryItems]) => {
          description += `\n**${category.toUpperCase()}**\n`;
          categoryItems.forEach(item => {
            description += `🔹 **${item.name}** ×${item.quantity}\n`;
          });
        });

        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🎒 Your Inventory')
          .setDescription(description)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'achievements': {
        // Initialize achievements if needed
        initializeDefaultAchievements(guild.id);
        initializeDefaultSpamSettings(guild.id);
        initializeDefaultServerSettings(guild.id);

        const userAchievements = getUserAchievements(user.id, guild.id);

        if (userAchievements.length === 0) {
          return interaction.reply({
            content: '🏆 **No achievements unlocked yet!**\nKeep playing to unlock achievements and earn rewards!',
            ephemeral: true
          });
        }

        // Group achievements by category
        const categories = {};
        userAchievements.forEach(achievement => {
          if (!categories[achievement.category]) {
            categories[achievement.category] = [];
          }
          categories[achievement.category].push(achievement);
        });

        let description = '';
        Object.entries(categories).forEach(([category, categoryAchievements]) => {
          description += `\n**${category.toUpperCase()}**\n`;
          categoryAchievements.forEach(achievement => {
            const unlockedDate = new Date(achievement.unlocked_at).toLocaleDateString();
            description += `🏆 **${achievement.name}**\n   ${achievement.description}\n   *Unlocked: ${unlockedDate}*\n`;
          });
        });

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏆 Your Achievements')
          .setDescription(description)
          .setFooter({ text: `${userAchievements.length} achievements unlocked` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'voice': {
        const dailyStats = getDailyVoiceXP(user.id, guild.id);
        const totalVoiceSeconds = dailyStats?.total_voice_seconds || 0;
        const totalSpeakingSeconds = dailyStats?.total_speaking_seconds || 0;

        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🎤 Voice Activity Stats')
          .setDescription(`**Today's Voice Time:** ${Math.floor(totalVoiceSeconds / 60)} minutes\n**Speaking Time:** ${Math.floor(totalSpeakingSeconds / 60)} minutes`)
          .setFooter({ text: 'Earn XP by spending time in voice channels!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'voice-settings': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const xpPerMinute = interaction.options.getInteger('xp_per_minute');
        const minSessionTime = interaction.options.getInteger('min_session_time');
        const maxDailyXP = interaction.options.getInteger('max_daily_xp');
        const enabled = interaction.options.getBoolean('enabled');

        const currentSettings = getVoiceSettings(guild.id) || {};

        const newSettings = {
          xp_per_minute: xpPerMinute ?? currentSettings.xp_per_minute ?? 10,
          min_session_time: minSessionTime ?? currentSettings.min_session_time ?? 60,
          max_daily_voice_xp: maxDailyXP ?? currentSettings.max_daily_voice_xp ?? 500,
          voice_xp_enabled: enabled ?? currentSettings.voice_xp_enabled ?? 1
        };

        updateVoiceSettings(guild.id, newSettings.xp_per_minute, newSettings.min_session_time, newSettings.max_daily_voice_xp, newSettings.voice_xp_enabled);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('⚙️ Voice Settings Updated')
          .setDescription(`**XP per minute:** ${newSettings.xp_per_minute}\n**Min session time:** ${newSettings.min_session_time} minutes\n**Max daily XP:** ${newSettings.max_daily_voice_xp}\n**Voice XP:** ${newSettings.voice_xp_enabled ? '✅ Enabled' : '❌ Disabled'}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'spam-settings': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const enabled = interaction.options.getBoolean('enabled');
        const maxDuplicates = interaction.options.getInteger('max_duplicates');
        const maxCapsPercent = interaction.options.getInteger('max_caps_percent');
        const maxEmojis = interaction.options.getInteger('max_emojis');
        const xpPenalty = interaction.options.getBoolean('xp_penalty');

        const currentSettings = getSpamSettings(guild.id) || {};

        const newSettings = {
          spam_detection_enabled: enabled ?? currentSettings.spam_detection_enabled ?? 1,
          max_duplicate_messages: maxDuplicates ?? currentSettings.max_duplicate_messages ?? 3,
          max_caps_percentage: maxCapsPercent ?? currentSettings.max_caps_percentage ?? 80,
          max_emoji_count: maxEmojis ?? currentSettings.max_emoji_count ?? 10,
          xp_penalty_enabled: xpPenalty ?? currentSettings.xp_penalty_enabled ?? 1
        };

        updateSpamSettings(guild.id, newSettings);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('⚙️ Spam Detection Settings Updated')
          .setDescription(`**Spam Detection:** ${newSettings.spam_detection_enabled ? '✅ Enabled' : '❌ Disabled'}\n**Max Duplicates:** ${newSettings.max_duplicate_messages}\n**Max Caps %:** ${newSettings.max_caps_percentage}%\n**Max Emojis:** ${newSettings.max_emoji_count}\n**XP Penalty:** ${newSettings.xp_penalty_enabled ? '✅ Enabled' : '❌ Disabled'}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'trivia': {
        // Initialize game settings if needed
        initializeDefaultGameSettings(guild.id);

        // Check daily game limit
        const dailyGames = getDailyGameCount(user.id, guild.id);
        const gameSettings = getGameSettings(guild.id);

        if (dailyGames >= gameSettings.max_daily_games) {
          return interaction.reply({
            content: `🎮 **Daily Game Limit Reached!**\nYou've played ${dailyGames}/${gameSettings.max_daily_games} games today. Come back tomorrow!`,
            ephemeral: true
          });
        }

        const question = getRandomTriviaQuestion();
        const gameData = {
          question: question.question,
          options: question.options,
          answer: question.answer,
          category: question.category,
          difficulty: question.difficulty,
          attempts: 0,
          maxAttempts: 3
        };

        const gameId = createGame(guild.id, interaction.channel.id, user.id, 'trivia', gameData);

        let optionsText = '';
        question.options.forEach((option, index) => {
          optionsText += `${index + 1}. ${option}\n`;
        });

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('🎯 Trivia Game')
          .setDescription(`**${question.question}**\n\n${optionsText}\n**Category:** ${question.category}\n**Difficulty:** ${question.difficulty}`)
          .setFooter({ text: `Game ID: ${gameId} • Reply with the number of your answer!` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'hangman': {
        // Initialize game settings if needed
        initializeDefaultGameSettings(guild.id);

        // Check daily game limit
        const dailyGames = getDailyGameCount(user.id, guild.id);
        const gameSettings = getGameSettings(guild.id);

        if (dailyGames >= gameSettings.max_daily_games) {
          return interaction.reply({
            content: `🎮 **Daily Game Limit Reached!**\nYou've played ${dailyGames}/${gameSettings.max_daily_games} games today. Come back tomorrow!`,
            ephemeral: true
          });
        }

        const word = getRandomHangmanWord();
        const gameData = {
          word: word,
          displayWord: '_'.repeat(word.length).split(''),
          guessedLetters: [],
          attempts: 0,
          maxAttempts: 6
        };

        const gameId = createGame(guild.id, interaction.channel.id, user.id, 'hangman', gameData);

        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('🔤 Hangman Game')
          .setDescription(`**Word:** ${gameData.displayWord.join(' ')}\n**Guessed Letters:** None\n**Attempts Left:** ${gameData.maxAttempts}`)
          .setFooter({ text: `Game ID: ${gameId} • Reply with a letter (A-Z)!` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'rps': {
        const userChoice = interaction.options.getString('choice');
        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let result, winner;
        if (userChoice === botChoice) {
          result = 'tie';
          winner = 'none';
        } else if (
          (userChoice === 'rock' && botChoice === 'scissors') ||
          (userChoice === 'paper' && botChoice === 'rock') ||
          (userChoice === 'scissors' && botChoice === 'paper')
        ) {
          result = 'win';
          winner = 'user';
        } else {
          result = 'lose';
          winner = 'bot';
        }

        const choiceEmojis = {
          rock: '🪨',
          paper: '📄',
          scissors: '✂️'
        };

        const embed = new EmbedBuilder()
          .setColor(result === 'tie' ? '#f39c12' : result === 'win' ? '#27ae60' : '#e74c3c')
          .setTitle('✂️📄🪨 Rock Paper Scissors')
          .setDescription(`**You chose:** ${choiceEmojis[userChoice]} ${userChoice}\n**Bot chose:** ${choiceEmojis[botChoice]} ${botChoice}\n\n**Result:** ${result === 'tie' ? '🤝 Tie!' : result === 'win' ? '🎉 You win!' : '😔 You lose!'}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'coinflip': {
        const betSide = interaction.options.getString('side');
        const betAmount = interaction.options.getInteger('amount');

        // Check if user has enough coins
        const economy = getUserEconomy(user.id, guild.id);
        if (!economy || economy.coins < betAmount) {
          return interaction.reply({
            content: `❌ **Insufficient Coins!**\nYou need ${betAmount} coins but only have ${economy?.coins || 0} coins.`,
            ephemeral: true
          });
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = betSide === result;

        if (won) {
          // User wins - double their bet
          addCoins(user.id, guild.id, betAmount, 'coin_flip_win');
        } else {
          // User loses - lose their bet
          removeCoins(user.id, guild.id, betAmount, 'coin_flip_loss');
        }

        const embed = new EmbedBuilder()
          .setColor(won ? '#27ae60' : '#e74c3c')
          .setTitle('🪙 Coin Flip')
          .setDescription(`**You bet:** ${betAmount} coins on **${betSide}**\n**Result:** ${result}\n\n**${won ? '🎉 You won!' : '😔 You lost!'}** ${won ? `+${betAmount} coins` : `-${betAmount} coins`}`)
          .setFooter({ text: 'Try again with /coinflip!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'server-settings': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const xpMin = interaction.options.getInteger('xp_min');
        const xpMax = interaction.options.getInteger('xp_max');
        const levelFormula = interaction.options.getString('level_formula');
        const embedColor = interaction.options.getString('embed_color');
        const streakEnabled = interaction.options.getBoolean('streak_enabled');

        const currentSettings = getServerSettings(guild.id) || {};

        const newSettings = {
          xp_base_min: xpMin ?? currentSettings.xp_base_min ?? 15,
          xp_base_max: xpMax ?? currentSettings.xp_base_max ?? 25,
          level_formula: levelFormula ?? currentSettings.level_formula ?? '100 * (level ** 2)',
          streak_bonus_enabled: streakEnabled ?? currentSettings.streak_bonus_enabled ?? 1,
          embed_color: embedColor ?? currentSettings.embed_color ?? '#3498db'
        };

        updateServerSettings(guild.id, newSettings);

        const embed = new EmbedBuilder()
          .setColor(newSettings.embed_color)
          .setTitle('⚙️ Server Settings Updated')
          .setDescription(`**XP Range:** ${newSettings.xp_base_min}-${newSettings.xp_base_max}\n**Level Formula:** \`${newSettings.level_formula}\`\n**Streak Bonus:** ${newSettings.streak_bonus_enabled ? '✅ Enabled' : '❌ Disabled'}\n**Embed Color:** ${newSettings.embed_color}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'channel-multiplier': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const channel = interaction.options.getChannel('channel');
        const xpMultiplier = interaction.options.getNumber('xp_multiplier') || 1.0;
        const coinsMultiplier = interaction.options.getNumber('coins_multiplier') || 1.0;

        setChannelMultiplier(guild.id, channel.id, xpMultiplier, coinsMultiplier, interaction.user.username);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('📈 Channel Multiplier Set')
          .setDescription(`**Channel:** ${channel}\n**XP Multiplier:** ${xpMultiplier}x\n**Coins Multiplier:** ${coinsMultiplier}x`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'role-multiplier': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        const role = interaction.options.getRole('role');
        const xpMultiplier = interaction.options.getNumber('xp_multiplier') || 1.0;
        const coinsMultiplier = interaction.options.getNumber('coins_multiplier') || 1.0;

        setRoleMultiplier(guild.id, role.id, xpMultiplier, coinsMultiplier, interaction.user.username);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('📈 Role Multiplier Set')
          .setDescription(`**Role:** ${role.name}\n**XP Multiplier:** ${xpMultiplier}x\n**Coins Multiplier:** ${coinsMultiplier}x`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'set-title': {
        const title = interaction.options.getString('title');
        const color = interaction.options.getString('color') || '#ffffff';

        // Validate color format
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          return interaction.reply({
            content: '❌ Invalid color format! Please use hex format like `#ff0000`',
            ephemeral: true
          });
        }

        setUserTitle(user.id, guild.id, title, color);

        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle('🏷️ Title Set!')
          .setDescription(`**New Title:** ${title}\n**Color:** ${color}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'backup': {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need Administrator permissions to use this command!',
            ephemeral: true
          });
        }

        await interaction.deferReply();

        const backupPath = backupDatabase();

        if (backupPath) {
          const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('💾 Database Backup Created')
            .setDescription(`✅ Database has been successfully backed up!\n📁 **Location:** \`${backupPath}\``)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.editReply({
            content: '❌ Failed to create database backup. Check console for details.'
          });
        }
        break;
      }

      case 'dbstats': {
        const stats = getDatabaseStats();

        if (!stats) {
          return interaction.reply({
            content: '❌ Could not retrieve database statistics.',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📊 Database Statistics')
          .addFields(
            { name: '👥 Users', value: `${stats.users}`, inline: true },
            { name: '🏠 Servers', value: `${stats.guilds}`, inline: true },
            { name: '💬 Total Messages', value: `${stats.totalMessages.toLocaleString()}`, inline: true },
            { name: '⭐ Total XP', value: `${stats.totalXP.toLocaleString()}`, inline: true },
            { name: '💾 Database Size', value: `${(stats.dbSize / 1024 / 1024).toFixed(2)} MB`, inline: true },
            { name: '❤️ Health', value: stats.isHealthy ? '✅ Healthy' : '❌ Issues Detected', inline: true }
          )
          .setFooter({ text: 'Database integrity check performed' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    await interaction.reply({
      content: '❌ There was an error while processing this command!',
      ephemeral: true
    });
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);

// Backup database
function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../backups/leveling-${timestamp}.db`);

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Copy database file
    fs.copyFileSync('leveling.db', backupPath);

    console.log(`✅ Database backed up to: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Error backing up database:', error);
    return null;
  }
}

// Restore database from backup
function restoreDatabase(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist');
    }

    // Close current database connection
    db.close();

    // Replace current database with backup
    fs.copyFileSync(backupPath, 'leveling.db');

    // Reopen database connection
    const Database = require('better-sqlite3');
    db = new Database('leveling.db');

    console.log(`✅ Database restored from: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error restoring database:', error);
    // Try to reopen original connection
    try {
      const Database = require('better-sqlite3');
      db = new Database('leveling.db');
    } catch (reconnectError) {
      console.error('❌ Could not reconnect to database after failed restore:', reconnectError);
    }
    return false;
  }
}

// Database integrity check
function checkDatabaseIntegrity() {
  try {
    const stmt = db.prepare('PRAGMA integrity_check');
    const result = stmt.get();
    return result.integrity_check === 'ok';
  } catch (error) {
    console.error('❌ Database integrity check failed:', error);
    return false;
  }
}

// Get database statistics
function getDatabaseStats() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const guildCount = db.prepare('SELECT COUNT(DISTINCT guild_id) as count FROM users').get().count;
    const totalMessages = db.prepare('SELECT SUM(total_messages) as total FROM users').get().total || 0;
    const totalXP = db.prepare('SELECT SUM(xp) as total FROM users').get().total || 0;

    const dbSize = fs.statSync('leveling.db').size;

    return {
      users: userCount,
      guilds: guildCount,
      totalMessages,
      totalXP,
      dbSize,
      isHealthy: checkDatabaseIntegrity()
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return null;
  }
}
