const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/schedulesController');

router.get('/hoje',     auth, c.hoje);
router.get('/cleaners', auth, c.colaboradoras);
router.get('/',         auth, c.listar);
router.post('/',        auth, c.criar);
router.delete('/:id',   auth, c.remover);

module.exports = router;
