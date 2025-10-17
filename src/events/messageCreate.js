// Message event handler for the Discord Leveling Bot
// Handles XP awarding, spam detection, and streak tracking

const { Events } = require('discord.js');
const { addXP } = require('../leveling/leveling');
const { handleSpamDetection } = require('../moderation/spam');
const { getUserStreak, updateUserStreak } = require('../leveling/leveling');

/**
 * Handle messageCreate event
 * @param {Message} message - Discord message object
 */
async function handleMessageCreate(message) {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;

  try {
    // Award XP for the message
    const leveledUp = addXP(message);

    // Handle level up notifications are already handled in addXP function

  } catch (error) {
    console.error('Error handling message create:', error);
  }
}

module.exports = {
  name: Events.MessageCreate,
  execute: handleMessageCreate
};
