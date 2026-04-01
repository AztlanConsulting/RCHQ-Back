export const authorize = (policyfn, resource) => (req, res, next) => {
    const user = req.user;
    if (policyfn(user, resource)) {
        return next();  
    }else {
        return res.status(402).json({ message: 'Access Denied' });
    }
}