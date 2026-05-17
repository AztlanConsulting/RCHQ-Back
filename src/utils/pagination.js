exports.parsePagination = (pageQuery, limitQuery) => {
    const page = Number(pageQuery) > 0 ? Number(pageQuery) : 1;
    const parsedLimit = Number(limitQuery) > 0 ? Number(limitQuery) : 6;
    const limit = Math.min(parsedLimit, 100);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        take: limit,
    };
};

exports.buildPagination = ({ page, limit, total }) => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
};