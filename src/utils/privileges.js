const PRIVILEGES = Object.freeze({
    VIEW_EMPLOYEES: "viewEmployees",
    CREATE_EMPLOYEES: "createEmployees",
    MANAGE_EMPLOYEES: "manageEmployees",
    VIEW_DOCUMENTS: "viewDocuments",
    MANAGE_DOCUMENTS: "manageDocuments",
    VIEW_LOGS: "viewLogs",
    VIEW_EVENTS: "viewEvents",
    CREATE_EVENT: "createEvent",
    DELETE_EVENT: "deleteEvent",
    EDIT_ABSENCES: "editAbsences",
    DELETE_ABSENCES: "deleteAbsences",
    ADD_TO_BLACKLIST: "addToBlacklist",
    VIEW_BLACKLIST: "viewBlacklist",
    REMOVE_FROM_BLACKLIST: "removeFromBlacklist",
    EDIT_EVENT: "editEvent",
    VIEW_OWN_VACATIONS: "viewSelfVacations",
    EDIT_VACATIONS: "editVacations",
});

module.exports = PRIVILEGES;
