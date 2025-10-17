// Database setup and management for the Discord Leveling Bot

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize database
let db;
function initializeDatabase() {
  try {
    // Create database file if it doesn't exist
    if (!fs.existsSync('leveling.db')) {
      console.log('📄 Creating new database file...');
    }

    db = new Database('leveling.db');

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    // Create all tables
    createTables();

    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Create all database tables
function createTables() {
  // Users table - stores basic user information
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT,
      guild_id TEXT,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_message INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      join_date INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  // Role rewards table - stores role rewards for levels
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_rewards (
      guild_id TEXT,
      level INTEGER,
      role_id TEXT,
      PRIMARY KEY (guild_id, level)
    )
  `);

  // Time-based statistics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_stats (
      user_id TEXT,
      guild_id TEXT,
      week_start INTEGER,
      month_start INTEGER,
      weekly_xp INTEGER DEFAULT 0,
      monthly_xp INTEGER DEFAULT 0,
      weekly_messages INTEGER DEFAULT 0,
      monthly_messages INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id, week_start, month_start)
    )
  `);

  // Economy table - stores user coins and daily streaks
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

  // Shop items table - stores available items in shop
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      guild_id TEXT,
      item_id TEXT,
      name TEXT,
      description TEXT,
      price INTEGER,
      category TEXT,
      item_data TEXT,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at INTEGER,
      PRIMARY KEY (guild_id, item_id)
    )
  `);

  // User inventory table - stores user purchased items
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_inventory (
      user_id TEXT,
      guild_id TEXT,
      item_id TEXT,
      quantity INTEGER DEFAULT 1,
      acquired_at INTEGER,
      expires_at INTEGER,
      item_data TEXT,
      PRIMARY KEY (user_id, guild_id, item_id)
    )
  `);

  // Achievements table - stores achievement definitions
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      guild_id TEXT,
      achievement_id TEXT,
      name TEXT,
      description TEXT,
      category TEXT,
      requirement_type TEXT,
      requirement_value INTEGER,
      reward_coins INTEGER DEFAULT 0,
      reward_xp INTEGER DEFAULT 0,
      reward_items TEXT,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at INTEGER,
      PRIMARY KEY (guild_id, achievement_id)
    )
  `);

  // User achievements table - stores unlocked achievements
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

  // Voice sessions table - tracks voice activity
  db.exec(`
    CREATE TABLE IF NOT EXISTS voice_sessions (
      user_id TEXT,
      guild_id TEXT,
      session_start INTEGER,
      session_end INTEGER,
      channel_id TEXT,
      voice_time INTEGER DEFAULT 0,
      speaking_time INTEGER DEFAULT 0,
      is_muted INTEGER DEFAULT 0,
      is_deafened INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id, session_start)
    )
  `);

  // Voice settings table - voice XP configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS voice_settings (
      guild_id TEXT PRIMARY KEY,
      xp_per_minute INTEGER DEFAULT 10,
      min_session_time INTEGER DEFAULT 60,
      max_daily_voice_xp INTEGER DEFAULT 500,
      voice_xp_enabled INTEGER DEFAULT 1
    )
  `);

  // Spam settings table - spam detection configuration
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

  // Spam reports table - stores spam detection reports
  db.exec(`
    CREATE TABLE IF NOT EXISTS spam_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      guild_id TEXT,
      message_content TEXT,
      spam_type TEXT,
      severity INTEGER,
      timestamp INTEGER,
      action_taken TEXT,
      is_resolved INTEGER DEFAULT 0
    )
  `);

  // User warnings table - stores warnings issued to users
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_warnings (
      user_id TEXT,
      guild_id TEXT,
      warning_type TEXT,
      warning_count INTEGER DEFAULT 1,
      last_warning INTEGER,
      reason TEXT,
      PRIMARY KEY (user_id, guild_id, warning_type)
    )
  `);

  // Mini-games table - stores game sessions and results
  db.exec(`
    CREATE TABLE IF NOT EXISTS mini_games (
      game_id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      channel_id TEXT,
      user_id TEXT,
      game_type TEXT,
      game_data TEXT,
      status TEXT,
      created_at INTEGER,
      completed_at INTEGER,
      reward_xp INTEGER DEFAULT 0,
      reward_coins INTEGER DEFAULT 0,
      is_won INTEGER DEFAULT 0
    )
  `);

  // Game settings table - game configuration per guild
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

  // Server settings table - server-specific customization
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

  // Channel multipliers table - XP/coins multipliers per channel
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

  // Role multipliers table - XP/coins multipliers per role
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

  // User titles table - custom titles for users
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

  console.log('✅ All database tables created/verified');
}

// Get database instance
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Close database connection
function closeDatabase() {
  if (db) {
    db.close();
    console.log('✅ Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
