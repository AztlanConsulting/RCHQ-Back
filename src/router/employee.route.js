const express = require('express');
const router = express.Router();

const employeeController = require("../controller/employee.controller");

router.get('/add', employeeController.getAdd);

router.get('/:id', employeeController.getById);

router.post('/',employeeController.postAdd);

module.exports = router;