const express = require('express');
const PDFDocument = require('pdfkit');
const bodyparser = require('body-parser');

const nodemailer = require('nodemailer');
const session = require('express-session');
const db = require('./db');
const flash = require('connect-flash');

const { body, validationResult } = require('express-validator');
const userRoutes = require('./routes/admin.route.js');
const employeeRoutes = require('./routes/employee.route.js')
const { totalmem } = require('os');
const otpStorage=require('./globalstorage.js')

const app = express();
const port = 3000;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kumarakash53758@gmail.com',
        pass: 'jkld msnu qkdk ziix' 
    }
});
app.set('view engine', 'ejs');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public'));  


app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.use('/admin',userRoutes);
app.use('/', employeeRoutes);
app.get('/forgot-password', (req, res) => {
    res.render('email', );
});
app.post('/send-otp', (req, res) => {
    const email = req.body.email;


    storedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  
    const mailOptions = {
        from: 'kummarakash53758@gmail.com',
        to: 'kumarakash53758@gmail.com',
        subject: 'Your OTP for Password Reset',
        text: `Your OTP for password reset is: ${storedOtp}`
    };

   
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.render('email', { error: 'Failed to send OTP. Please try again.' });
        } else
         {
            console.log('Email sent:', info.response);
            res.render('otp-verification');  
         }
    });
})
app.get('/', (req, res) => {
    res.render('login2'); 
});

app.post('/verify-otp', (req, res) => {
    const otp = req.body.otp;

   
    if (otp === storedOtp) {
        
        res.redirect('/reset-password');
    } else {

        res.render('otp-verification', { error: 'Invalid OTP. Please try again.' });
    }
});
app.get('/reset-password',(req,res)=>{
    res.render('reset-password');
})

app.post('/reset-password', (req, res) => {
    const { password, confirmpassword, email } = req.body;
 
    if (password !=confirmpassword) {
        console.log('Passwords do not match.');
        
        return res.redirect('/reset-password'); 
    }


    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            req.flash('message', 'An error occurred. Please try again.');
            return res.redirect('/reset-password'); 

        }
        const query = `UPDATE employees SET password = ? WHERE username = ?`;

        db.query(query, [hashedPassword, email], (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
              
                return res.redirect('/reset-password');
            }

      
            console.log("Password updated successfully");
            

           
            setTimeout(() => {
                res.redirect('/');
            }, 1000);
        });
});
});

app.get('/generate-pdf/:eid', (req, res) => {
    const { eid } = req.params;

    const query = `
        SELECT e.eid, e.name, e.base_salary, e.hra, e.da, e.ma, e.tax_deduction, e.provident_fund, a.number_of_leaves 
        FROM employees e 
        JOIN attendance a ON e.eid = a.eid 
        WHERE e.eid = ?`;
    
    db.query(query, [eid], (err, results) => {
        if (err) {
            console.error('Error fetching employee:', err);
            res.status(500).send('Database error');
            return;
        }

        if (results.length > 0) {
            const employee = results[0];

            const baseSalary = Number(employee.base_salary) || 0;
            const hra = Number(employee.hra) || 0;
            const da = Number(employee.da) || 0;
            const ma = Number(employee.ma) || 0;
            const pf = Number(employee.provident_fund) || 0;
            const td = Number(employee.tax_deduction) || 0;
            const numberOfLeaves = Number(employee.number_of_leaves) || 0;
            const leaveDeduction = numberOfLeaves * 700; 
            const totalSalary = baseSalary + hra + da + ma - (pf + td + leaveDeduction);
            const doc = new PDFDocument();

            res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${employee.eid}.pdf`);
            res.setHeader('Content-Type', 'application/pdf');

            doc.pipe(res);

            const titleStartX = 200;
            const titleStartY = 50;
            const titleWidth = 200;
            const titleHeight = 30;
            doc.fontSize(10).text('Salary Slip', titleStartX + 20, titleStartY + 5);
            doc.rect(titleStartX, titleStartY, titleWidth, titleHeight).stroke(); 

            doc.moveDown(2); 
            const startX = 50;
            const startY = doc.y;
            const contentWidth = 500;
            const lineHeight = 20; 

            doc.rect(startX, startY, contentWidth, 260).stroke(); 

            const details = [
                `Employee ID: ${employee.eid}`,
                `Name: ${employee.name}`,
                `Base Salary: ${employee.base_salary}`,
                `HRA: ${employee.hra}`,
                `DA: ${employee.da}`,
                `MA: ${employee.ma}`,
                `Salary Deductions`,
                `Provident Fund: ${employee.provident_fund}`,
                `Tax Deduction: ${employee.tax_deduction}`,
                `Leave Deduction (${numberOfLeaves} leaves * 700): ${leaveDeduction}`, 
                `Total Salary: ${totalSalary}`
            ];

            details.forEach((text, index) => {
                const textY = startY + index * lineHeight + 2;
                doc.text(text, startX + 10, textY);
                doc.moveTo(startX, textY + lineHeight - 3) 
                   .lineTo(startX + contentWidth, textY + lineHeight - 3) 
                   .stroke(); 
            });

            doc.moveDown(2);
            doc.fontSize(12).text('Thank you for your service!', { align: 'center' });

            doc.end();
        } else {
            res.status(404).send('Employee not found');
        }
    });
});

app.get('/otp', (req, res) => {
    //if (req.session.employee) {
        res.render('otp'); 
   // } else {
        //res.redirect('/');
  //  }
});

app.post('/employee/verify-otp', function(req, res) {
    const  otp  = req.body.otp;
    const employee = req.session.employee;
    console.log("hello")
   console.log(otp);
    if (!employee) {
        return res.status(400).send('No employee session found. Please log in again.');
    }

    const storedOtp = otpStorage[employee.id];
console.log(storedOtp);
    if ( storedOtp ==otp) {
       
        delete otpStorage[employee.id]; 
 
        res.redirect('/employee_dashboard');
    } else {
        
        res.redirect('/otp?error=invalid'); 
    }
});

app.get('/register', function(req, res) {
    res.render('register');
});


const bcrypt = require('bcrypt');
const { message } = require('statuses');
const con = require('./db');
const saltRounds = 10; 



app.get('/employees', function(req, res) {
    const query = 'SELECT id, name, department, designation FROM employees';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.render('employees', { employees: results });
        }
    });
});


app.get('/employees/:id/view', function(req, res) {
    const id = req.params.id;
    const query = 'SELECT * FROM employees WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.json(results[0]);
        }
    });
});

app.get('/employees/:id/delete', function(req, res) {
    const id = req.params.id;
    const query = 'DELETE FROM employees WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.redirect('/employees');
        }
    });
});


app.get('/add_transactions', (req, res) => {
    res.render('add_transactions');
});


app.post('/transactions', (req, res) => {
    const { transactionId, employeeId, month } = req.body;
    console.log({ transactionId, employeeId, month });
    const query = 'INSERT INTO transactions (tid, eid, month) VALUES (?, ?, ?)';
    db.query(query, [transactionId, employeeId, month], (err, results) => {
        if (err) { console.error('Database error:', err);
            return res.status(500).send('Error adding transaction');
        }
        res.redirect('/history');
    });
});


app.get('/history', (req, res) => {
    const query = `
        SELECT t.tid, e.name, t.month, e.base_salary AS amount
        FROM transactions t
        JOIN employees e ON t.eid = e.eid
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching transaction history');
        }
        res.render('history', { transactions: results });
    });
});


