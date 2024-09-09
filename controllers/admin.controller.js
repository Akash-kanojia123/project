exports.login = (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin123') {
        res.redirect('/register');
    }
   
};
