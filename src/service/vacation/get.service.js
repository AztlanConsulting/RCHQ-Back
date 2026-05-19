const {
    getStartDate,
    findByIdWithRoleAndHouse,
} = require("../../model/employee/get.model");
const {
    getVacationsInRange,
    getPendingVacationRequestsByHouse,
    getReviewedVacationRequestsByHouse,
} = require("../../model/vacation/get.model");
const { getVacationDays } = require("../../utils/vacationDays");
const RESPONSES = require("../../utils/responses");
const { parsePagination, buildPagination } = require("../../utils/pagination");
const {
    buildVacationListWhere,
} = require("../../utils/vacationFilters");
const {
    mapReviewedStatus,
    mapVacationRequestForList,
} = require("../../utils/mappers/vacation.map");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const {
    getVacationRequestsInputSchema,
} = require("../../schemas/vacation/get.schemas");

const hasCurrentPrivilege = (employee, privilegeName) => {
    return employee.role?.role_privilege?.some(
        (rolePrivilege) => rolePrivilege.privilege?.name === privilegeName,
    );
};

exports.getRemainingVacations = async (employeeId) => {
    const result = await getStartDate(employeeId);

    if (!result) {
        return {
            code: RESPONSES.VACATION.WITHOUT_START_DATE,
        };
    }

    const baseDate = result.start_date;
    const baseDay = baseDate.getUTCDate();
    const baseMonth = baseDate.getUTCMonth();
    const baseYear = baseDate.getUTCFullYear();

    const currentDate = new Date();
    const currentDay = currentDate.getUTCDate();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();

    let anniversaryAlreadyPassed = false;

    if (
        (currentMonth === baseMonth && currentDay >= baseDay) ||
        currentMonth > baseMonth
    ) {
        anniversaryAlreadyPassed = true;
    }

    const startYear = anniversaryAlreadyPassed
        ? currentDate.getUTCFullYear()
        : currentDate.getUTCFullYear() - 1;

    const endYear = startYear + 1;

    const startDate = new Date(Date.UTC(startYear, baseMonth, baseDay));
    const endDate = new Date(Date.UTC(endYear, baseMonth, baseDay - 1));

    let usedDays = 0;

    const vacations = await getVacationsInRange(employeeId, startDate, endDate);

    vacations.forEach((vacation) => {
        usedDays += vacation.used_days;
    });

    const yearsWorked =
        currentYear - baseYear - (!anniversaryAlreadyPassed ? 1 : 0);

    const maxDays = getVacationDays(yearsWorked);

    return {
        code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
        data: {
            remainingDays: maxDays - usedDays,
            startDate,
            endDate,
        },
    };
};

exports.getVacationYearInfoForApproval = async (employeeId) => {
    const result = await getStartDate(employeeId);

    if (!result) {
        return {
            code: RESPONSES.VACATION.WITHOUT_START_DATE,
        };
    }

    const baseDate = result.start_date;
    const baseDay = baseDate.getUTCDate();
    const baseMonth = baseDate.getUTCMonth();
    const baseYear = baseDate.getUTCFullYear();

    const currentDate = new Date();
    const currentDay = currentDate.getUTCDate();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();

    const anniversaryAlreadyPassed =
        (currentMonth === baseMonth && currentDay >= baseDay) ||
        currentMonth > baseMonth;

    const startYear = anniversaryAlreadyPassed
        ? currentYear
        : currentYear - 1;

    const endYear = startYear + 1;

    const startDate = new Date(Date.UTC(startYear, baseMonth, baseDay));
    const endDate = new Date(Date.UTC(endYear, baseMonth, baseDay - 1));

    const yearsWorked =
        currentYear - baseYear - (!anniversaryAlreadyPassed ? 1 : 0);

    const maxDays = getVacationDays(yearsWorked);

    return {
        code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
        data: {
            startDate,
            endDate,
            maxDays,
        },
    };
};

exports.getPendingVacationRequests = async ({ actorEmployeeId, query }) => {
    if (!actorEmployeeId) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const validation = getVacationRequestsInputSchema.safeParse({
        actorEmployeeId,
        query,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.VACATION.VALIDATION_ERROR,
        };
    }

    query = validation.data.query;

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (actorRoleName !== "Coordinador") {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    if (!hasCurrentPrivilege(actorEmployee, "manageEmployees")) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    const { page, limit, skip, take } = parsePagination(
        query.page,
        query.limit,
    );

    const search = query.search?.trim() || "";

    const where = buildVacationListWhere({
        houseId: actorEmployee.house_id,
        search: "",
        startDate: query.startDate,
        endDate: query.endDate,
        statusFilter: VACATION_STATUS.PENDING,
    });

    const searchFilters = search
        ? {
            houseId: actorEmployee.house_id,
            statusFilter: VACATION_STATUS.PENDING,
            search,
            startDate: query.startDate,
            endDate: query.endDate,
        }
        : null;

    const { requests, total } = await getPendingVacationRequestsByHouse({
        where,
        skip,
        take,
        searchFilters,
    });

    return {
        code: RESPONSES.VACATION.REQUESTS_FOUND,
        data: {
            requests: requests.map(mapVacationRequestForList),
            pagination: buildPagination({ page, limit, total }),
        },
    };
};

exports.getReviewedVacationRequests = async ({ actorEmployeeId, query }) => {
    if (!actorEmployeeId) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const validation = getVacationRequestsInputSchema.safeParse({
        actorEmployeeId,
        query,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.VACATION.VALIDATION_ERROR,
        };
    }

    query = validation.data.query;

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (actorRoleName !== "Coordinador") {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    if (!hasCurrentPrivilege(actorEmployee, "manageEmployees")) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    const { page, limit, skip, take } = parsePagination(
        query.page,
        query.limit,
    );

    const search = query.search?.trim() || "";
    const mappedStatus = mapReviewedStatus(query.status || "all");

    const statusFilter =
        mappedStatus === "all"
            ? {
                in: [VACATION_STATUS.APPROVED, VACATION_STATUS.REJECTED],
            }
            : mappedStatus;

    const where = buildVacationListWhere({
        houseId: actorEmployee.house_id,
        search: "",
        startDate: query.startDate,
        endDate: query.endDate,
        statusFilter,
    });

    const searchFilters = search
        ? {
            houseId: actorEmployee.house_id,
            statusFilter,
            search,
            startDate: query.startDate,
            endDate: query.endDate,
        }
        : null;

    const { requests, total } = await getReviewedVacationRequestsByHouse({
        where,
        skip,
        take,
        searchFilters,
    });

    return {
        code: RESPONSES.VACATION.REQUESTS_FOUND,
        data: {
            requests: requests.map(mapVacationRequestForList),
            pagination: buildPagination({ page, limit, total }),
        },
    };
};
