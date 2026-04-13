const User = require("../model/user.model");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { generateToken, generateFirstLoginToken, generatePre2faToken } = require("../utils/jwt");
const { canAccess } = require("../middleware/abac");
const { adminPolicy } = require("../policies/user.policies");
const {verifyPassword, hashPassword} = require("../utils/password");
const { getClientIp } = require("../utils/ip");

const TEMP_2FA_SETUP_EXPIRATION_MINUTES = 10; // tiempo que el código de configuración de 2FA es válido

exports.loginFunction = async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const ipAddress = getClientIp(req);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  try {
    const employee = await User.findEmployeeByEmail(normalizedEmail);

    // Empleado no existe
    if (!employee) {
      return res.status(401).json({success: false, message: "Invalid credentials",});
    }

    // Empleado inactivo
    if (!employee.isactive) {
      await User.createLogThrottled(
        employee.employeeid, "Intento de acceso denegado: usuario inactivo", ipAddress, 5,
      );

      return res.status(401).json({
        success:false, message: "Invalid credentials",
      });
    }

    // Cuenta bloqueada temporalmente
    if (employee.blockeduntil && new Date(employee.blockeduntil) > new Date()) {
      return res.status(423).json({
        success: false, message: "Account temporarily blocked", nextStep: "WAIT_BLOCK", blockedUntil: employee.blockeduntil,
      });
    }

    // Limpiar bloqueo cuando expire
    if (employee.blockeduntil && new Date(employee.blockeduntil) <= new Date()) {
      await User.clearLoginSecurityState(employee.employeeid);
      employee.failedloginattempts = 0;
      employee.blockeduntil = null;
    }

    // Contraseña incorrecta
    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
      const attempts = await User.incrementFailedAttempts(employee.employeeid);

      await User.createLogThrottled(employee.employeeid, "Intento fallido de autenticación", ipAddress, 5);

      if (attempts >=3) {
        const blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Bloquea por 15 minutos
        await User.setBlockedUntil(employee.employeeid, blockedUntil);

        await User.createLog(employee.employeeid, "Cuenta bloqueada temporalmente por múltiples intentos fallidos", ipAddress);

        return res.status(423).json({
          success: false, message: "Account temporarily blocked", nextStep: "WAIT_BLOCK", blockedUntil,
        });
      }

      return res.status(401).json({success: false, message: "Invalid credentials"});
    }

    // Limpiar intentos y bloqueo si la contraseña es correcta
    await User.clearLoginSecurityState(employee.employeeid);

    const userPayload = {
      id: employee.employeeid,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      privileges: ["read_profile"],
    };

    // Primer login
    if (employee.hasfirstlogin) {
      const firstLoginToken = generateFirstLoginToken({
        id: employee.employeeid,
        email: employee.email,
      });

      await User.createLog(employee.employeeid, "Primer acceso validado, pendiente cambio de contraseña", ipAddress);

      return res.status(200).json({
        success: true, message: "First login, password change required", nextStep: "CHANGE_PASSWORD", firstLoginToken,
        data: {
          email: employee.email,
          name: employee.name,
          role: employee.role,
        },
      });
    }

    // Usuario ya tiene 2fa activado
    if (employee.totpsecret) {
      const pre2faToken = generatePre2faToken({
        id: employee.employeeid,
        email: employee.email,
      });

      return res.status(200).json({
        success:true, message: "2FA required", nextStep: "VALIDATE_2FA", pre2faToken,
        data: {
          email: employee.email,
        },
      });
    }

    // Login completo sin 2fa
    const token = generateToken(userPayload);

    await User.createLog(employee.employeeid, "Inicio de sesión exitoso", ipAddress);

    return res.status(200).json({
      success: true, message: "Login successful", nextStep: "LOGIN_COMPLETE", token, remind2FA: true,
      data: {
        employeeId: employee.employeeid,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false, message: "Internal Server Error"
    });
  }
};

