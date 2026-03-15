const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/clientMeetingsController');

router.get('/',      auth, c.listar);
router.post('/',     auth, c.criar);
router.put('/:id',   auth, c.atualizar);
router.delete('/:id',auth, c.remover);

module.exports = router;
