const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/ticketsController');

router.get('/categorias',    auth, c.categorias);
router.get('/',              auth, c.listar);
router.post('/',             auth, c.criar);
router.patch('/:id/status',  auth, c.atualizarStatus);
router.patch('/:id/rating',  auth, c.avaliar);

module.exports = router;
