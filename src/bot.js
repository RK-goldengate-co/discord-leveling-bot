// Discord Leveling Bot - Node.js Implementation
// Using discord.js v14+ and SQLite

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('leveling.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_message INTEGER DEFAULT 0
  )
`);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Configuration
const CONFIG = {
  XP_MIN: 15,
  XP_MAX: 25,
  COOLDOWN: 60000, // 60 seconds in milliseconds
  LEVEL_MULTIPLIER: 100
};

// Calculate XP needed for next level
function getXPForLevel(level) {
  return CONFIG.LEVEL_MULTIPLIER * (level ** 2);
}

// Get user from database
function getUser(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?');
  return stmt.get(userId, guildId);
}

// Create or update user
function updateUser(userId, guildId, xp, level, lastMessage) {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, guild_id, xp, level, last_message)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      xp = excluded.xp,
      level = excluded.level,
      last_message = excluded.last_message
  `);
  stmt.run(userId, guildId, xp, level, lastMessage);
}

// Add XP to user
function addXP(message) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  const now = Date.now();
  
  let user = getUser(userId, guildId);
  
  // Check cooldown
  if (user && (now - user.last_message) < CONFIG.COOLDOWN) {
    return;
  }
  
  // Initialize user if doesn't exist
  if (!user) {
    user = { xp: 0, level: 1, last_message: 0 };
  }
  
  // Add random XP
  const xpGain = Math.floor(Math.random() * (CONFIG.XP_MAX - CONFIG.XP_MIN + 1)) + CONFIG.XP_MIN;
  user.xp += xpGain;
  
  // Check for level up
  const xpNeeded = getXPForLevel(user.level);
  if (user.xp >= xpNeeded) {
    user.level++;
    user.xp = user.xp - xpNeeded; // Carry over excess XP
    
    // Send level up message
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 Level Up!')
      .setDescription(`Congratulations ${message.author}! You've reached **Level ${user.level}**!`)
      .addFields(
        { name: 'Current XP', value: `${user.xp}/${getXPForLevel(user.level)}`, inline: true }
      )
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  }
  
  // Update database
  updateUser(userId, guildId, user.xp, user.level, now);
}

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  client.user.setActivity('members level up!', { type: 'WATCHING' });
});

// Message event for XP gain
client.on('messageCreate', async (message) => {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;
  
  // Add XP
  addXP(message);
  
  // Simple commands
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // !rank command
  if (command === 'rank') {
    const targetUser = message.mentions.users.first() || message.author;
    const user = getUser(targetUser.id, message.guild.id);
    
    if (!user) {
      return message.reply(`${targetUser.username} hasn't earned any XP yet!`);
    }
    
    const xpNeeded = getXPForLevel(user.level);
    const progress = Math.floor((user.xp / xpNeeded) * 100);
    
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
      .setTitle('📊 Rank Card')
      .addFields(
        { name: 'Level', value: `${user.level}`, inline: true },
        { name: 'XP', value: `${user.xp}/${xpNeeded}`, inline: true },
        { name: 'Progress', value: `${progress}%`, inline: true }
      )
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
  
  // !leaderboard command
  if (command === 'leaderboard' || command === 'lb') {
    const stmt = db.prepare(`
      SELECT user_id, xp, level 
      FROM users 
      WHERE guild_id = ? 
      ORDER BY level DESC, xp DESC 
      LIMIT 10
    `);
    const topUsers = stmt.all(message.guild.id);
    
    if (topUsers.length === 0) {
      return message.reply('No users on the leaderboard yet!');
    }
    
    let description = '';
    for (let i = 0; i < topUsers.length; i++) {
      const user = await client.users.fetch(topUsers[i].user_id).catch(() => null);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const username = user ? user.username : 'Unknown User';
      description += `${medal} **${username}** - Level ${topUsers[i].level} (${topUsers[i].xp} XP)\n`;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Server Leaderboard')
      .setDescription(description)
      .setFooter({ text: `${message.guild.name}` })
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
  
  // !level command
  if (command === 'level') {
    const user = getUser(message.author.id, message.guild.id);
    
    if (!user) {
      return message.reply("You haven't earned any XP yet! Start chatting to gain XP!");
    }
    
    const xpNeeded = getXPForLevel(user.level);
    message.reply(`You are **Level ${user.level}** with **${user.xp}/${xpNeeded} XP**!`);
  }
});

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(process.env.DISCORD_TOKEN);
