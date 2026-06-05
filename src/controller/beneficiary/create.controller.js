const {
    registerBeneficiaryService,
} = require("../../service/beneficiary/create.service");
const RESPONSES = require("../../utils/responses");

exports.registerBeneficiary = async (req, res) => {
    try {
        const user = req.user;
        const beneficiary = req.body;

        const result = await registerBeneficiaryService(user, beneficiary);

        if (result.code === RESPONSES.BENEFICIARY.BAD_REQUEST) {
            return res.status(422).json({
                success: false,
                message: "Formato invalido para registrar un beneficiario",
            });
        }

        if (result.code === RESPONSES.BENEFICIARY.ALREADY_REGISTERED_IN_SAME_HOUSE) {
            return res.status(406).json({
                success: false,
                message:
                    "Beneficiario con la misma información ya se encuentra en esta casa",
                data: result.data,
            });
        }

        if (result.code === RESPONSES.BENEFICIARY.ALREADY_REGISTERED_IN_OTHER_HOUSE) {
            const data = result?.data;
            return res.status(406).json({
                success: false,
                message: `Beneficiario ya existe en casa: ${data?.house?.name}. Contacte al coordinador: ${data?.coordinator?.name} al ${data?.coordinator?.phoneNumber} o ${data?.coordinator?.email}`,
                data,
            });
        }

        if (result.code === RESPONSES.BENEFICIARY.ADDED) {
            return res.status(201).json({
                success: true,
                message: "Beneficiario registrado con éxito.",
                data: result.data,
                // redirect: `/app/beneficiarios/ver/${result.data?.beneficiaryId}`,
                redirect: "/app/beneficiarios",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};
