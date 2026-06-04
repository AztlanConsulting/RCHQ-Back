const prisma = require("../../prisma");

exports.create = async (data) => {
    const beneficiary = await prisma.beneficiary.create({
        data: {
            beneficiary_id: data.beneficiaryId,
            house_id: data.houseId,
            name: data.name,
            maternal_surname: data.maternal_surname,
            paternal_surname: data.paternal_surname,
            preferred_name: data.preferred_name,
            birth_date: data.birth_date,
            age_entered_house: data.age_entered_house,
            blood_type: data.blood_type,
            curp: data.curp,
            last_modification: data.last_modification,
            last_record_update: data.last_record_update,
        },
    });

    return {
        beneficiaryId: beneficiary.beneficiary_id,
        houseId: beneficiary.house_id,
    };
};
