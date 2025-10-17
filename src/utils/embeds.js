// Utility functions for creating embeds and formatting messages
// This file centralizes all embed creation logic for consistency

const { EmbedBuilder } = require('discord.js');

/**
 * Create a standard embed with bot branding
 * @param {string} color - Hex color code
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} Configured embed
 */
function createEmbed(color, title, description) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a success embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} Success embed
 */
function createSuccessEmbed(title, description) {
  return createEmbed('#00ff00', `✅ ${title}`, description);
}

/**
 * Create an error embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} Error embed
 */
function createErrorEmbed(title, description) {
  return createEmbed('#ff0000', `❌ ${title}`, description);
}

/**
 * Create a warning embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} Warning embed
 */
function createWarningEmbed(title, description) {
  return createEmbed('#ff6b35', `⚠️ ${title}`, description);
}

/**
 * Create an info embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} Info embed
 */
function createInfoEmbed(title, description) {
  return createEmbed('#3498db', `ℹ️ ${title}`, description);
}

/**
 * Format user mention for embeds
 * @param {User} user - Discord user object
 * @returns {string} Formatted mention
 */
function formatUserMention(user) {
  return `<@${user.id}>`;
}

/**
 * Format role mention for embeds
 * @param {Role} role - Discord role object
 * @returns {string} Formatted mention
 */
function formatRoleMention(role) {
  return `<@&${role.id}>`;
}

/**
 * Format channel mention for embeds
 * @param {Channel} channel - Discord channel object
 * @returns {string} Formatted mention
 */
function formatChannelMention(channel) {
  return `<#${channel.id}>`;
}

/**
 * Format number with commas for better readability
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
  return number.toLocaleString();
}

/**
 * Format time duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format percentage for display
 * @param {number} value - Value between 0-1
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Create a progress bar for embeds
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {number} length - Length of progress bar
 * @param {string} filled - Character for filled portion
 * @param {string} empty - Character for empty portion
 * @returns {string} Progress bar string
 */
function createProgressBar(current, max, length = 10, filled = '█', empty = '░') {
  const progress = Math.min(current / max, 1);
  const filledLength = Math.round(progress * length);
  const emptyLength = length - filledLength;

  return filled.repeat(filledLength) + empty.repeat(emptyLength);
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, length = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length - 3) + '...';
}

/**
 * Format XP needed for next level
 * @param {number} currentXP - Current XP
 * @param {number} xpNeeded - XP needed for next level
 * @returns {string} Formatted XP string
 */
function formatXPProgress(currentXP, xpNeeded) {
  return `${formatNumber(currentXP)}/${formatNumber(xpNeeded)} XP`;
}

/**
 * Format level display
 * @param {number} level - Current level
 * @param {number} currentXP - Current XP
 * @param {number} xpNeeded - XP needed for next level
 * @returns {string} Formatted level string
 */
function formatLevelDisplay(level, currentXP, xpNeeded) {
  const progress = currentXP / xpNeeded;
  const progressBar = createProgressBar(progress, 1, 10);
  return `Level ${level} • ${formatXPProgress(currentXP, xpNeeded)}\n${progressBar} ${formatPercentage(progress)}`;
}

module.exports = {
  createEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed,
  formatUserMention,
  formatRoleMention,
  formatChannelMention,
  formatNumber,
  formatDuration,
  formatPercentage,
  createProgressBar,
  truncateText,
  formatXPProgress,
  formatLevelDisplay
};
