// Mini-games system for the Discord Leveling Bot
// Handles game creation, tracking, and rewards

const { getDatabase } = require('../../core/database');
const { addCoins } = require('../economy/economy');

const db = getDatabase();

/**
 * Get game settings for guild
 * @param {string} guildId - Guild ID
 * @returns {object} Game settings
 */
function getGameSettings(guildId) {
  const stmt = db.prepare('SELECT * FROM game_settings WHERE guild_id = ?');
  return stmt.get(guildId);
}

/**
 * Update game settings
 * @param {string} guildId - Guild ID
 * @param {object} settings - Settings to update
 */
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

/**
 * Initialize default game settings for new guilds
 * @param {string} guildId - Guild ID
 */
function initializeDefaultGameSettings(guildId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO game_settings (guild_id, trivia_enabled, hangman_enabled, number_guess_enabled, rps_enabled, coin_flip_enabled, max_daily_games, xp_reward_base, coins_reward_base, difficulty_multiplier)
    VALUES (?, 1, 1, 1, 1, 1, 10, 50, 25, 1.0)
  `);
  stmt.run(guildId);
}

/**
 * Create new game session
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID
 * @param {string} gameType - Game type
 * @param {object} gameData - Game state data
 * @returns {number} Game ID
 */
function createGame(guildId, channelId, userId, gameType, gameData) {
  const stmt = db.prepare(`
    INSERT INTO mini_games (guild_id, channel_id, user_id, game_type, game_data, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `);
  const result = stmt.run(guildId, channelId, userId, gameType, JSON.stringify(gameData), Date.now());

  return result.lastInsertRowid;
}

/**
 * Update game session
 * @param {number} gameId - Game ID
 * @param {object} gameData - Updated game data
 * @param {string} status - Game status
 * @param {number} rewardXP - XP reward
 * @param {number} rewardCoins - Coins reward
 * @param {number} isWon - Whether game was won
 */
function updateGame(gameId, gameData, status = 'active', rewardXP = 0, rewardCoins = 0, isWon = 0) {
  const stmt = db.prepare(`
    UPDATE mini_games
    SET game_data = ?, status = ?, completed_at = ?, reward_xp = ?, reward_coins = ?, is_won = ?
    WHERE game_id = ?
  `);
  stmt.run(JSON.stringify(gameData), status, status === 'completed' ? Date.now() : null, rewardXP, rewardCoins, isWon, gameId);
}

/**
 * Get active game for user in channel
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID
 * @returns {object|null} Active game or null
 */
function getActiveGame(guildId, channelId, userId) {
  const stmt = db.prepare(`
    SELECT * FROM mini_games
    WHERE guild_id = ? AND channel_id = ? AND user_id = ? AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `);
  return stmt.get(guildId, channelId, userId);
}

/**
 * Get daily game count for user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {number} Daily game count
 */
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

/**
 * Award game rewards
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} xpReward - XP to award
 * @param {number} coinsReward - Coins to award
 * @param {boolean} isWin - Whether user won
 */
function awardGameRewards(userId, guildId, xpReward, coinsReward, isWin) {
  if (xpReward > 0) {
    // Add XP (this will trigger level up checks in leveling system)
    const currentUser = getUser(userId, guildId) || { xp: 0, level: 1, last_message: 0, total_messages: 0, join_date: Date.now() };
    updateUser(userId, guildId, currentUser.xp + xpReward, currentUser.level, currentUser.last_message, currentUser.total_messages, currentUser.join_date);
  }

  if (coinsReward > 0) {
    addCoins(userId, guildId, coinsReward, isWin ? 'game_win' : 'game_participation');
  }
}

/**
 * Trivia questions database
 */
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

/**
 * Get random trivia question
 * @returns {object} Random trivia question
 */
function getRandomTriviaQuestion() {
  return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
}

/**
 * Word list for hangman
 */
const hangmanWords = [
  "JAVASCRIPT", "DISCORD", "GAMING", "PROGRAMMING", "COMPUTER",
  "KEYBOARD", "MONITOR", "SOFTWARE", "HARDWARE", "INTERNET",
  "BROWSER", "WEBSITE", "DATABASE", "ALGORITHM", "FUNCTION"
];

/**
 * Get random word for hangman
 * @returns {string} Random word
 */
function getRandomHangmanWord() {
  return hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
}

module.exports = {
  getGameSettings,
  updateGameSettings,
  initializeDefaultGameSettings,
  createGame,
  updateGame,
  getActiveGame,
  getDailyGameCount,
  awardGameRewards,
  getRandomTriviaQuestion,
  getRandomHangmanWord
};
