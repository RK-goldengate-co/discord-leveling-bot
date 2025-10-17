// Leveling system for the Discord Leveling Bot
// Handles XP calculation, level progression, and related functionality

const { getDatabase } = require('../../core/database');
const { getServerSettings } = require('../social/achievements');
const { checkAndAssignRoleRewards } = require('../social/roles');
const { getApplicableMultipliers } = require('../social/achievements');
const { addCoins } = require('../economy/economy');
const { checkAndUnlockAchievements } = require('../social/achievements');
const { updateTimeStats } = require('../social/achievements');

const db = getDatabase();

/**
 * Calculate XP needed for level with custom formula
 * @param {number} level - Current level
 * @param {string} guildId - Guild ID for custom settings
 * @returns {number} XP needed for next level
 */
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

/**
 * Calculate XP needed for level with custom formula
 * @param {number} level - Current level
 * @param {string} formula - Custom formula string
 * @returns {number} XP needed for next level
 */
function getXPForLevelCustom(level, formula) {
  try {
    // Replace 'level' in formula with actual level number
    const formulaWithLevel = formula.replace(/level/g, level.toString());
    // Use Function constructor to safely evaluate mathematical expressions
    const result = new Function('return ' + formulaWithLevel)();
    return Math.max(1, Math.floor(result));
  } catch (error) {
    console.error('Error evaluating level formula:', error);
    // Fallback to default formula
    return 100 * (level ** 2);
  }
}

/**
 * Get user data from database
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {object|null} User data or null if not found
 */
