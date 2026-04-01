import User from '../model/user.model';
import bcrypt from 'bcrypt';

export const loginFunction = (req, res) => {
    const { username, password } = req.body;

    if (username === User.username && password === User.password) {
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
    
}

export const getProfile = (req, res) => {
    res.status(200).json({
        username: User.username,
        role: User.role,
        privileges: User.privileges
    });
}