var mysql=require("mysql2");
var con=mysql.createConnection({
    host:"localhost",
    user:"Akashkanojia",
    password:"kumar@123",
    database:"payroll"
});
module.exports=con;