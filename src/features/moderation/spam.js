// Spam detection system for the Discord Leveling Bot
// Handles spam detection, reporting, and penalties

const { getDatabase } = require('../../core/database');
const { createWarningEmbed } = require('../../utils/embeds');

const db = getDatabase();

/**
 * Get spam settings for guild
 * @param {string} guildId - Guild ID
 * @returns {object} Spam settings
 */
function getSpamSettings(guildId) {
  const stmt = db.prepare('SELECT * FROM spam_settings WHERE guild_id = ?');
  return stmt.get(guildId);
}

/**
 * Update spam settings
 * @param {string} guildId - Guild ID
 * @param {object} settings - Settings to update
 */
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

/**
 * Initialize default spam settings for new guilds
 * @param {string} guildId - Guild ID
 */
function initializeDefaultSpamSettings(guildId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO spam_settings (guild_id, spam_detection_enabled, max_duplicate_messages, max_caps_percentage, max_emoji_count, cooldown_multiplier, xp_penalty_enabled, warning_threshold, mute_threshold)
    VALUES (?, 1, 3, 80, 10, 1.5, 1, 3, 5)
  `);
  stmt.run(guildId);
}

/**
 * Report spam activity
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} messageContent - Message content
 * @param {string} spamType - Type of spam
 * @param {number} severity - Severity level
 * @param {string} actionTaken - Action taken
 */
function reportSpam(userId, guildId, messageContent, spamType, severity, actionTaken) {
  const stmt = db.prepare(`
    INSERT INTO spam_reports (user_id, guild_id, message_content, spam_type, severity, timestamp, action_taken)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId, guildId, messageContent, spamType, severity, Date.now(), actionTaken);
}

/**
 * Add warning to user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} warningType - Warning type
 * @param {string} reason - Reason for warning
 */
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

/**
 * Get user warnings
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {Array} Array of warnings
 */
function getUserWarnings(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM user_warnings WHERE user_id = ? AND guild_id = ?');
  return stmt.all(userId, guildId);
}

/**
 * Check if message is spam
 * @param {Message} message - Discord message object
 * @param {Array} userMessageHistory - User's recent message history
 * @returns {object} Spam detection result
 */
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

/**
 * Apply XP penalty for spam
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} baseXP - Base XP amount
 * @param {string} spamType - Type of spam
 * @returns {number} Penalized XP amount
 */
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

/**
 * Handle spam detection and response
 * @param {Message} message - Discord message object
 * @param {Array} userMessageHistory - User's message history
 * @returns {object} Spam handling result
 */
async function handleSpamDetection(message, userMessageHistory) {
  const spamCheck = isSpamMessage(message, userMessageHistory);

  if (!spamCheck.isSpam) return { shouldAwardXP: true, xpMultiplier: 1.0 };

  // Report spam
  reportSpam(message.author.id, message.guild.id, message.content, spamCheck.type, spamCheck.severity, 'none');

  // Add warning
  addWarning(message.author.id, message.guild.id, 'spam', `${spamCheck.type} spam detected`);

  // Apply XP penalty
  const xpMultiplier = applyXPPenalty(message.author.id, message.guild.id, 1.0, spamCheck.type);

  // Send warning message
  if (spamCheck.severity >= 3) {
    const warningEmbed = createWarningEmbed(
      'Spam Warning',
      `Please avoid ${spamCheck.type} messages to maintain fair gameplay!`
    );

    message.channel.send({ embeds: [warningEmbed] }).then(sent => {
      setTimeout(() => sent.delete().catch(() => {}), 10000);
    }).catch(() => {});
  }

  return { shouldAwardXP: true, xpMultiplier };
}

/**
 * Get user message history for spam detection
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {Array} User's recent message history
 */
function getUserMessageHistory(userId, guildId) {
  // In a real implementation, you'd want to store recent messages in memory or cache
  // For now, we'll return an empty array and rely on database patterns
  return [];
}

/**
 * Add message to history for spam detection
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} content - Message content
 * @param {number} timestamp - Message timestamp
 */
function addMessageToHistory(userId, guildId, content, timestamp) {
  // In a real implementation, you'd store this in memory with a TTL
  // For now, we'll just pass through since we don't need persistent message history
  return true;
}

module.exports = {
  getSpamSettings,
  updateSpamSettings,
  initializeDefaultSpamSettings,
  reportSpam,
  addWarning,
  getUserWarnings,
  isSpamMessage,
  applyXPPenalty,
  handleSpamDetection,
  getUserMessageHistory,
  addMessageToHistory
};
