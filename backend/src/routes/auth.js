const router = require('express').Router();
const { login, register } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.post('/register', auth, register); // só usuários logados (admin) criam outros usuários

module.exports = router;
