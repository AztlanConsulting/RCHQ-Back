const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const ONLY_NUMBERS_REGEX = /^\d+$/;
const NAMES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._/-]+$/;

const emptyToNull = (val) => (val === "" ? null : val);

const beneficiaryCreateSchema = z.object({
    // first_names

    // maternal_surname

    // paternal_surname

    // preferred_name

    // birth_date

    // age_entered_house

    // blood_type

    // curp optional
})

module.exports = {
    beneficiaryCreateSchema,
};
