const express = require('express');
const router = express.Router();
const { getTables, createTable, deleteTable, updateTablePosition } = require('../controllers/tableController');

router.get('/', getTables);
router.post('/', createTable);
router.delete('/:id', deleteTable);
router.put('/:id/position', updateTablePosition);

module.exports = router;