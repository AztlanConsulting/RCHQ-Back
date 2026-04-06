const canAccess = (user, policyFn, resource) => {
  if (!user) return false;
  return policyFn(user, resource);
};

const authorize = (policyFn, resource) => (req, res, next) => {
  if (canAccess(req.user, policyFn, resource)) {
    return next();
  }

  return res.status(403).json({ message: 'Access Denied' });
};

module.exports = {
  authorize,
  canAccess,
};
