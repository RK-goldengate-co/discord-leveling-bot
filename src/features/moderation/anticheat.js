// Anti-cheat measures for the Discord Leveling Bot
// Handles suspicious activity detection and prevention

const { getDatabase } = require('../../core/database');

const db = getDatabase();

/**
 * Check for suspicious activity patterns
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {Message} message - Discord message
 * @returns {object} Suspicious activity result
 */
function checkSuspiciousActivity(userId, guildId, message) {
  // Check for rapid message sending (potential bot behavior)
  const recentMessages = getRecentUserMessages(userId, guildId, 10); // Last 10 messages
  const now = Date.now();

  if (recentMessages.length >= 5) {
    const timeSpan = now - recentMessages[0].timestamp;
    const avgInterval = timeSpan / (recentMessages.length - 1);

    // If average interval is less than 1 second, suspicious
    if (avgInterval < 1000) {
      return {
        isSuspicious: true,
        type: 'rapid_messaging',
        severity: 4,
        reason: 'Messages sent too rapidly'
      };
    }
  }

  // Check for identical message patterns (copy-paste spam)
  const identicalCount = recentMessages.filter(msg =>
    msg.content === message.content
  ).length;

  if (identicalCount >= 3) {
    return {
      isSuspicious: true,
      type: 'copy_paste',
      severity: 3,
      reason: 'Identical messages detected'
    };
  }

  // Check for bot-like patterns (no variation in message length)
  if (recentMessages.length >= 5) {
    const lengths = recentMessages.map(msg => msg.content.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;

    // If variance is very low (all messages same length), suspicious
    if (variance < 10 && avgLength > 5) {
      return {
        isSuspicious: true,
        type: 'bot_pattern',
        severity: 3,
        reason: 'Suspicious message pattern detected'
      };
    }
  }

  return { isSuspicious: false, type: null, severity: 0 };
}

/**
 * Get recent messages for user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of messages to get
 * @returns {Array} Recent messages
 */
function getRecentUserMessages(userId, guildId, limit = 10) {
  // In a real implementation, this would query recent messages from database
  // For now, return empty array as we don't store message history
  return [];
}

/**
 * Report suspicious activity
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} activityType - Type of suspicious activity
 * @param {number} severity - Severity level
 * @param {string} reason - Reason for report
 */
function reportSuspiciousActivity(userId, guildId, activityType, severity, reason) {
  const stmt = db.prepare(`
    INSERT INTO spam_reports (user_id, guild_id, message_content, spam_type, severity, timestamp, action_taken)
    VALUES (?, ?, ?, ?, ?, ?, 'reported')
  `);
  stmt.run(userId, guildId, reason, activityType, severity, Date.now());
}

/**
 * Handle suspicious activity detection
 * @param {Message} message - Discord message
 * @returns {object} Detection result
 */
async function handleSuspiciousActivity(message) {
  const suspiciousCheck = checkSuspiciousActivity(message.author.id, message.guild.id, message);

  if (!suspiciousCheck.isSuspicious) {
    return { isClean: true };
  }

  // Report suspicious activity
  reportSuspiciousActivity(
    message.author.id,
    message.guild.id,
    suspiciousCheck.type,
    suspiciousCheck.severity,
    suspiciousCheck.reason
  );

  // Add warning
  const { addWarning } = require('../moderation/spam');
  addWarning(message.author.id, message.guild.id, 'suspicious_activity', suspiciousCheck.reason);

  return {
    isClean: false,
    type: suspiciousCheck.type,
    severity: suspiciousCheck.severity,
    reason: suspiciousCheck.reason
  };
}

module.exports = {
  checkSuspiciousActivity,
  getRecentUserMessages,
  reportSuspiciousActivity,
  handleSuspiciousActivity
};
