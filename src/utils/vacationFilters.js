const { stringToDate } = require("./dates");

exports.buildVacationDateFilter = (startDate, endDate) => {
    if (!startDate && !endDate) return {};

    if (startDate && endDate) {
        return {
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
        };
    }

    if (startDate) {
        return {
            end: {
                gte: startDate,
            },
        };
    }

    return {
        start: {
            lte: endDate,
        },
    };
};

exports.buildVacationEmployeeSearchFilter = (search) => {
    if (!search) return {};

    return {
        employee: {
            OR: [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    surname: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    curp: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ],
        },
    };
};

exports.buildVacationListWhere = ({
    houseId,
    search,
    startDate,
    endDate,
    statusFilter,
}) => {
    const parsedStartDate = startDate ? stringToDate(startDate) : undefined;
    const parsedEndDate = endDate ? stringToDate(endDate) : undefined;

    const dateFilter = exports.buildVacationDateFilter(
        parsedStartDate,
        parsedEndDate
    );

    const searchFilter = exports.buildVacationEmployeeSearchFilter(search);

    return {
        ...dateFilter,
        status: statusFilter,
        employee: {
            house_id: houseId,
            role: {
                name: {
                    not: "Admin",
                },
            },
            ...(searchFilter.employee || {}),
        },
    };
};