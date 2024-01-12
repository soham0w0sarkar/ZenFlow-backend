import passport from "passport";
import ErrorHandler from "../utils/errorHandler.js";

export const googleAuth = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
};

export const googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", { failureRedirect: "/" }),
    (req, res, next) => {
      req.login(req.user, (err) => {
        if (err) next(new ErrorHandler(err.message, 500));
      });
    };
  res.redirect("/auth/loginSuccess");
};

export const loginSuccess = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Logged in successfully",
  });
};

export const logout = (req, res, next) => {
  req.logout(req.user, (err) => {
    if (err) next(new ErrorHandler(err.message, 500));
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
