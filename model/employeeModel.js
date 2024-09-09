const db = require('../db'); // Adjust the path as needed
const bcrypt = require('bcrypt');

const Employee = {
   
    findByUsername: (username, callback) => {
        const query = 'SELECT * FROM employees WHERE username = ?';
        db.query(query, [username], (err, results) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, results[0]); 
            }
        });
    },

    // Method to compare password
    comparePassword: (password, hash, callback) => {
        bcrypt.compare(password, hash, (err, isMatch) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, isMatch);
            }
        });
    },


    create: (employeeData, callback) => {
        const query = 'INSERT INTO employees SET ?';
        db.query(query, employeeData, callback);
    }
};

module.exports = Employee;
