const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');


router.post('/employee/login', employeeController.login);
router.post('/register', employeeController.register);
module.exports = router;
