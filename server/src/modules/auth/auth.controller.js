const authService = require("./auth.service");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });

    authService.setTokenCookie(res, result.token);

    res.status(201).json({
      success: true,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    authService.setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // Just clear the cookie — no JWT blacklist needed for this project
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