app.get('/attendance', (req, res) => {
    res.render('attendance');
});

app.post('/attendance', (req, res) => {
    const { employeeId, numberOfLeaves, month } = req.body;
    const query = 'INSERT INTO attendance (eid, number_of_leaves, month) VALUES (?, ?, ?)';
    db.query(query, [employeeId, numberOfLeaves, month], (err, result) => {
        if (err) {
            console.error('Error adding attendance:', err);
            return res.status(500).send('Error adding attendance');
        }
        res.redirect('/attendance');
    });
});


app.get('/employee_dashboard', (req, res) => {
    const employee = req.session.employee;
    if (employee) {
      
        res.render('employee_dashboard', { employee});
    } else {
        res.redirect('/'); 
    }
});



 
app.get('/employee/home', function(req, res) {
    const employee = req.session.employee; 

    console.log(employee)
    
          if (!employee) {
            console.log('Error fetching employee data:');
            res.status(500).send('Server Error');
        } else {
            
                res.render('home', {  employee });
            
            }
        
    });





app.get('/employee/salary', (req, res) => {
    const employee = req.session.employee;
  console.log("salary")
  console.log(employee)
    if (!employee) {
    
                res.redirect('/')
              
            } else {
                const totalSalary = parseFloat(employee.base_salary)+parseFloat(  employee.da )+parseFloat(employee.ma)+parseFloat(employee.hra);
                const deductionamount=totalSalary-(parseFloat(employee.tax_deduction)+parseFloat(employee.provident_fund));
                 console.log(deductionamount)
                res.render('employee_salary', { employee,totalSalary,deductionamount });
            }
       
});


app.get('/employee/payment-history', (req, res) => {
    const employee = req.session.employee;
  console.log("deduction");
  console.log(employee);
    if (employee) {
        const query = 'SELECT t.tid,t.eid, t.month, e.base_salary+e.hra+e.da+e.ma AS amount FROM transactions t JOIN employees e ON t.eid = e.eid WHERE t.eid = ?';
        db.query(query, [employee.eid], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Database error');
            } else {
                console.log(results)
                res.render('payment-history', {  results });
            }
        });
    } else {
        res.redirect('/');
    }
});

app.get('/signout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during signout:', err);
            res.status(500).send('Error signing out');
        } else {
            res.redirect('/');
        }
    });
});
app.get('/employee/logout',(req,res)=>{
    req.session.destroy(err=>{
        res.redirect("/");
    })
})


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
