const { getStartDate } = require("../../model/employee/get.model");
const { getVacationsInRange } = require("../../model/vacation/get.model")
const { getVacationDays } = require("../../utils/vacationDays");
const RESPONSES = require("../../utils/responses");

exports.getRemainingVacations = async (employeeId) => {
    const result = await getStartDate(employeeId);

    if (!result) {
        return {
            code: RESPONSES.VACATION.WITHOUT_START_DATE
        }
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
    
    if ((currentMonth == baseMonth && currentDay >= baseDay) || currentMonth > baseMonth) {
        anniversaryAlreadyPassed = true;
    }
    
    let startYear = anniversaryAlreadyPassed ? currentDate.getUTCFullYear() : currentDate.getUTCFullYear() - 1;
    let endYear = startYear + 1;
    
    const startDate = new Date(Date.UTC(startYear, baseMonth, baseDay));
    const endDate = new Date(Date.UTC(endYear, baseMonth, baseDay - 1));

    let usedDays = 0;

    const vacations = await getVacationsInRange(employeeId, startDate, endDate);

    vacations.forEach(vacation => {
        usedDays += vacation.used_days;
    });

    const yearsWorked = currentYear - baseYear - (!anniversaryAlreadyPassed ? 1 : 0);
    const maxDays = getVacationDays(yearsWorked);
    
    return {
        code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
        data: {
            remainingDays: maxDays - usedDays,
            startDate: startDate,
            endDate: endDate
        }
    }
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
