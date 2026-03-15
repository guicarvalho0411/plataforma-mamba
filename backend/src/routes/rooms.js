const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/roomsController');

router.get('/',                  auth, c.listarSalas);
router.get('/bookings',          auth, c.listarReservas);
router.post('/bookings',         auth, c.criarReserva);
router.patch('/bookings/:id/status', auth, c.atualizarStatus);

module.exports = router;
