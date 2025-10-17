// Helper utility functions for the Discord Leveling Bot
// This file contains common utility functions used throughout the bot

/**
 * Get start of week (Monday) timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {number} Start of week timestamp
 */
function getWeekStart(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

/**
 * Get start of month timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {number} Start of month timestamp
 */
function getMonthStart(timestamp) {
  const date = new Date(timestamp);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get current timestamp
 * @returns {number} Current Unix timestamp
 */
function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Check if user is admin
 * @param {GuildMember} member - Discord guild member
 * @returns {boolean} True if user has admin permissions
 */
function isAdmin(member) {
  return member.permissions.has('Administrator');
}

/**
 * Check if user is moderator
 * @param {GuildMember} member - Discord guild member
 * @returns {boolean} True if user has moderation permissions
 */
function isModerator(member) {
  return member.permissions.has('ManageMessages') || member.permissions.has('Administrator');
}

/**
 * Validate hex color format
 * @param {string} color - Color string to validate
 * @returns {boolean} True if valid hex color
 */
function isValidHexColor(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Generate random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse time string to milliseconds
 * @param {string} timeString - Time string (e.g., "1h", "30m", "45s")
 * @returns {number} Time in milliseconds
 */
function parseTimeString(timeString) {
  const regex = /^(\d+)([hms])$/i;
  const match = timeString.match(regex);

  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return 0;
  }
}

/**
 * Format time string from milliseconds
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTimeString(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Check if string contains only emojis
 * @param {string} text - Text to check
 * @returns {boolean} True if contains only emojis
 */
function isOnlyEmojis(text) {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  return emojis.length > 0 && emojis.join('').length === text.length;
}

/**
 * Get dominant color from text (for embeds)
 * @param {string} text - Text to analyze
 * @returns {string} Dominant color hex code
 */
function getDominantColor(text) {
  // Simple color detection based on keywords
  const lowerText = text.toLowerCase();

  if (lowerText.includes('error') || lowerText.includes('failed') || lowerText.includes('invalid')) {
    return '#ff0000'; // Red for errors
  } else if (lowerText.includes('success') || lowerText.includes('completed') || lowerText.includes('unlocked')) {
    return '#00ff00'; // Green for success
  } else if (lowerText.includes('warning') || lowerText.includes('spam')) {
    return '#ff6b35'; // Orange for warnings
  } else if (lowerText.includes('info') || lowerText.includes('help')) {
    return '#3498db'; // Blue for info
  } else if (lowerText.includes('game') || lowerText.includes('play')) {
    return '#9b59b6'; // Purple for games
  } else {
    return '#3498db'; // Default blue
  }
}

module.exports = {
  getWeekStart,
  getMonthStart,
  getCurrentTimestamp,
  isAdmin,
  isModerator,
  isValidHexColor,
  randomInt,
  clamp,
  debounce,
  sleep,
  parseTimeString,
  formatTimeString,
  isOnlyEmojis,
  getDominantColor
};
