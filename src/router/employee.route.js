const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");

const employeeController = require("../controller/employee.controller");

router.get('/add', verifyToken, employeeController.getAdd);

router.get('/:id', employeeController.getById);

router.post('/', verifyToken, employeeController.postAdd);

module.exports = router;