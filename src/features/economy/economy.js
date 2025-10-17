// Economy system for the Discord Leveling Bot
// Handles coins, daily rewards, and related functionality

const { getDatabase } = require('../../core/database');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

const db = getDatabase();

/**
 * Get user economy data
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {object|null} Economy data or null if not found
 */
function getUserEconomy(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM economy WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

/**
 * Update user economy data
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} coins - Coin amount
 * @param {number} totalEarned - Total coins earned
 * @param {number} dailyLastClaim - Last daily claim timestamp
 * @param {number} dailyStreak - Current daily streak
 * @param {number} bestDailyStreak - Best daily streak
 */
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

/**
 * Add coins to user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} amount - Amount to add
 * @param {string} reason - Reason for adding coins
 * @returns {object} Result with previous and new amounts
 */
function addCoins(userId, guildId, amount, reason = 'general') {
  const currentEconomy = getUserEconomy(userId, guildId) || { coins: 0, total_earned: 0 };
  const newCoins = currentEconomy.coins + amount;
  const newTotalEarned = currentEconomy.total_earned + amount;

  updateUserEconomy(userId, guildId, newCoins, newTotalEarned);

  return { previousCoins: currentEconomy.coins, newCoins, earned: amount };
}

/**
 * Remove coins from user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} amount - Amount to remove
 * @param {string} reason - Reason for removing coins
 * @returns {object} Result with previous and new amounts
 */
function removeCoins(userId, guildId, amount, reason = 'purchase') {
  const currentEconomy = getUserEconomy(userId, guildId) || { coins: 0 };
  const newCoins = Math.max(0, currentEconomy.coins - amount);

  updateUserEconomy(userId, guildId, newCoins);

  return { previousCoins: currentEconomy.coins, newCoins, spent: amount };
}

/**
 * Claim daily reward
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {object} Daily reward result
 */
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

/**
 * Check if user can claim daily reward
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {boolean} True if can claim
 */
function canClaimDaily(userId, guildId) {
  const economy = getUserEconomy(userId, guildId);
  if (!economy) return true;

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const lastClaim = economy.daily_last_claim || 0;

  return (now - lastClaim) >= oneDay;
}

module.exports = {
  getUserEconomy,
  updateUserEconomy,
  addCoins,
  removeCoins,
  claimDailyReward,
  canClaimDaily
};
