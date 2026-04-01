const User = require('../model/user.model');
const speakeasy = require('speakeasy');
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

exports.twoFactorAuth = (req, res) => {
    if(!req.body){
        return res.status(400).json({ message: 'Bad Request' });
    }

    try{
        const {id} = req.body;
        const tempSecret = speakeasy.generateSecret();
        // Store tempSecret in database associated with the userId for later verification
        res.json({
            id: id,
            secret: tempSecret.base32,
            otpauth_url: tempSecret.otpauth_url
        });
    }catch(error){
        console.error("Error in 2FA setup:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }

}

exports.verifyTwoFactorAuth = (req, res) => {
    if(!req.body){
        return res.status(400).json({ message: 'Bad Request' });
    }
    
    const {token, userId} = req.body;

    try{
        const user = User; //get user from database using userId

        //get user's temp secret from database using userId
        const { base32:secret } = user.tempSecret;
        let verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });
        
        if(verified){
            // save secret as permanent for the user in database and delete temp secret
            user.secret = user.tempSecret;
            res.json({verified: true, message: '2FA verification successful'});
        }else{
            res.status(401).json({verified: false, message: 'Invalid 2FA token'});
        }
    }catch(error){
        console.error("Error in 2FA setup:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.validateTwoFactorAuth = (req, res) => {
    if(!req.body){
        return res.status(400).json({ message: 'Bad Request' });
    }
    
    const {token, userId} = req.body;

    try{
        const user = User; //get user from database using userId

        //get user's temp secret from database using userId
        const { base32:secret } = user.secret;
        let tokenValidate = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 // allow a window of 1 time step before and after to account for clock drift
        });
        
        if(tokenValidate){
            res.json({validated: true, message: '2FA verification successful'});
        }else{
            res.status(401).json({validated: false, message: 'Invalid 2FA token'});
        }
    }catch(error){
        console.error("Error in 2FA setup:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