exports.changePasswordFirstLogin = async (req, res) => {
  const {newPassword, confirmPassword} = req.body || {};
  const employeeId = req.user?.id;
  const ipAddress = getClientIp(req);

  if (!employeeId) {
    return res.status(401).json({success: false, message: "User not authenticated",});
  }

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({success: false, message: "newPassword and confirmPassword are required",});
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({success: false, message: "Passwords do not match"});
  }

  // Cuando 2fa está implementado, OWASP recomienda un mínimo de 8 chars
  if (newPassword.length < 8 || newPassword.length > 70) {
    return res.status(400).json({success: false, message: "Password must be between 8 and 70 characters long"});
  }

  try {
    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({success: false, message: "Employee not found"});
    }

    if (!employee.isactive) {
      await User.createLog(employee.employeeid, "Intento de cambio de contraseña en primer acceso para usuario inactivo", ipAddress,);

      return res.status(403).json({success: false, message: "Access not allowed",});
      }
    
    if (!employee.hasfirstlogin) {
      return res.status(409).json({success: false, message: "First login password change is no longer required",});
    }

    const isSamePassword = await verifyPassword(newPassword, employee.pwd);

    if (isSamePassword) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }
    
    const hashedPassword = await hashPassword(newPassword);

    await User.completeFirstLoginPasswordChange(
      employee.employeeid,
      hashedPassword,
      ipAddress,
    );

    const userPayload = {
      id: employee.employeeid,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      privileges: ["read_profile"],
    };

    const token = generateToken(userPayload);

    return res.status(200).json({
      success: true, message: "Password changed successfully", nextStep: "SETUP_2FA_OPTIONAL", token,
      data: {
        employeeId: employee.employeeid,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        shouldPrompt2FASetup: true
      },
    });
  } catch (err) {
    console.error("First login password change error:", err);
    return res.status(500).json({success: false, message: "Internal Server Error"});
  }
};

exports.getProfile = (req, res) => {
  // const resource = {
  //   coordinators: User.coordinators || [],
  // };

  // // Check if the user has access to the profile resource based on the admin policy
  // // this one can be omitted if we use the authorize middleware in the route,
  // // but it's here for demonstration purposes
  // if (!canAccess(req.user, adminPolicy, resource)) {
  //   return res.status(403).json({ message: "Forbidden" });
  // }

  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      privileges: req.user.privileges || [],
    },
  });
};

