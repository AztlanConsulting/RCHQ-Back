const prisma = require("../../prisma");
const auth = require("../../model/auth/auth.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { verifyPassword, hashPassword } = require("../../utils/password");
const {
    buildSessionToken,
    buildPre2faJwt,
} = require("../../utils/auth/authTokens");

exports.changePassword = async ({
    employeeId,
    currentPassword,
    newPassword,
    ipAddress,
}) => {
    if (!employeeId) {
        return {
            status: 401,
            body: {
                success: false,
                code: "USER_NOT_AUTHENTICATED",
                message: "Usuario no autenticado",
            },
        };
    }

    const employee = await auth.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: {
                success: false,
                code: "EMPLOYEE_NOT_FOUND",
                message: "Empleado no encontrado",
            },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.PASSWORD_CHANGE_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: {
                success: false,
                code: "ACCESS_NOT_ALLOWED",
                message: "Acceso no permitido",
            },
        };
    }

    const currentPasswordMatches = await verifyPassword(
        currentPassword,
        employee.pwd,
    );

    if (!currentPasswordMatches) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.PASSWORD_CHANGE_WRONG_CURRENT_PASSWORD,
            ipAddress,
        );

        return {
            status: 401,
            body: {
                success: false,
                code: "INVALID_CURRENT_PASSWORD",
                message: "Credenciales inválidas",
            },
        };
    }

    const isSamePassword = await verifyPassword(newPassword, employee.pwd);

    if (isSamePassword) {
        return {
            status: 400,
            body: {
                success: false,
                code: "PASSWORD_REUSE",
                message: "La nueva contraseña debe ser diferente a la actual",
            },
        };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
        await auth.updatePassword(employee.employeeId, hashedPassword, tx);

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.PASSWORD_CHANGED,
            ipAddress,
            null,
            tx,
        );
    });

    return {
        status: 200,
        body: {
            success: true,
            message: "Password changed successfully",
            data: {
                employeeId: employee.employeeId,
            },
        },
    };
};

exports.changePasswordFirstLogin = async ({
    employeeId,
    newPassword,
    ipAddress,
}) => {
    if (!employeeId) {
        return {
            status: 401,
            body: {
                success: false,
                code: "USER_NOT_AUTHENTICATED",
                message: "Usuario no autenticado",
            },
        };
    }

    const employee = await auth.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: {
                success: false,
                code: "EMPLOYEE_NOT_FOUND",
                message: "Empleado no encontrado",
            },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.FIRST_LOGIN_CHANGE_PASSWORD_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: {
                success: false,
                code: "ACCESS_NOT_ALLOWED",
                message: "Acceso no permitido",
            },
        };
    }

    if (!employee.hasFirstLogin) {
        return {
            status: 409,
            body: {
                success: false,
                code: "FIRST_LOGIN_ALREADY_COMPLETED",
                message: "Cambio de contraseña en primer inicio de sesión ya completado",
            },
        };
    }

    const isSamePassword = await verifyPassword(newPassword, employee.pwd);

    if (isSamePassword) {
        return {
            status: 400,
            body: {
                success: false,
                code: "PASSWORD_REUSE",
                message: "La nueva contraseña debe ser diferente a la actual",
            },
        };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
        await auth.updatePasswordAndClearFirstLogin(
            employee.employeeId,
            hashedPassword,
            tx,
        );

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.FIRST_LOGIN_PASSWORD_CHANGED,
            ipAddress,
            null,
            tx,
        );

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.FIRST_LOGIN_COMPLETED,
            ipAddress,
            null,
            tx,
        );
    });

    if (employee.isActive2FA) {
        const pre2FAToken = buildPre2faJwt({
            ...employee,
            hasFirstLogin: false,
        });

        return {
            status: 200,
            body: {
                success: true,
                message: "Contraseña cambiada exitosamente",
                nextStep: "VERIFY_2FA",
                data: {
                    pre2FAToken,
                    employeeId: employee.employeeId,
                    email: employee.email,
                    name: employee.name,
                },
            },
        };
    }

    const token = buildSessionToken({
        ...employee,
        pwd: hashedPassword,
        hasFirstLogin: false,
    });

    return {
        status: 200,
        body: {
            success: true,
            message: "Contraseña cambiada exitosamente",
            nextStep: "LOGIN_COMPLETE",
            data: {
                token,
                user: {
                    employeeId: employee.employeeId,
                    email: employee.email,
                    name: employee.name,
                    role: employee.role,
                },
            },
        },
    };
};
