const { stringToDate } = require("./dates");
const { buildAccentVariants, splitSearchTerms } = require("./search");

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
    const terms = splitSearchTerms(search);

    if (!terms.length) return {};

    return {
        employee: {
            AND: terms.map((term) => {
                const termVariants = buildAccentVariants(term);

                return {
                    OR: [
                        ...termVariants.map((variant) => ({
                            name: {
                                contains: variant,
                                mode: "insensitive",
                            },
                        })),
                        ...termVariants.map((variant) => ({
                            surname: {
                                contains: variant,
                                mode: "insensitive",
                            },
                        })),
                        {
                            curp: {
                                contains: term,
                                mode: "insensitive",
                            },
                        },
                    ],
                };
            }),
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
        parsedEndDate,
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
