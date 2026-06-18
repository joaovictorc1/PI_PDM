const { Router } = require('express');
const ctrl       = require('../controllers/orcamentos.controller');

const router = Router();

router.get('/',               ctrl.listar);
router.put('/',               ctrl.upsert);
router.delete('/:categoria',  ctrl.eliminar);

module.exports = router;