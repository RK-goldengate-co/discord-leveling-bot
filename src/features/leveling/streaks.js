// Streak system for the Discord Leveling Bot
// Handles streak calculation, tracking, and bonuses

const { getDatabase } = require('../../core/database');

const db = getDatabase();

/**
 * Get user streak data
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {object|null} Streak data or null if not found
 */
function getUserStreak(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM user_streaks WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

/**
 * Update user streak data
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} streakCount - Current streak count
 * @param {number} lastStreakTime - Last streak timestamp
 * @param {number} bestStreak - Best streak achieved
 */
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

/**
 * Calculate streak bonus XP
 * @param {number} streakCount - Current streak count
 * @returns {number} Streak bonus XP
 */
function calculateStreakBonus(streakCount) {
  // Bonus XP = streak_length * 2, max bonus 100 XP (streak 50)
  return Math.min(streakCount * 2, 100);
}

/**
 * Process streak for message
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} timestamp - Message timestamp
 * @returns {object} Streak processing result
 */
function processStreak(userId, guildId, timestamp) {
  let streak = getUserStreak(userId, guildId);
  if (!streak) {
    streak = { streak_count: 1, last_streak_time: 0, best_streak: 1 };
  }

  // Check if streak should continue (within 2 minutes by default)
  const STREAK_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds
  if ((timestamp - streak.last_streak_time) <= STREAK_THRESHOLD && streak.last_streak_time > 0) {
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
  streak.last_streak_time = timestamp;
  updateUserStreak(userId, guildId, streak.streak_count, streak.last_streak_time, streak.best_streak);

  return {
    currentStreak: streak.streak_count,
    bestStreak: streak.best_streak,
    streakBonus: calculateStreakBonus(streak.streak_count)
  };
}

/**
 * Reset user streak (for admin use)
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 */
function resetUserStreak(userId, guildId) {
  updateUserStreak(userId, guildId, 1, Date.now(), 1);
}

module.exports = {
  getUserStreak,
  updateUserStreak,
  calculateStreakBonus,
  processStreak,
  resetUserStreak
};
