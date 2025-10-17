// Hangman game implementation for the Discord Leveling Bot
// Handles hangman game logic and state management

const { getDatabase } = require('../../core/database');
const { getRandomHangmanWord, createGame, updateGame, awardGameRewards } = require('./minigames');

const db = getDatabase();

/**
 * Start new hangman game
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID
 * @returns {object} Game data
 */
function startHangmanGame(guildId, channelId, userId) {
  const word = getRandomHangmanWord();
  const gameData = {
    word: word,
    displayWord: '_'.repeat(word.length).split(''),
    guessedLetters: [],
    attempts: 0,
    maxAttempts: 6
  };

  const gameId = createGame(guildId, channelId, userId, 'hangman', gameData);
  gameData.gameId = gameId;

  return gameData;
}

/**
 * Process hangman guess
 * @param {number} gameId - Game ID
 * @param {string} letter - Guessed letter
 * @returns {object} Game result
 */
function processHangmanGuess(gameId, letter) {
  const stmt = db.prepare('SELECT * FROM mini_games WHERE game_id = ?');
  const game = stmt.get(gameId);

  if (!game || game.status !== 'active') {
    return { success: false, error: 'Game not found or not active' };
  }

  const gameData = JSON.parse(game.game_data);
  const upperLetter = letter.toUpperCase();

  // Check if letter was already guessed
  if (gameData.guessedLetters.includes(upperLetter)) {
    return { success: false, error: 'Letter already guessed', gameData };
  }

  // Add letter to guessed letters
  gameData.guessedLetters.push(upperLetter);
  gameData.attempts++;

  let isCorrect = false;
  let gameEnded = false;
  let isWin = false;

  // Check if letter is in word
  if (gameData.word.includes(upperLetter)) {
    // Correct guess - update display
    for (let i = 0; i < gameData.word.length; i++) {
      if (gameData.word[i] === upperLetter) {
        gameData.displayWord[i] = upperLetter;
      }
    }
    isCorrect = true;

    // Check if word is complete
    if (!gameData.displayWord.includes('_')) {
      gameEnded = true;
      isWin = true;

      // Award rewards
      const gameSettings = getGameSettings(game.guild_id) || {};
      const xpReward = Math.floor(gameSettings.xp_reward_base * gameSettings.difficulty_multiplier);
      const coinsReward = Math.floor(gameSettings.coins_reward_base * gameSettings.difficulty_multiplier);

      updateGame(gameId, gameData, 'completed', xpReward, coinsReward, 1);
      awardGameRewards(game.user_id, game.guild_id, xpReward, coinsReward, true);
    } else {
      // Continue game
      updateGame(gameId, gameData, 'active', 0, 0, 0);
    }
  } else {
    // Wrong guess
    isCorrect = false;

    // Check if max attempts reached
    if (gameData.attempts >= gameData.maxAttempts) {
      gameEnded = true;

      // Award participation reward
      const gameSettings = getGameSettings(game.guild_id) || {};
      const coinsReward = Math.floor(gameSettings.coins_reward_base * 0.5); // Half reward for participation

      updateGame(gameId, gameData, 'completed', 0, coinsReward, 0);
      awardGameRewards(game.user_id, game.guild_id, 0, coinsReward, false);
    } else {
      // Continue game
      updateGame(gameId, gameData, 'active', 0, 0, 0);
    }
  }

  return {
    success: true,
    isCorrect,
    gameEnded,
    isWin,
    attempts: gameData.attempts,
    maxAttempts: gameData.maxAttempts,
    displayWord: gameData.displayWord,
    guessedLetters: gameData.guessedLetters,
    word: gameData.word // Only for debugging, remove in production
  };
}

/**
 * Get hangman game hint
 * @param {number} gameId - Game ID
 * @returns {string} Game hint
 */
function getHangmanHint(gameId) {
  const stmt = db.prepare('SELECT game_data FROM mini_games WHERE game_id = ?');
  const game = stmt.get(gameId);

  if (!game) return '';

  const gameData = JSON.parse(game.game_data);
  return `Word: ${gameData.displayWord.join(' ')}\nGuessed: ${gameData.guessedLetters.join(', ') || 'None'}\nAttempts: ${gameData.attempts}/${gameData.maxAttempts}`;
}

module.exports = {
  startHangmanGame,
  processHangmanGuess,
  getHangmanHint
};
