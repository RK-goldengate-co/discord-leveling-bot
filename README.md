# Discord Leveling Bot

A feature-rich Discord bot that implements an XP and leveling system with automatic rank progression, leaderboards, and member engagement tracking.

## Features

- 🎯 **Automatic XP System**: Members earn XP for sending messages
- 📊 **Level Progression**: Customizable level-up formula and notifications
- 🏆 **Leaderboard**: View top-ranked members in your server
- 💳 **Rank Cards**: Beautiful rank cards showing user stats
- ⚙️ **Customizable**: Configure XP rates, level requirements, and more
- 💾 **Persistent Storage**: User data saved in SQLite/JSON database

## Available Implementations

This repository includes two implementations:

### Node.js (discord.js)
- Located in `src/bot.js`
- Uses discord.js v14+
- SQLite database for data persistence

### Python (discord.py)
- Located in `src/bot.py`
- Uses discord.py v2.0+
- JSON file for data persistence

## Setup Instructions

### Prerequisites

**For Node.js version:**
- Node.js 16.9.0 or higher
- npm or yarn

**For Python version:**
- Python 3.8 or higher
- pip

### Installation

#### Node.js Setup

1. Clone the repository:
```bash
git clone https://github.com/RK-goldengate-co/discord-leveling-bot.git
cd discord-leveling-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
```

4. Run the bot:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

#### Python Setup

1. Clone the repository:
```bash
git clone https://github.com/RK-goldengate-co/discord-leveling-bot.git
cd discord-leveling-bot
```

2. Install dependencies:
```bash
pip install discord.py python-dotenv
```

3. Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
```

4. Run the bot:
```bash
python src/bot.py
```

### Getting a Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Click "Reset Token" to get your bot token
5. Enable the following Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent
6. Go to OAuth2 → URL Generator
7. Select scopes: `bot`, `applications.commands`
8. Select permissions: `Send Messages`, `Read Message History`, `Embed Links`
9. Copy the generated URL and invite the bot to your server

## Commands

### Slash Commands (Recommended)
- `/rank [user]` - View your rank card or another user's rank
- `/leaderboard` - View the server leaderboard (all-time)
- `/weeklylb` - View the weekly leaderboard (current week)
- `/monthlylb` - View the monthly leaderboard (current month)
- `/level` - Check your current level and XP
- `/setxp <user> <amount>` - (Admin) Set a user's XP
- `/resetxp <user>` - (Admin) Reset a user's XP
- `/stats [user]` - View detailed user statistics
- `/streak` - View your current chat streak and bonus
- `/daily` - Claim your daily coin reward
- `/balance` - Check your coin balance
- `/shop` - Browse the shop items
- `/buy <item>` - Purchase an item from the shop
- `/inventory` - View your inventory
- `/achievements` - View your unlocked achievements
- `/voice` - Check your voice activity statistics
- `/voice-settings` - (Admin) Configure voice XP settings
- `/trivia` - Play a trivia game with questions
- `/hangman` - Play hangman word guessing game
- `/rps <choice>` - Play Rock Paper Scissors
- `/coinflip <side> <amount>` - Flip a coin and bet coins
- `/server-settings` - (Admin) Configure server-specific settings (XP ranges, formulas, colors)
- `/channel-multiplier` - (Admin) Set XP/coins multiplier for a channel
- `/role-multiplier` - (Admin) Set XP/coins multiplier for a role
- `/set-title <title>` - Set your custom title with color
- `/spam-settings` - (Admin) Configure spam detection settings
- `/addrolereward <level> <role>` - (Admin) Add a role reward for reaching a specific level
- `/removerolereward <level>` - (Admin) Remove a role reward for a specific level
- `/listrolerewards` - View all role rewards in the server
- `/backup` - (Admin) Create a manual database backup
- `/dbstats` - View database statistics and health

### Legacy Prefix Commands (Deprecated)
- `!rank [user]` - View your rank card or another user's rank
- `!leaderboard` - View the server leaderboard
- `!level` - Check your current level and XP

## Configuration

### XP System

- **Base XP per message**: 15-25 XP (randomized)
- **Streak Bonus**: Additional XP for consecutive messages within 2 minutes
  - Streak bonus = streak_length × 2 (max 100 XP at streak 50)
  - Reset streak if >2 minutes between messages
- **Cooldown**: 60 seconds between XP gains (applies to base XP only)
- **Level formula**: `XP needed = 100 × (level²)`

### Advanced Features

- **User Statistics**: Track total messages, join date, and server rank
- **Admin Controls**: Set/reset user XP with permission checks
- **Multiple Leaderboards**: All-time, weekly, and monthly leaderboards with detailed stats
- **Beautiful Rank Cards**: Stunning visual rank cards with progress bars and user avatars
- **Role Rewards System**: Automatically assign roles when users reach specific levels
- **Streak Bonus System**: Earn bonus XP for consecutive messages within 2 minutes
- **Economy & Shop System**: Earn coins through daily rewards and level-ups, purchase items
- **Inventory Management**: Track purchased items and their effects
- **Achievement System**: Auto-unlock achievements with rewards for milestones
- **Voice Channel Integration**: Earn XP for voice activity with configurable settings
- **Anti-Cheat & Spam Detection**: Detect spam messages, duplicate text, excessive caps/emojis with XP penalties
- **Mini-Games System**: Interactive games (Trivia, Hangman, RPS, Coin Flip) with XP/coin rewards
- **Advanced Customization**: Custom level formulas, XP multipliers per channel/role, server-specific settings
- **Custom User Titles**: Users can set custom titles with colors that appear on rank cards
- **Automatic Backup System**: Daily automatic backups with 7-day retention
- **Database Health Monitoring**: Integrity checks and statistics tracking
- **Automatic Slash Command Registration**: Commands are registered automatically on bot startup

## Project Structure

```
discord-leveling-bot/
├── src/
│   ├── core/
│   │   ├── bot.js          # Main bot entry point
│   │   ├── config.js       # Configuration settings
│   │   └── database.js     # Database setup and management
│   ├── features/
│   │   ├── economy/
│   │   │   ├── economy.js  # Coin system and daily rewards
│   │   │   └── shop.js     # Shop and inventory management
│   │   ├── games/
│   │   │   ├── trivia.js   # Trivia game implementation
│   │   │   ├── hangman.js  # Hangman game implementation
│   │   │   └── minigames.js # Mini-games system
│   │   ├── leveling/
│   │   │   ├── leveling.js # XP calculation and level progression
│   │   │   └── streaks.js  # Streak bonus system
│   │   ├── moderation/
│   │   │   ├── spam.js     # Spam detection and penalties
│   │   │   └── anticheat.js # Anti-cheat measures
│   │   └── social/
│   │       ├── achievements.js # Achievement system
│   │       └── roles.js    # Role rewards and management
│   ├── events/
│   │   ├── messageCreate.js # Message event handler
│   │   ├── voiceStateUpdate.js # Voice activity handler
│   │   └── interactionCreate.js # Slash command handler
│   ├── utils/
│   │   ├── embeds.js       # Embed creation utilities
│   │   ├── helpers.js      # Common helper functions
│   │   └── permissions.js  # Permission checking utilities
│   └── commands/
│       ├── admin/
│       │   ├── backup.js   # Database backup commands
│       │   ├── settings.js # Server configuration commands
│       │   └── multipliers.js # Multiplier management commands
│       └── user/
│           ├── games.js     # User game commands
│           ├── economy.js   # User economy commands
│           └── info.js      # User information commands
├── backups/            # Automatic database backups (created daily)
├── .env.example        # Environment variables template
├── .gitignore
├── LICENSE
└── README.md
```

## How It Works

1. **Message Detection**: Bot listens for messages in all channels it can access
2. **Spam Detection**: Messages are analyzed for spam patterns (duplicates, excessive caps, emojis)
3. **Voice Activity Tracking**: Bot tracks voice channel sessions and speaking time
4. **XP Calculation**: Users receive random XP (15-25) per message with a 60s cooldown
5. **Spam Penalties**: Suspicious messages receive reduced XP rewards
6. **Voice XP Rewards**: Users earn XP for time spent in voice channels (configurable rate)
7. **Streak Bonus**: Consecutive messages within 2 minutes earn bonus XP (streak × 2, max 100)
8. **Level Progression**: When XP threshold is reached, user levels up
9. **Level-up Notification**: Bot sends a message congratulating the user
10. **Role Rewards**: Users automatically receive roles when reaching specific levels
11. **Economy System**: Users earn coins from daily rewards and level-ups
12. **Shop System**: Users can purchase items using coins (XP boosts, cosmetics, etc.)
13. **Achievement System**: Auto-unlock achievements with rewards for various milestones
14. **Mini-Games**: Interactive games provide additional XP and coin earning opportunities
15. **Data Persistence**: All user data is stored in SQLite with automatic daily backups
16. **Time-based Stats**: Weekly and monthly leaderboards are calculated and stored separately

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions

## Acknowledgments

- Built with [discord.js](https://discord.js.org/) and [discord.py](https://discordpy.readthedocs.io/)
- Inspired by various Discord leveling bots in the community

---

**Note**: Remember to keep your bot token secure and never commit it to version control!
