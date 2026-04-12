const User = require("../model/user.model");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { generateToken } = require("../utils/jwt");
const { canAccess } = require("../middleware/abac");
const { adminPolicy } = require("../policies/user.policies");
const {verifyPassword, hashPassword} = require("../utils/password");

exports.loginFunction = async (req, res) => {
  const { email, password } = req.body || {};
  const ipAddress = req.ip;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  try {
    const employee = await User.findEmployeeByEmail(email);

    // Empleado no existe
    if (!employee) {
      return res.status(401).json({success: false, message: "Invalid credentials",});
    }

    // Empleado inactivo
    if (!employee.isactive) {
      await User.createLog(
        employee.employeeid, "Intento de acceso denegado: usuario inactivo", ipAddress,
      );

      return res.status(403).json({
        success:false, message: "Access not allowed",
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
      await User.clearBlockedUntil(employee.employeeid);
    }

    // Contraseña incorrecta
    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
      const attempts = await User.incrementFailedAttempts(employee.employeeid);

      await User.createLog(employee.employeeid, "Intento fallido de autenticación", ipAddress);

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
      await User.createLog(employee.employeeid, "Primer acceso validado, pendiente cambio de contraseña", ipAddress);

      return res.status(200).json({
        success: true, message: "First login, password change required", nextStep: "CHANGE_PASSWORD",
        data: {
          employeeId: employee.employeeid,
          email: employee.email,
          name: employee.name,
          role: employee.role,
        },
      });
    }

    // Usuario ya tiene 2fa activado
    if (employee.totpsecret) {
      return res.status(200).json({
        success:true, message: "2FA required", nextStep: "VALIDATE_2FA",
        data: {
          employeeId: employee.employeeid,
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
  const {employeeId, newPassword, confirmPassword} = req.body || {};
  const ipAddress = req.ip;

  if (!employeeId || !newPassword || !confirmPassword) {
    return res.status(400).json({success: false, message: "employeeId, newPassword and confirmPassword are required",});
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

    await User.updatePassword(employee.employeeid, hashedPassword);
    await User.setFirstLogin(employee.employeeid, false);

    await User.createLog(employee.employeeid, "Cambio de contraseña en primer acceso", ipAddress);

    const userPayload = {
      id: employee.employeeid,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      privileges: ["read_profile"]
    };

    const token = generateToken(userPayload);

    await User.createLog(employee.employeeid, "Inicio de sesión completado después de cambio de contraseña en primer acceso", ipAddress);

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
  const resource = {
    coordinators: User.coordinators || [],
  };

  // Check if the user has access to the profile resource based on the admin policy
  // this one can be omitted if we use the authorize middleware in the route,
  // but it's here for demonstration purposes
  if (!canAccess(req.user, adminPolicy, resource)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json({
    username: req.user.name || User.username,
    role: req.user.role || User.role,
    privileges: req.user.privileges || User.privileges,
  });
};

exports.twoFactorAuth = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Bad Request" });
  }

  try {
    const { id } = req.body;
    const tempSecret = speakeasy.generateSecret();
    // Store tempSecret in database associated with the userId for later verification

    const qrlImage = await QRCode.toDataURL(tempSecret.otpauth_url);

    res.json({
      id: id,
      secret: tempSecret.base32,
      otpauth_url: tempSecret.otpauth_url,
      qrlImage: qrlImage,
    });
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyTwoFactorAuth = (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Bad Request" });
  }

  const { token, userId } = req.body;

  try {
    const user = User; //get user from database using userId

    //get user's temp secret from database using userId
    const { base32: secret } = user.tempSecret;
    let verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
    });

    if (verified) {
      // save secret as permanent for the user in database and delete temp secret
      user.secret = user.tempSecret;
      res.json({ verified: true, message: "2FA verification successful" });
    } else {
      res.status(401).json({ verified: false, message: "Invalid 2FA token" });
    }
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.validateTwoFactorAuth = (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Bad Request" });
  }

  const { token, userId } = req.body;

  try {
    const user = User; //get user from database using userId

    //get user's temp secret from database using userId
    const { base32: secret } = user.secret;
    let tokenValidate = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // allow a window of 1 time step before and after to account for clock drift
    });

    if (tokenValidate) {
      res.json({ validated: true, message: "2FA verification successful" });
    } else {
      res.status(401).json({ validated: false, message: "Invalid 2FA token" });
    }
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
