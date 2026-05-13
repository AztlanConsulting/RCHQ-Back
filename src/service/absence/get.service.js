const { getAllAbsenceTypes } = require("../../model/absence/get.model");
const RESPONSES = require("../../utils/responses");

exports.getAbsenceTypes = async () => {
    const absenceTypes = await getAllAbsenceTypes();

    if (!absenceTypes || absenceTypes.length <= 0) {
        return {
            code: RESPONSES.EVENTS.NOT_FOUND,
        };
    }

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            absenceTypes: absenceTypes.map((absenceType) => ({
                absenceTypeId: absenceType.absence_type_id,
                name: absenceType.name,
            })),
        },
    };
};
