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
npm install discord.js better-sqlite3
```

3. Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
```

4. Run the bot:
```bash
node src/bot.js
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

- `/rank [user]` - View your rank card or another user's rank
- `/leaderboard` - View the server leaderboard
- `/level` - Check your current level and XP
- `/setxp <user> <amount>` - (Admin) Set a user's XP
- `/resetxp <user>` - (Admin) Reset a user's XP

## Configuration

### XP System

- **XP per message**: 15-25 XP (randomized)
- **Cooldown**: 60 seconds between XP gains
- **Level formula**: `XP needed = 100 * (level ^ 2)`

### Customization

You can modify these values in the source code:
- XP gain range
- Cooldown duration
- Level-up formula
- Level-up notification messages

## Project Structure

```
discord-leveling-bot/
├── src/
│   ├── bot.js          # Node.js implementation
│   └── bot.py          # Python implementation
├── .gitignore
├── LICENSE
└── README.md
```

## How It Works

1. **Message Detection**: Bot listens for messages in all channels it can access
2. **XP Calculation**: Users receive random XP (15-25) per message with a 60s cooldown
3. **Level Progression**: When XP threshold is reached, user levels up
4. **Level-up Notification**: Bot sends a message congratulating the user
5. **Data Persistence**: All user data is stored in a database/JSON file

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
