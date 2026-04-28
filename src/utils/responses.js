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
  vacation: {
    badDates: 'START_DATE_AFTER_THE_END_DATE',
    withoutDates: 'THE_EMPLOYEE_DOES_NOT_HAVE_ITS_WORKING_DAYS_REGISTERED',
    insufficientDays: 'THERE_ARE_NOT_ENOUGH_REMAINING_DAYS',
    alreadyRequest: 'THERE_IS_ALREADY_A_REQUEST_BETWEEN_THOSE_DAYS',
    requested: 'REQUESTED_CORRECTLY',
    workDaysFound: 'WORK_DAYS_FOUND',
    workDaysNotFound: 'WORK_DAYS_NOT_FOUND'
  },
};

module.exports = responses;