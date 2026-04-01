const User = require('../model/user.model');
const { generateToken } = require('../utils/jwt');
const { canAccess } = require('../middleware/abac');
const { adminPolicy } = require('../policies/user.policies');


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
    const resource = {
        coordinators: User.coordinators || [],
    };

    if (!canAccess(req.user, adminPolicy, resource)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    res.status(200).json({
        username: req.user.name || User.username,
        role: req.user.role || User.role,
        privileges: req.user.privileges || User.privileges
    });
};
