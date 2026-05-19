const MAX_SEARCH_TERMS = 5;

exports.normalizeSpaces = (value = "") => {
    return String(value).trim().replace(/\s+/g, " ");
};

exports.splitSearchTerms = (value = "") => {
    const normalizedValue = exports.normalizeSpaces(value);

    if (!normalizedValue) return [];

    return normalizedValue
        .split(" ")
        .filter(Boolean)
        .slice(0, MAX_SEARCH_TERMS);
};

exports.escapeLikePattern = (value = "") => {
    return String(value).replace(/[\\%_]/g, "\\$&");
};

exports.buildContainsPattern = (value = "") => {
    return `%${exports.escapeLikePattern(value)}%`;
};
