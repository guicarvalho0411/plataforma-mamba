const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/stockController');

router.get('/',              auth, c.listar);
router.post('/',             auth, c.criar);
router.put('/:id',           auth, c.atualizar);
router.patch('/:id/baixa',   auth, c.darBaixa);
router.delete('/:id',        auth, c.remover);

module.exports = router;
