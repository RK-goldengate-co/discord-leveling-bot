// Shop system for the Discord Leveling Bot
// Handles items, purchases, and inventory management

const { getDatabase } = require('../../core/database');
const { addCoins, removeCoins } = require('./economy');

const db = getDatabase();

/**
 * Get shop items for guild
 * @param {string} guildId - Guild ID
 * @returns {Array} Array of shop items
 */
function getShopItems(guildId) {
  const stmt = db.prepare('SELECT * FROM shop_items WHERE guild_id = ? AND is_active = 1 ORDER BY category, price');
  return stmt.all(guildId);
}

/**
 * Get shop item by ID
 * @param {string} guildId - Guild ID
 * @param {string} itemId - Item ID
 * @returns {object|null} Shop item or null if not found
 */
function getShopItem(guildId, itemId) {
  const stmt = db.prepare('SELECT * FROM shop_items WHERE guild_id = ? AND item_id = ? AND is_active = 1');
  return stmt.get(guildId, itemId);
}

/**
 * Add item to user inventory
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} itemId - Item ID
 * @param {number} quantity - Quantity to add
 * @param {number} expiresAt - Expiration timestamp (optional)
 * @param {string} itemData - Additional item data (optional)
 */
function addToInventory(userId, guildId, itemId, quantity = 1, expiresAt = null, itemData = null) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO user_inventory (user_id, guild_id, item_id, quantity, acquired_at, expires_at, item_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id, item_id) DO UPDATE SET
      quantity = quantity + excluded.quantity,
      acquired_at = excluded.acquired_at
  `);

  stmt.run(userId, guildId, itemId, quantity, now, expiresAt, itemData);
}

/**
 * Get user inventory
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {Array} Array of inventory items
 */
function getUserInventory(userId, guildId) {
  const stmt = db.prepare(`
    SELECT ui.*, si.name, si.description, si.category
    FROM user_inventory ui
    JOIN shop_items si ON ui.guild_id = si.guild_id AND ui.item_id = si.item_id
    WHERE ui.user_id = ? AND ui.guild_id = ? AND si.is_active = 1
    ORDER BY si.category, si.name
  `);
  return stmt.all(userId, guildId);
}

/**
 * Purchase item from shop
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} itemId - Item ID to purchase
 * @returns {object} Purchase result
 */
function purchaseItem(userId, guildId, itemId) {
  const item = getShopItem(guildId, itemId);
  if (!item) {
    return { success: false, error: 'Item not found or not available' };
  }

  const economy = getUserEconomy(userId, guildId);
  if (!economy || economy.coins < item.price) {
    return { success: false, error: 'Insufficient coins' };
  }

  // Remove coins
  removeCoins(userId, guildId, item.price, 'purchase');

  // Add to inventory
  const itemData = item.item_data ? JSON.parse(item.item_data) : null;
  addToInventory(userId, guildId, itemId, 1, null, JSON.stringify(itemData));

  return {
    success: true,
    item: item,
    spent: item.price
  };
}

/**
 * Initialize default shop items for new guilds
 * @param {string} guildId - Guild ID
 */
function initializeDefaultShopItems(guildId) {
  const defaultItems = [
    {
      item_id: 'xp_boost_2x',
      name: '2X XP Boost (1 hour)',
      description: 'Double XP gain for 1 hour',
      price: 500,
      category: 'xp_boost',
      item_data: JSON.stringify({ multiplier: 2, duration: 60 * 60 * 1000 })
    },
    {
      item_id: 'xp_boost_3x',
      name: '3X XP Boost (30 min)',
      description: 'Triple XP gain for 30 minutes',
      price: 800,
      category: 'xp_boost',
      item_data: JSON.stringify({ multiplier: 3, duration: 30 * 60 * 1000 })
    },
    {
      item_id: 'custom_title',
      name: 'Custom Title',
      description: 'Set a custom title that appears on your profile',
      price: 1000,
      category: 'cosmetic',
      item_data: JSON.stringify({ type: 'title' })
    },
    {
      item_id: 'lucky_box',
      name: 'Lucky Box',
      description: 'Random item from the shop (mystery!)',
      price: 300,
      category: 'special',
      item_data: JSON.stringify({ type: 'random' })
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO shop_items (guild_id, item_id, name, description, price, category, item_data, is_active, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'SYSTEM', ?)
  `);

  defaultItems.forEach(item => {
    stmt.run(guildId, item.item_id, item.name, item.description, item.price, item.category, item.item_data, Date.now());
  });
}

module.exports = {
  getShopItems,
  getShopItem,
  addToInventory,
  getUserInventory,
  purchaseItem,
  initializeDefaultShopItems
};
