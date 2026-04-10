const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/usersController');

router.get('/',                  auth, c.listar);
router.post('/',                 auth, c.criar);
router.put('/:id',               auth, c.atualizar);
router.patch('/:id/password',    auth, c.trocarSenha);
router.delete('/:id',            auth, c.excluir);

module.exports = router;
