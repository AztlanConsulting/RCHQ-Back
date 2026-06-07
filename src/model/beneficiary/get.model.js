const prisma = require("../../prisma");
const { ROLES } = require("../../utils/roles");

exports.searchBeneficiaryByCurp = async (curp) => {
    return prisma.beneficiary.findUnique({
        where: { curp },
        select: {
            beneficiary_id: true,
            house_id: true,
        },
    });
};

exports.searchBeneficiaryByInfo = async ({
    name,
    maternal_surname,
    paternal_surname,
    birth_date,
    blood_type,
}) => {
    return prisma.beneficiary.findFirst({
        where: {
            name,
            maternal_surname,
            paternal_surname,
            birth_date: new Date(birth_date),
            blood_type,
        },
        select: {
            beneficiary_id: true,
            house_id: true,
        },
    });
};

exports.findActiveCoordinatorByHouseId = async (houseId) => {
    return prisma.employee.findFirst({
        where: {
            house_id: houseId,
            is_active: true,
            role: { name: ROLES.COORDINATOR },
        },
        select: {
            name: true,
            surname: true,
            email: true,
            phone_number: true,
        },
    });
};
