const User = require("../model/user.model");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { generateToken } = require("../utils/jwt");
const { canAccess } = require("../middleware/abac");
const { adminPolicy } = require("../policies/user.policies");

exports.loginFunction = async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt:", email, password);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const row = await User.findActiveEmployeeByEmail(email);
    if (!row || row.pwd !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = {
      id: row.employeeid,
      email: row.email,
      name: row.name,
      role: row.role,
      privileges: ["read_profile"],
    };

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
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

exports.activate2FA = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Bad Request" });
  }
  const { id } = req.body;
  try {
    const active2FA = await User.active2FA(id);
    if (!active2FA) {
      return res.status(500).json({ message: "Failed to activate 2FA" });
    }
    return res.status(200).json({ message: "2FA activated successfully" });
  }catch (error) {
    console.error("Error activating 2FA:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.twoFactorAuth = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Bad Request" });
  }

  try {
    const { id } = req.body;
    const user = await User.findActiveEmployeeById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tempSecret = speakeasy.generateSecret({
      name: `RCHQ:${user.email}`,
      issuer: 'RCHQ',
    });

    // Store tempSecret in database associated with the userId for later verification
    await User.saveTempSecret(id, tempSecret.base32);

    const qrImage = await QRCode.toDataURL(tempSecret.otpauth_url);

    if (!qrImage) {
      return res.status(500).json({ message: "Failed to generate QR code" });
    };

    res.json({
      qrImage: qrImage,
    });
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyTwoFactorAuth = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Bad Request" });
  }

  const { token, id } = req.body;
  console.log("Verifying 2FA for user ID:", id, "with token:", token);
  try {
    const user = await User.findActiveEmployeeById(id); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    };
    //get user's temp secret from database using userId
    const secret = user.totpsecret;
    let verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // allow a window of 1 time step before and after to account for clock drift
    });

    if (verified) {
      // Activate 2FA for the user
      await User.active2FA(id);
      res.status(200).json({ verified: true, message: "2FA verification successful" });
    } else {
      res.status(401).json({ verified: false, message: "Invalid 2FA token" });
    }
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
