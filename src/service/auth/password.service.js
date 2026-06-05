const prisma = require("../../prisma");
const auth = require("../../model/auth/auth.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { verifyPassword, hashPassword } = require("../../utils/password");
const {
    buildSessionToken,
    buildPreTwoFactorAuthJwt,
} = require("../../utils/auth/authTokens");
const { buildSessionTimestamps } = require("../../utils/auth/sessionPolicy");
const { generateRefreshToken } = require("../../utils/jwt");
const { randomUUID } = require("crypto");

async function createSessionTokens(employee) {
    const sessionId = randomUUID();
    const token = await buildSessionToken(employee, sessionId);
    const refreshToken = generateRefreshToken(employee, sessionId);
    const timestamps = buildSessionTimestamps();

    await auth.createSession({
        employeeId: employee.employeeId,
        sessionId,
        refreshToken,
        ...timestamps,
    });

    return { token, refreshToken };
}

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
            message: "Contraseña cambiada exitosamente",
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
                message:
                    "Cambio de contraseña en primer inicio de sesión ya completado",
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

    if (employee.isActiveTwoFactorAuth) {
        const preTwoFactorAuthToken = buildPreTwoFactorAuthJwt({
            ...employee,
            hasFirstLogin: false,
        });

        return {
            status: 200,
            body: {
                success: true,
                message: "Contraseña cambiada exitosamente",
                nextStep: "LOGIN_COMPLETE",
                data: {
                    preTwoFactorAuthToken,
                    employeeId: employee.employeeId,
                    email: employee.email,
                    name: employee.name,
                },
            },
        };
    }

  const sessionEmployee = {
    ...employee,
    pwd: hashedPassword,
    hasFirstLogin: false,
  };

  const { token, refreshToken } = await createSessionTokens(sessionEmployee);

  return {
    status: 200,
    body: {
      success: true,
      message: "Contraseña cambiada exitosamente",
      nextStep: "LOGIN_COMPLETE",
      data: {
        refreshToken,
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
