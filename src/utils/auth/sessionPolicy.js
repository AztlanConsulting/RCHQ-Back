const DEFAULT_LOGIN_LOCK_DURATION = "10m";
const DEFAULT_REFRESH_DURATION = "1d";

function parseDurationMs(value, fallback) {
    const duration = String(value || fallback).trim();
    const match = duration.match(/^(\d+)\s*([smhd])$/i);

    if (!match) {
        return parseDurationMs(fallback, DEFAULT_LOGIN_LOCK_DURATION);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
}

function getLoginLockMs() {
    return parseDurationMs(
        process.env.SESSION_LOGIN_LOCK_EXPIRES_IN ||
            process.env.JWT_SESSION_EXPIRES_IN,
        DEFAULT_LOGIN_LOCK_DURATION,
    );
}

function getRefreshSessionMs() {
    return parseDurationMs(
        process.env.JWT_REFRESH_EXPIRES_IN,
        DEFAULT_REFRESH_DURATION,
    );
}

function buildSessionTimestamps(now = new Date()) {
    const nowMs = now.getTime();

    return {
        lastActivityAt: now,
        blocksLoginUntil: new Date(nowMs + getLoginLockMs()),
        expiresAt: new Date(nowMs + getRefreshSessionMs()),
    };
}

function isSessionBlockingLogin(session, now = new Date()) {
    return Boolean(
        session?.isActive &&
            !session.revokedAt &&
            session.expiresAt > now &&
            session.blocksLoginUntil > now,
    );
}

function isSessionRenewable(session, now = new Date()) {
    return Boolean(
        session?.isActive &&
            !session.revokedAt &&
            session.expiresAt > now,
    );
}

module.exports = {
    buildSessionTimestamps,
    getLoginLockMs,
    getRefreshSessionMs,
    isSessionBlockingLogin,
    isSessionRenewable,
    parseDurationMs,
};
