const { Router } = require('express');
const ctrl       = require('../controllers/metas.controller');

const router = Router();

router.get('/',    ctrl.listar);
router.post('/',   ctrl.criar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;