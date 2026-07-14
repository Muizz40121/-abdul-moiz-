const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/conversations', auth, (req, res) => {
  const result = pool.query(
    "SELECT c.*, p.title as product_title, buyer.name as buyer_name, buyer.avatar as buyer_avatar, seller.name as seller_name, seller.avatar as seller_avatar, (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message, (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at, (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count FROM conversations c JOIN users buyer ON c.buyer_id = buyer.id JOIN users seller ON c.seller_id = seller.id JOIN products p ON c.product_id = p.id WHERE c.buyer_id = ? OR c.seller_id = ? ORDER BY last_message_at DESC",
    [req.user.id, req.user.id, req.user.id]);
  res.json({ conversations: result.rows });
});

router.get('/conversations/:id', auth, (req, res) => {
  const conv = pool.query('SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', [req.params.id, req.user.id, req.user.id]);
  if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found.' });
  const messages = pool.query('SELECT m.*, u.name as sender_name, u.avatar as sender_avatar FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC', [req.params.id]);
  res.json({ conversation: conv.rows[0], messages: messages.rows });
});

router.post('/send', auth, (req, res) => {
  const { product_id, receiver_id, message } = req.body;
  if (!product_id || !receiver_id || !message) return res.status(400).json({ error: 'Product ID, receiver, and message are required.' });
  let conv = pool.query('SELECT id FROM conversations WHERE product_id = ? AND ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))', [product_id, req.user.id, receiver_id, receiver_id, req.user.id]);
  let convId;
  if (conv.rows.length === 0) {
    convId = pool.query('INSERT INTO conversations (product_id, buyer_id, seller_id) VALUES (?, ?, ?)', [product_id, req.user.id, receiver_id]).lastInsertRowid;
  } else convId = conv.rows[0].id;
  const msgResult = pool.query('INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)', [convId, req.user.id, message]);
  pool.query("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", [convId]);
  const newMsg = pool.query('SELECT m.*, u.name as sender_name, u.avatar as sender_avatar FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?', [msgResult.lastInsertRowid]).rows[0];
  res.status(201).json({ message: newMsg, conversation_id: convId });
});

router.patch('/read/:conversationId', auth, (req, res) => {
  pool.query('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0', [req.params.conversationId, req.user.id]);
  res.json({ message: 'Messages marked as read.' });
});

module.exports = router;
