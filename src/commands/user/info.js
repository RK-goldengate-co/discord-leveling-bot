// User info commands for the Discord Leveling Bot
// Contains commands like rank, level, stats, streak

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createRankCard, createLevelInfo, getUserRank } = require('../../features/leveling/leveling');
const { getUserStreak } = require('../../features/leveling/leveling');
const { getServerSettings } = require('../../features/social/achievements');
const { createProgressBar, formatNumber } = require('../../utils/embeds');

/**
 * Create rank command
 */
function createRankCommand() {
  return new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your rank card or another user\'s rank')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check rank for')
        .setRequired(false));
}

/**
 * Handle rank command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleRankCommand(interaction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const targetMember = interaction.guild.members.cache.get(targetUser.id);

  if (!targetMember) {
    return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
  }

  const userData = getUser(targetUser.id, interaction.guild.id);

  if (!userData) {
    return interaction.reply({
      content: `${targetUser.username} hasn't earned any XP yet!`,
      ephemeral: true
    });
  }

  try {
    // Try to create image rank card
    const rankCardBuffer = await createRankCardImage(userData, targetUser, interaction.guild);

    if (rankCardBuffer) {
      const attachment = new AttachmentBuilder(rankCardBuffer, { name: 'rank-card.png' });
      await interaction.reply({ files: [attachment] });
    } else {
      // Fallback to embed if image creation fails
      const embed = createRankCard(userData, targetUser, interaction.guild);
      await interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error creating rank card image:', error);
    // Fallback to embed if image creation fails
    const embed = createRankCard(userData, targetUser, interaction.guild);
    await interaction.reply({ embeds: [embed] });
  }
}

/**
 * Create level command
 */
function createLevelCommand() {
  return new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your current level and XP');
}

/**
 * Handle level command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleLevelCommand(interaction) {
  const userData = getUser(interaction.user.id, interaction.guild.id);

  if (!userData) {
    return interaction.reply({
      content: "You haven't earned any XP yet! Start chatting to gain XP!",
      ephemeral: true
    });
  }

  const serverSettings = getServerSettings(interaction.guild.id) || {};
  const embed = createLevelInfo(userData, interaction.guild.id);

  if (embed) {
    embed.setColor(serverSettings.embed_color || '#3498db');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: `You are **Level ${userData.level}** with **${userData.xp}/${getXPForLevel(userData.level, interaction.guild.id)} XP**! (${userData.total_messages} total messages)`,
      ephemeral: true
    });
  }
}

/**
 * Create stats command
 */
function createStatsCommand() {
  return new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View detailed user statistics')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check stats for')
        .setRequired(false));
}

/**
 * Handle stats command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleStatsCommand(interaction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const targetMember = interaction.guild.members.cache.get(targetUser.id);

  if (!targetMember) {
    return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
  }

  const userData = getUser(targetUser.id, interaction.guild.id);

  if (!userData) {
    return interaction.reply({
      content: `${targetUser.username} hasn't earned any XP yet!`,
      ephemeral: true
    });
  }

  const xpNeeded = getXPForLevel(userData.level, interaction.guild.id);
  const progress = Math.floor((userData.xp / xpNeeded) * 100);
  const joinDate = new Date(userData.join_date);
  const daysSinceJoin = Math.floor((Date.now() - userData.join_date) / (1000 * 60 * 60 * 24));

  const embed = new EmbedBuilder()
    .setColor('#9b59b6')
    .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
    .setTitle('📈 User Statistics')
    .addFields(
      { name: 'Current Level', value: `${userData.level}`, inline: true },
      { name: 'Current XP', value: `${formatNumber(userData.xp)}/${formatNumber(xpNeeded)}`, inline: true },
      { name: 'Progress', value: `${progress}%`, inline: true },
      { name: 'Total Messages', value: `${formatNumber(userData.total_messages)}`, inline: true },
      { name: 'Server Rank', value: `#${getUserRank(targetUser.id, interaction.guild.id)}`, inline: true },
      { name: 'Member Since', value: `${daysSinceJoin} days ago`, inline: true }
    )
    .setFooter({ text: interaction.guild.name })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

/**
 * Create streak command
 */
function createStreakCommand() {
  return new SlashCommandBuilder()
    .setName('streak')
    .setDescription('View your current chat streak');
}

/**
 * Handle streak command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleStreakCommand(interaction) {
  const streak = getUserStreak(interaction.user.id, interaction.guild.id);

  if (!streak) {
    return interaction.reply({
      content: '🔥 You haven\'t started a streak yet! Send some messages to begin building your streak!',
      ephemeral: true
    });
  }

  const serverSettings = getServerSettings(interaction.guild.id) || {};
  const streakBonus = calculateStreakBonus(streak.streak_count);
  const timeSinceLastMessage = Date.now() - streak.last_streak_time;
  const minutesSinceLastMessage = Math.floor(timeSinceLastMessage / (1000 * 60));

  const embed = new EmbedBuilder()
    .setColor(serverSettings.embed_color || '#ff6b35')
    .setTitle('🔥 Chat Streak')
    .setDescription(`**Current Streak:** ${streak.streak_count} messages\n**Best Streak:** ${streak.best_streak} messages\n**Streak Bonus:** +${streakBonus} XP`)
    .setFooter({ text: `Last message: ${minutesSinceLastMessage} minutes ago • Keep chatting within ${serverSettings.streak_threshold || 2} minutes to maintain your streak!` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  createRankCommand,
  handleRankCommand,
  createLevelCommand,
  handleLevelCommand,
  createStatsCommand,
  handleStatsCommand,
  createStreakCommand,
  handleStreakCommand
};
