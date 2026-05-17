const ACCENT_VARIANTS = {
    a: ["a", "á", "à", "ä", "â", "A", "Á", "À", "Ä", "Â"],
    e: ["e", "é", "è", "ë", "ê", "E", "É", "È", "Ë", "Ê"],
    i: ["i", "í", "ì", "ï", "î", "I", "Í", "Ì", "Ï", "Î"],
    o: ["o", "ó", "ò", "ö", "ô", "O", "Ó", "Ò", "Ö", "Ô"],
    u: ["u", "ú", "ù", "ü", "û", "U", "Ú", "Ù", "Ü", "Û"],
    n: ["n", "ñ", "N", "Ñ"],
};

const removeDiacritics = (value) => {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const splitSearchTerms = (search) => {
    return String(search || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
};

const capitalizeFirstLetter = (value) => {
    if (!value) return value;

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const buildAccentVariants = (term) => {
    const normalizedTerm = removeDiacritics(term).toLowerCase();

    const variants = normalizedTerm.split("").reduce(
        (currentVariants, char) => {
            const charVariants = ACCENT_VARIANTS[char] || [
                char,
                char.toUpperCase(),
            ];

            return currentVariants.flatMap((currentVariant) =>
                charVariants.map((charVariant) => `${currentVariant}${charVariant}`),
            );
        },
        [""],
    );

    return [
        ...new Set([
            term,
            term.toLowerCase(),
            term.toUpperCase(),
            capitalizeFirstLetter(term),
            normalizedTerm,
            normalizedTerm.toUpperCase(),
            capitalizeFirstLetter(normalizedTerm),
            ...variants,
        ]),
    ];
};

module.exports = {
    removeDiacritics,
    splitSearchTerms,
    buildAccentVariants,
};
