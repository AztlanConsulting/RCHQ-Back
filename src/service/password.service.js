const prisma = require("../prisma");
const User = require("../model/user.model");
const { createLog } = require("../model/log.model");
const { LOG_ACTIONS } = require("../utils/logActions");
const { getClientIp } = require("../utils/ip");
const { verifyPassword, hashPassword } = require("../utils/password");
const {
    buildSessionToken,
    buildPre2faJwt,
} = require("../utils/auth/authTokens");

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
                message: "User not authenticated",
            },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: {
                success: false,
                code: "EMPLOYEE_NOT_FOUND",
                message: "Employee not found",
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
                message: "Access not allowed",
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
                message: "Invalid credentials",
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
                message: "New password must be different from current password",
            },
        };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
        await tx.employee.update({
            where: { employee_id: employee.employeeId },
            data: {
                password: hashedPassword,
            },
        });

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
}

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
                message: "User not authenticated",
            },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: {
                success: false,
                code: "EMPLOYEE_NOT_FOUND",
                message: "Employee not found",
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
                message: "Access not allowed",
            },
        };
    }

    if (!employee.hasFirstLogin) {
        return {
            status: 409,
            body: {
                success: false,
                code: "FIRST_LOGIN_ALREADY_COMPLETED",
                message: "First login password change is no longer required",
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
                message: "New password must be different from current password",
            },
        };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
        await User.updatePasswordAndClearFirstLogin(
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
                message: "Password changed successfully",
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
            message: "Password changed successfully",
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
}
