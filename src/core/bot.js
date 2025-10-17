// Main bot file for the Discord Leveling Bot
// This is the entry point that initializes all systems and starts the bot

require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { initializeDatabase } = require('./database');
const CONFIG = require('./config');

// Import features
const { handleMessageCreate } = require('../events/messageCreate');
const { createRankCommand, handleRankCommand } = require('../commands/user/info');
const { createLevelCommand, handleLevelCommand } = require('../commands/user/info');
const { createStatsCommand, handleStatsCommand } = require('../commands/user/info');
const { createStreakCommand, handleStreakCommand } = require('../commands/user/info');

// Initialize database
const db = initializeDatabase();

// Create Discord client with all necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Command collection
const commands = [
  createRankCommand(),
  createLevelCommand(),
  createStatsCommand(),
  createStreakCommand()
  // More commands will be added here as we implement them
];

// Bot ready event
client.once('ready', async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);

  // Register slash commands
  const rest = new REST().setToken(CONFIG.BOT_TOKEN);

  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }

  client.user.setActivity('members level up! Use /help for commands', { type: 'WATCHING' });
});

// Event handlers
client.on('messageCreate', handleMessageCreate);

// Slash command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'rank':
        await handleRankCommand(interaction);
        break;
      case 'level':
        await handleLevelCommand(interaction);
        break;
      case 'stats':
        await handleStatsCommand(interaction);
        break;
      case 'streak':
        await handleStreakCommand(interaction);
        break;
      // More command handlers will be added here
    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    await interaction.reply({
      content: '❌ There was an error while processing this command!',
      ephemeral: true
    });
  }
});

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

// Login
client.login(CONFIG.BOT_TOKEN);
