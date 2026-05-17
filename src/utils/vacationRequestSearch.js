const { Prisma } = require("@prisma/client");
const { splitSearchTerms, buildContainsPattern } = require("./search");

const buildStatusSql = (statusFilter) => {
    if (
        statusFilter &&
        typeof statusFilter === "object" &&
        Array.isArray(statusFilter.in)
    ) {
        return Prisma.sql`vr.status IN (${Prisma.join(statusFilter.in)})`;
    }

    return Prisma.sql`vr.status = ${statusFilter}`;
};

const buildDateSql = ({ startDate, endDate }) => {
    if (startDate && endDate) {
        return Prisma.sql`
            AND vr.start <= ${endDate}::date
            AND vr."end" >= ${startDate}::date
        `;
    }

    if (startDate) {
        return Prisma.sql`
            AND vr."end" >= ${startDate}::date
        `;
    }

    if (endDate) {
        return Prisma.sql`
            AND vr.start <= ${endDate}::date
        `;
    }

    return Prisma.empty;
};

const buildSearchSql = (search) => {
    const terms = splitSearchTerms(search);

    if (!terms.length) return Prisma.empty;

    const termConditions = terms.map((term) => {
        const normalizedTerm = buildContainsPattern(term);

        return Prisma.sql`
            (
                lower(unaccent(e.name)) LIKE lower(unaccent(${normalizedTerm})) ESCAPE '\\'
                OR lower(unaccent(e.surname)) LIKE lower(unaccent(${normalizedTerm})) ESCAPE '\\'
                OR lower(e.curp) LIKE lower(${normalizedTerm}) ESCAPE '\\'
            )
        `;
    });

    return Prisma.sql`
        AND ${Prisma.join(termConditions, " AND ")}
    `;
};

const mapVacationRequestRow = (row) => ({
    vacations_request_id: row.vacations_request_id,
    employee_id: row.employee_id,
    start: row.start,
    end: row.end,
    status: row.status,
    feedback: row.feedback,
    created_at: row.created_at,
    used_days: row.used_days,
    employee: {
        employee_id: row.employee_id,
        name: row.employee_name,
        surname: row.employee_surname,
        curp: row.employee_curp,
        picture: row.employee_picture,
        start_date: row.employee_start_date,
        house: {
            house_id: row.house_id,
            name: row.house_name,
        },
    },
});

exports.buildVacationRequestSearchSqlParts = ({
    houseId,
    statusFilter,
    search,
    startDate,
    endDate,
}) => {
    const statusSql = buildStatusSql(statusFilter);
    const dateSql = buildDateSql({ startDate, endDate });
    const searchSql = buildSearchSql(search);

    const baseWhereSql = Prisma.sql`
        FROM public.vacations_request vr
        INNER JOIN public.employee e
            ON e.employee_id = vr.employee_id
        INNER JOIN public.house h
            ON h.house_id = e.house_id
        INNER JOIN public.role r
            ON r.role_id = e.role_id
        WHERE e.house_id = ${houseId}::uuid
            AND r.name <> 'Admin'
            AND ${statusSql}
            ${dateSql}
            ${searchSql}
    `;

    return {
        baseWhereSql,
        mapVacationRequestRow,
    };
};
