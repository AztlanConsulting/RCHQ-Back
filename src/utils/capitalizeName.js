/**
 * Capitalizes the first letter of each word in a person's name.
 * Used before duplicate checks so casing does not bypass matches.
 */
const capitalizeName = (value) => {
    if (typeof value !== "string") return value;

    return value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase(),
        )
        .join(" ");
};

module.exports = { capitalizeName };