function getUser(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

/**
 * Update or create user data
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} xp - XP amount
 * @param {number} level - Level
 * @param {number} lastMessage - Last message timestamp
 * @param {number} totalMessages - Total messages sent
 * @param {number} joinDate - Join date timestamp
 */
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
 * Add XP to user with all calculations
 * @param {Message} message - Discord message object
 * @returns {boolean} True if user leveled up
 */
function addXP(message) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  const channelId = message.channel.id;
  const now = Date.now();

  let user = getUser(userId, guildId);

  // Check cooldown
  if (user && (now - user.last_message) < 60000) { // 60 seconds cooldown
    return false;
  }

  // Initialize user if doesn't exist
  if (!user) {
    user = { xp: 0, level: 1, last_message: 0, total_messages: 0, join_date: now };
  }

  // Get server settings for custom XP rates
  const serverSettings = getServerSettings(guildId) || {};

  // Get applicable multipliers
  const multipliers = getApplicableMultipliers(userId, guildId, channelId);

  // Calculate base XP with server settings
  const baseMin = serverSettings.xp_base_min || 15;
  const baseMax = serverSettings.xp_base_max || 25;
  const baseXP = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

  // Apply multipliers
  const finalXP = Math.floor(baseXP * multipliers.channel.xp_multiplier * multipliers.role.xp_multiplier);

  // Calculate streak bonus with custom settings
  let streakBonus = 0;
  if (serverSettings.streak_bonus_enabled) {
    const streak = getUserStreak(userId, guildId);
    if (!streak) {
      streak = { streak_count: 1, last_streak_time: 0, best_streak: 1 };
    }

    // Check if streak should continue (within custom threshold)
    const STREAK_THRESHOLD = (serverSettings.streak_threshold || 2) * 60 * 1000;
    if ((now - streak.last_streak_time) <= STREAK_THRESHOLD && streak.last_streak_time > 0) {
      // Continue streak
      streak.streak_count++;
      if (streak.streak_count > streak.best_streak) {
        streak.best_streak = streak.streak_count;
      }
      streakBonus = Math.min(streak.streak_count * (serverSettings.streak_multiplier || 2), serverSettings.max_streak_bonus || 100);
    } else {
      // Reset streak
      streak.streak_count = 1;
    }

    // Update streak timestamp
    streak.last_streak_time = now;
    updateUserStreak(userId, guildId, streak.streak_count, streak.last_streak_time, streak.best_streak);
  }

  const totalXP = finalXP + streakBonus;
  user.xp += totalXP;

  // Check for level up with custom formula
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

/**
 * Get user rank in server
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {number} User rank (1-based)
 */
function getUserRank(userId, guildId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE guild_id = ? AND (level > (SELECT level FROM users WHERE user_id = ? AND guild_id = ?) OR
         (level = (SELECT level FROM users WHERE user_id = ? AND guild_id = ?) AND
          xp > (SELECT xp FROM users WHERE user_id = ? AND guild_id = ?)))
  `);

  const result = stmt.get(guildId, userId, guildId, userId, guildId, userId, guildId);
  return result.rank;
}

/**
 * Create rank card embed
 * @param {object} user - User data
 * @param {User} targetUser - Discord user object
 * @param {Guild} guild - Discord guild object
 * @returns {EmbedBuilder} Rank card embed
 */
function createRankCard(user, targetUser, guild) {
  if (!user) {
    return null;
  }

  const xpNeeded = getXPForLevel(user.level, guild.id);
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

/**
 * Create level info embed
 * @param {object} user - User data
 * @param {string} guildId - Guild ID for custom settings
 * @returns {EmbedBuilder} Level info embed
 */
function createLevelInfo(user, guildId) {
  if (!user) {
    return null;
  }

  const xpNeeded = getXPForLevel(user.level, guildId);
  const progress = Math.floor((user.xp / xpNeeded) * 100);

  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('📈 Level Information')
    .setDescription(`**Current Level:** ${user.level}\n**Current XP:** ${user.xp}/${xpNeeded}\n**Progress:** ${progress}%`)
    .setTimestamp();

  return embed;
}

/**
 * Set user XP (admin function)
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} amount - XP amount to set
 * @returns {object} Result of operation
 */
function setUserXP(userId, guildId, amount) {
  if (amount < 0) {
    return { success: false, error: 'XP amount cannot be negative' };
  }

  const currentUser = getUser(userId, guildId) || { xp: 0, level: 1, last_message: 0, total_messages: 0, join_date: Date.now() };
  currentUser.xp = amount;

  // Check if user should level up
  let newLevel = 1;
  let tempXP = amount;
  while (tempXP >= getXPForLevel(newLevel, guildId)) {
    tempXP -= getXPForLevel(newLevel, guildId);
    newLevel++;
  }
  currentUser.level = newLevel;
  currentUser.xp = tempXP;

  updateUser(userId, guildId, currentUser.xp, currentUser.level, currentUser.last_message, currentUser.total_messages, currentUser.join_date);

  return {
    success: true,
    previousLevel: currentUser.level,
    newLevel: newLevel,
    previousXP: currentUser.xp,
    newXP: tempXP
  };
}

/**
 * Reset user XP (admin function)
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {boolean} Success status
 */
function resetUserXP(userId, guildId) {
  updateUser(userId, guildId, 0, 1, 0, 0, Date.now());
  return true;
}

/**
 * Get leaderboard for guild
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {Array} Leaderboard data
 */
function getLeaderboard(guildId, limit = 10) {
  const stmt = db.prepare(`
    SELECT user_id, xp, level, total_messages
    FROM users
    WHERE guild_id = ?
    ORDER BY level DESC, xp DESC
    LIMIT ?
  `);
  return stmt.all(guildId, limit);
}

/**
 * Get weekly leaderboard for guild
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {Array} Weekly leaderboard data
 */
function getWeeklyLeaderboard(guildId, limit = 10) {
  const currentWeekStart = getWeekStart(Date.now());

  const stmt = db.prepare(`
    SELECT user_id, weekly_xp, weekly_messages
    FROM time_stats
    WHERE guild_id = ? AND week_start = ?
    ORDER BY weekly_xp DESC, weekly_messages DESC
    LIMIT ?
  `);

  return stmt.all(guildId, currentWeekStart, limit);
}

/**
 * Get monthly leaderboard for guild
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {Array} Monthly leaderboard data
 */
function getMonthlyLeaderboard(guildId, limit = 10) {
  const currentMonthStart = getMonthStart(Date.now());

  const stmt = db.prepare(`
    SELECT user_id, monthly_xp, monthly_messages
    FROM time_stats
    WHERE guild_id = ? AND month_start = ?
    ORDER BY monthly_xp DESC, monthly_messages DESC
    LIMIT ?
  `);

  return stmt.all(guildId, currentMonthStart, limit);
}

module.exports = {
  getXPForLevel,
  getXPForLevelCustom,
  getUser,
  updateUser,
  calculateStreakBonus,
  addXP,
  getUserRank,
  createRankCard,
  createLevelInfo,
  setUserXP,
  resetUserXP,
  getLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard
};
