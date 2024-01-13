import express from "express";
import passport from "passport";

const authRouter = express.Router();

authRouter.get("/status", (req, res) => {
  res.send(req.isAuthenticated());
});

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173/");
  }
);

authRouter.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
  });
  res.redirect("http://localhost:5173/");
});

export default authRouter;
