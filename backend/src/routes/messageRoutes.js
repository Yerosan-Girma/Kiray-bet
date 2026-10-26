const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/conversations', protect, messageController.getConversations);
router.post('/conversations', protect, messageController.ensureConversation);
router.get('/:partnerId', protect, messageController.getMessages);
router.post('/:partnerId', protect, messageController.sendMessage);

module.exports = router;
