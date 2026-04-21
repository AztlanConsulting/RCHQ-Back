const getClientIp = (req) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";
  return ip.split(",")[0].trim();
};

module.exports = {
  getClientIp,
};
