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
    const terms = search
        ?.trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!terms || terms.length === 0) return {};

    return {
        employee: {
            AND: terms.map((term) => ({
                OR: [
                    {
                        name: {
                            contains: term,
                            mode: "insensitive",
                        },
                    },
                    {
                        surname: {
                            contains: term,
                            mode: "insensitive",
                        },
                    },
                    {
                        curp: {
                            contains: term,
                            mode: "insensitive",
                        },
                    },
                ],
            })),
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