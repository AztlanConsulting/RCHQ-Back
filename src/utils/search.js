exports.splitSearchTerms = (search) => {
    return String(search || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
};
