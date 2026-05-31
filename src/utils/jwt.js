const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const sessionExpiresIn = process.env.JWT_SESSION_EXPIRES_IN || "10m";
const firstLoginExpiresIn = process.env.JWT_FIRST_LOGIN_EXPIRES_IN || "10m";
const preTwoFactorAuthExpiresIn = process.env.JWT_PRE_TWO_FACTOR_AUTH_EXPIRES_IN || "10m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "1d";

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            houseId: user.houseId,
            privileges: user.privileges || [],
            tokenType: "SESSION",
            sessionId: user.sessionId,
        },
        jwtSecret,
        { expiresIn: sessionExpiresIn },
    );
};

const generateFirstLoginToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            purpose: "FIRST_LOGIN_CHANGE_PASSWORD",
            tokenType: "FIRST_LOGIN",
        },
        jwtSecret,
        { expiresIn: firstLoginExpiresIn },
    );
};

const generatePreTwoFactorAuthToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            tokenType: "preTwoFactorAuth",
        },
        jwtSecret,
        { expiresIn: preTwoFactorAuthExpiresIn },
    );
};

const generateRefreshToken = (user, sessionId) => {
    return jwt.sign(
        {
            id: user.id || user.employeeId,
            tokenType: "REFRESH",
            sessionId,
        },
        jwtSecret,
        { expiresIn: refreshExpiresIn },
    );
};

const decodeToken = (token) => {
    if (!token) {
        return null;
    }
    try {
        return jwt.verify(token, jwtSecret);
    } catch {
        return null;
    }
};

module.exports = {
    generateToken,
    decodeToken,
    generateFirstLoginToken,
    generatePreTwoFactorAuthToken,
    generateRefreshToken,
};
