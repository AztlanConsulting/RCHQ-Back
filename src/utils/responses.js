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
    found: "PROFILE_FOUND",
    notFound: "PROFILE_NOT_FOUND",
  },
  personnel: {
    badRequest: "BAD_REQUEST",
    notFound: "EMPLOYEE_NOT_FOUND",
    found: "EMPLOYEE_DATA_FOUND",
  },
  servidor: {
    internalError: "INTERNAL_SERVER_ERROR",
  },
};

module.exports = responses;