exports.setupTwoFactorAuth = async (req, res) => {
  const employeeId = req.user?.id;
  const ipAddress = getClientIp(req);
  
  if (!employeeId) {
    return res.status(401).json({ success:false, message: "User not authenticated" });
  }

  try {
    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({success: false, message: "Employee not found"});
    }

    if (!employee.isactive) {
      await User.createLogThrottled(employee.employeeid, "Intento de configuración de 2FA para usuario inactivo", ipAddress, 5); 
      return res.status(403).json({success: false, message: "Access not allowed"});
  }

    if (employee.totpsecret) {
      return res.status(409).json({success: false, message: "2FA is already enabled for this account"});
    }

    if (employee.temptotpsecret && employee.temptotpsecretcreatedat) {
      const createdAt = new Date(employee.temptotpsecretcreatedat);
      const expiresAt = new Date(createdAt.getTime() + TEMP_2FA_SETUP_EXPIRATION_MINUTES * 60 * 1000);

      if (expiresAt > new Date()) {
        return res.status(409).json({
          success: false,
          message: "A 2FA setup is already pending. Please complete it or wait for it to expire.",
        });
      }

      await User.clearTempTotpSecret(employee.employeeid);
    }

    const tempSecret = speakeasy.generateSecret({
      name: `RCHQ (${employee.email})`,
      issuer: "RCHQ",
      length: 20
    });
    
    // Store tempSecret in database associated with the userId for later verification
    await User.saveTempTotpSecret(employee.employeeid, tempSecret.base32);
    
    const qrImage = await QRCode.toDataURL(tempSecret.otpauth_url);

    return res.status(200).json({
      success: true, message: "2FA setup started", nextStep: "VERIFY_2FA_SETUP",
      data: {
        employeeId: employee.employeeid,
        qrImage,
        otpauth_url: tempSecret.otpauth_url,
      },
    });
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.verifyTwoFactorSetup = async (req, res) => {
  const { token } = req.body || {};
  const employeeId = req.user?.id;
  const ipAddress = getClientIp(req);

  if (!employeeId) {
    return res.status(401).json({success: false, message: "User not authenticated"});
  }

  if (!token) {
    return res.status(400).json({success: false, message: "token is required"});
  }
  
  try {
    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({success: false, message: "Employee not found"});
    }

    if (!employee.isactive) {
      await User.createLog(employee.employeeid, "Intento de verificación 2FA para usuario inactivo", ipAddress);
      return res.status(403).json({ success: false, message: "Access not allowed" });
    }

    if (!employee.temptotpsecret) {
      return res.status(409).json({success: false, message: "No pending 2FA setup found"});
    }

    if (!employee.temptotpsecretcreatedat) {
      await User.clearTempTotpSecret(employee.employeeid);
      return res.status(409).json({
        success: false,
        message: "Invalid pending 2FA setup state",
      });
    }

    const createdAt = new Date(employee.temptotpsecretcreatedat);
    const expiresAt = new Date(createdAt.getTime() + TEMP_2FA_SETUP_EXPIRATION_MINUTES * 60 * 1000);

    if (expiresAt <= new Date()) {
      await User.clearTempTotpSecret(employee.employeeid);

      return res.status(409).json({
        success: false,
        message: "Pending 2FA setup has expired. Please start again.",
      });
    }

    //get user's temp secret from database using employeeId
    const verified = speakeasy.totp.verify({
      secret: employee.temptotpsecret,
      encoding: "base32",
      token,
      window: 1
    });

    if (!verified) {
      await User.createLogThrottled(employee.employeeid, "Activación fallida de 2FA", ipAddress, 5);

      return res.status(400).json({success:false, message: "Invalid 2FA code. Setup could not be completed.",
        nextStep: "2FA_SETUP_FAILED",
        data: {
          employeeId: employee.employeeid,
          canRetryInSettings: true
        }
      });
    }

    await User.activateTempTotpSecretWithLog(employee.employeeid, ipAddress);

    return res.status(200).json({success: true, message: "2FA activated successfully",
      nextStep: "2FA_SETUP_COMPLETE",
      data: {
        employeeId: employee.employeeid,
        twoFactorEnabled: true
      }
    });
  } catch (error) {
    console.error("2FA verify setup error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.validateTwoFactorAuth = async (req, res) => {
  const { token } = req.body || {};
  const employeeId = req.user?.id;
  const ipAddress = getClientIp(req);

  if (!employeeId) {
    return res.status(401).json({success: false, message: "User not authenticated"});
  }
  if (!token) {
    return res.status(400).json({success:false, message: "token is required"});
  }

  try {
    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({success: false, message: "Employee not found"});
    }

    if (!employee.isactive) {
      await User.createLog(employee.employeeid, "Intento de validación de 2FA para usuario inactivo", ipAddress); 
      return res.status(403).json({success: false, message: "Access not allowed"});
    }

    if (!employee.totpsecret) {
      return res.status(409).json({success: false, message: "2FA is not enabled for this account"});
    }

    const isValid = speakeasy.totp.verify({
      secret: employee.totpsecret,
      encoding: "base32",
      token,
      window: 1
    });

    if (!isValid) {
      await User.createLogThrottled(employee.employeeid, "Fallo de autenticación 2FA", ipAddress, 5);
      return res.status(401).json({success: false, message: "Invalid 2FA token"});
    }

    const userPayload = {
      id: employee.employeeid,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      privileges: ["read_profile"],
    };

    const tokenJwt = generateToken(userPayload);

    await User.createLog(employee.employeeid, "Inicio de sesión exitoso con 2FA", ipAddress);

    return res.status(200).json({success:true, message: "2FA validation successful",
      nextStep: "LOGIN_COMPLETE",
      token: tokenJwt,
      data: {
        employeeId: employee.employeeid,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("2FA validation error:", error);
    return res.status(500).json({success: false, message: "Internal Server Error" });
  }
};

exports.disableTwoFactorAuth = async (req, res) => {
  const { password } = req.body || {};
  const employeeId = req.user?.id;
  const ipAddress = getClientIp(req);

  if (!employeeId) {
    return res.status(401).json({success: false, message: "User not authenticated"});
  }

  if (!password) {
    return res.status(400).json({success: false, message: "Password is required to disable 2FA"});
  }

  try {
    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({success: false, message: "Employee not found"});
    }

    if (!employee.isactive) {
      await User.createLogThrottled(employee.employeeid, "Intento de desactivación de 2FA para usuario inactivo", ipAddress, 5); 
      return res.status(403).json({success: false, message: "Access not allowed"});
    }

    if (!employee.totpsecret) {
      return res.status(409).json({ success: false, message: "2FA is not enabled for this account" });
    }

    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
      await User.createLogThrottled(employee.employeeid, "Fallo de desactivación de 2FA por contraseña incorrecta", ipAddress, 5);
      return res.status(401).json({success: false, message: "Invalid credentials"});
    }

    await User.disableTotpSecretWithLog(employee.employeeid, ipAddress);

    return res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
      nextStep: "2FA_DISABLED",
      data: {
        employeeId: employee.employeeid,
        twoFactorEnabled: false,
      },
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};