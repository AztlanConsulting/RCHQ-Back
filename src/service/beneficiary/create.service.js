const { randomUUID } = require("crypto");
const {
    beneficiaryCreateSchema,
} = require("../../schemas/beneficiary/create.schema");
const {
    searchBeneficiaryByCurp,
    searchBeneficiaryByInfo,
    findActiveCoordinatorByHouseId,
} = require("../../model/beneficiary/get.model");
const { create: createBeneficiary } = require("../../model/beneficiary/create.model");
const { getHouseById } = require("../../model/house/get.model");
const RESPONSES = require("../../utils/responses");

exports.registerBeneficiaryService = async (user, beneficiary) => {
    const validation = beneficiaryCreateSchema.safeParse(beneficiary);

    if (!validation.success) {
        return {
            code: RESPONSES.BENEFICIARY.BAD_REQUEST,
        };
    }

    const data = validation.data;

    let existing = null;

    if (data.curp) {
        existing = await searchBeneficiaryByCurp(data.curp);
    } else {
        existing = await searchBeneficiaryByInfo({
            name: data.name,
            maternal_surname: data.maternal_surname,
            paternal_surname: data.paternal_surname,
            birth_date: data.birth_date,
            blood_type: data.blood_type,
        });
    }

    if (existing) {
        if (existing.house_id === user.houseId) {
            return {
                code: RESPONSES.BENEFICIARY.ALREADY_REGISTERED_IN_SAME_HOUSE,
                data: { beneficiaryId: existing.beneficiary_id },
            };
        }

        const [house, coordinator] = await Promise.all([
            getHouseById(existing.house_id),
            findActiveCoordinatorByHouseId(existing.house_id),
        ]);

        const coordinatorName = coordinator
            ? `${coordinator.name} ${coordinator.surname}`.trim()
            : "";

        return {
            code: RESPONSES.BENEFICIARY.ALREADY_REGISTERED_IN_OTHER_HOUSE,
            data: {
                house: {
                    id: house?.houseId ?? existing.house_id,
                    name: house?.name ?? "",
                },
                coordinator: {
                    name: coordinatorName,
                    phoneNumber: coordinator?.phone_number ?? "",
                    email: coordinator?.email ?? "",
                },
            },
        };
    }

    const now = new Date();

    const created = await createBeneficiary({
        beneficiaryId: randomUUID(),
        houseId: user.houseId,
        name: data.name,
        maternal_surname: data.maternal_surname,
        paternal_surname: data.paternal_surname,
        preferred_name: data.preferred_name,
        birth_date: new Date(data.birth_date),
        age_entered_house: data.age_entered_house,
        blood_type: data.blood_type,
        curp: data.curp ?? null,
        last_modification: now,
        last_record_update: null,
    });

    return {
        code: RESPONSES.BENEFICIARY.ADDED,
        data: { beneficiaryId: created.beneficiaryId },
    };
};
