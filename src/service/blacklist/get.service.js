const { getBlacklistedEmployees } = require("../../model/blacklist/get.model");
const { getBlacklistSchema } = require("../../schemas/blacklist/get.schemas");
const RESPONSES = require("../../utils/responses");

exports.getBlacklist = async ({ role, houseId, ...queryParams }) => {
    try {
        const validationResult = getBlacklistSchema.safeParse(queryParams);
        if (!validationResult.success) {
            return {
                code: RESPONSES.BLACKLIST.INVALID_PAGINATION,
                error: validationResult.error.errors,
            };
        }

        const filters = {
            ...validationResult.data,
            role,
            houseId,
        };

        const result = await getBlacklistedEmployees(filters);

        if (!result) {
            return { code: RESPONSES.BLACKLIST.INTERNAL_ERROR };
        }

        return { code: RESPONSES.BLACKLIST.FETCHED, data: result };
    } catch (error) {
        console.error("Error inesperado en getBlacklist service:", error);
        return { code: RESPONSES.BLACKLIST.INTERNAL_ERROR };
    }
};