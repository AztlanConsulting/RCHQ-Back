const VACATION_STATUS = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
};

const VACATION_VALUE_STATUS = [
    "pending",
    "approved",
    "rejected",
];

const ACTIVE_VACATION_STATUSES = [
    VACATION_STATUS.PENDING,
    VACATION_STATUS.APPROVED,
];

module.exports = {
    VACATION_STATUS,
    VACATION_VALUE_STATUS,
    ACTIVE_VACATION_STATUSES,
};