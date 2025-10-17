// Trivia game implementation for the Discord Leveling Bot
// Handles trivia game logic and state management

const { getDatabase } = require('../../core/database');
const { getRandomTriviaQuestion, createGame, updateGame, awardGameRewards } = require('./minigames');

const db = getDatabase();

/**
 * Start new trivia game
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID
 * @returns {object} Game data
 */
function startTriviaGame(guildId, channelId, userId) {
  const question = getRandomTriviaQuestion();
  const gameData = {
    question: question.question,
    options: question.options,
    answer: question.answer,
    category: question.category,
    difficulty: question.difficulty,
    attempts: 0,
    maxAttempts: 3
  };

  const gameId = createGame(guildId, channelId, userId, 'trivia', gameData);
  gameData.gameId = gameId;

  return gameData;
}

/**
 * Process trivia answer
 * @param {number} gameId - Game ID
 * @param {number} answer - User's answer (1-4)
 * @returns {object} Game result
 */
function processTriviaAnswer(gameId, answer) {
  const stmt = db.prepare('SELECT * FROM mini_games WHERE game_id = ?');
  const game = stmt.get(gameId);

  if (!game || game.status !== 'active') {
    return { success: false, error: 'Game not found or not active' };
  }

  const gameData = JSON.parse(game.game_data);
  gameData.attempts++;

  let isCorrect = false;
  let gameEnded = false;

  if (answer === gameData.answer) {
    // Correct answer
    isCorrect = true;
    gameEnded = true;

    // Award rewards
    const gameSettings = getGameSettings(game.guild_id) || {};
    const xpReward = Math.floor(gameSettings.xp_reward_base * gameSettings.difficulty_multiplier);
    const coinsReward = Math.floor(gameSettings.coins_reward_base * gameSettings.difficulty_multiplier);

    updateGame(gameId, gameData, 'completed', xpReward, coinsReward, 1);
    awardGameRewards(game.user_id, game.guild_id, xpReward, coinsReward, true);
  } else if (gameData.attempts >= gameData.maxAttempts) {
    // Max attempts reached
    gameEnded = true;
    updateGame(gameId, gameData, 'completed', 0, 0, 0);
  } else {
    // Wrong answer, continue game
    updateGame(gameId, gameData, 'active', 0, 0, 0);
  }

  return {
    success: true,
    isCorrect,
    attempts: gameData.attempts,
    maxAttempts: gameData.maxAttempts,
    gameEnded,
    correctAnswer: gameData.answer,
    category: gameData.category,
    difficulty: gameData.difficulty
  };
}

module.exports = {
  startTriviaGame,
  processTriviaAnswer
};
