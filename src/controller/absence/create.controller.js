exports.addAbsence = async (req, res) => {
    console.log("Prueba addAbsence", {
        actorEmployeeId: req.user?.id,
        targetEmployeeId: req.params.employeeId,
        targetHouseId: req.resolvedEmployee?.houseId,
    });

    return res.status(200).json({
        success: true,
        message: "Endpoint de prueba para registrar ausencia",
    });
};
