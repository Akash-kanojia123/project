const bcrypt = require('bcrypt');
const saltRounds = 10;
const Employee = require('../model/employeeModel');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const otpStorage = require('../globalstorage')
const twilio = require('twilio');
const twilioClient = twilio('AC5517a081d9d883a4d4fd21293750ecf8', '71e3db5081a55b3195c334cde2c3d53a');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kumarakash53758@gmail.com',
        pass: 'jkld msnu qkdk ziix' 
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}


exports.login = [
    body('username').isEmail(),
    body('password').isLength({ min: 6 }),

    (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.json({ message: "Invalid Inputs", errors: result.array() });
        }

        const { username, password } = req.body;

        Employee.findByUsername(username, (err, employee) => {
            if (err) {
                console.error('Error during employee login:', err);
                return res.status(500).send('Database error');
            }

            if (employee) {
                Employee.comparePassword(password, employee.password, (err, isMatch) => {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        return res.status(500).send('Error during password comparison');
                    }

                    if (isMatch) {
                        req.session.employee = employee;

                        const otp = generateOTP();
                        otpStorage[req.session.employee.id] = otp;

                        const mailOptions = {
                            from: 'kumarakash53758@gmail.com',
                            to: req.session.employee.username,
                            subject: 'Your OTP Code',
                            text: `Your OTP code is: ${otp}`
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error('Error sending OTP email:', error);
                                return res.status(500).send('Error sending OTP email');
                            } else {
                                console.log('OTP email sent:', info.response);
                                res.redirect('/otp');
                            }
                        });
                    } else {
                        res.send('Invalid employee credentials');
                    }
                });
            } else {
                res.send('Invalid employee credentials');
            }
        });
    }
];


exports.register = [
    body('username').isEmail(),
    body('password').isLength({ min: 6 }),

    (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ message: "Invalid Inputs", errors: result.array() });
        }

        const employeeData = {
            id: req.body.id,
            username: req.body.username,
            name: req.body.name,
            eid: req.body.eid,
            gender: req.body.gender,
            dob: req.body.dob,
            doj: req.body.doj,
            phone: req.body.phone,
            address: req.body.address,
            department: req.body.department,
            designation: req.body.designation,
            salary_id: req.body.salary_id,
            base_salary: req.body.base_salary,
            hra: req.body.hra,
            da: req.body.da,
            ma: req.body.ma,
            deduction_id: req.body.deduction_id,
            tax_deduction: req.body.tax_deduction,
            leave_deduction: req.body.leave_deduction,
            provident_fund: req.body.provident_fund
        };

        bcrypt.hash(req.body.password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).send('Error hashing password');
            }

            employeeData.password = hashedPassword;

            Employee.create(employeeData, (err, result) => {
                if (err) {
                    console.error('Error saving employee:', err);
                    return res.status(500).send('Database error');
                }

               
                twilioClient.messages.create({
                    body: `Welcome to ABC Company ${employeeData.name}! Your login details are: Your employee ID is ${employeeData.eid} and your password is ${req.body.password}. Please keep this information secure.`,
                    from: '+16467982267',  
                    to: '+918053649814'
                })
                .then(message => {
                    console.log('Registration SMS sent:', message.sid);
                 res.redirect('/employees');
                })
                .catch(error => {
                    console.error('Error sending registration SMS:', error);
                    res.status(500).send('Error sending registration SMS');
                });
            });
        });
    }
];
