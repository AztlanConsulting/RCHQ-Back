const User = require('../model/user.model');
const { generateToken } = require('../utils/jwt');

exports.loginFunction = (req, res) => {
    const { username, password } = req.body;
    console.log("Login attempt:", username, password);

    const user = User;

    if (user && username === user.username && password === user.password) {
        res.status(200).json({ message: 'Login successful' , token: generateToken(user)});
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
    
}

exports.getProfile = (req, res) => {
    res.status(200).json({
        username: req.user.name || User.username,
        role: req.user.role || User.role,
        privileges: req.user.privileges || User.privileges
    });
}
