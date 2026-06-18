const { Router } = require('express');
const ctrl       = require('../controllers/transacoes.controller');

const router = Router();

router.get('/',                  ctrl.listar);
router.post('/',                 ctrl.criar);
router.delete('/grupo/:grupoId', ctrl.eliminarGrupo); // ← ANTES de /:id para não colidir
router.put('/:id',               ctrl.atualizar);
router.delete('/:id',            ctrl.eliminar);

module.exports = router;