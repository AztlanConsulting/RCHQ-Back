// src/utils/responses.js
/*
    This file contains the response messages for the application. It is used to standardize the responses across the application.
    To use this file, simply import it and use the messages as needed. For example:
    const responses = require("../utils/responses");
    res.json({ message: responses.profile.found });

    If you want to add more responses follow the next format:
    const responses = {
        nameOfTheAreaForYourResponse: {
            nameOfTheResponse: 'RESPONSE_MESSAGE',
        },
    };
*/
const responses = {
  profile: {
    found: 'PROFILE_FOUND',
    notFound: 'PROFILE_NOT_FOUND',
  },
  employee: {
    notFound: "EMPLOYEE_NOT_FOUND",
    alreadyInactive: "EMPLOYEE_ALREADY_INACTIVE",
    deactivated: "EMPLOYEE_DEACTIVATED",
    deactivationFailed: "EMPLOYEE_DEACTIVATION_FAILED",
    deactivatedAndBlacklisted: "EMPLOYEE_DEACTIVATED_AND_BLACKLISTED",
    deactivatedBlacklistFailed: "EMPLOYEE_DEACTIVATED_BLACKLIST_FAILED",
},
};

module.exports = responses;