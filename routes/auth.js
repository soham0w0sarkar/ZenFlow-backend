import express from "express";
import passport from "passport";

const authRouter = express.Router();

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
    console.log(req.isAuthenticated());
    res.redirect("/");
  }
);

authRouter.get("/logout", (req, res) => {
  console.log(req.isAuthenticated());
  req.session.destroy((err) => {
    if (err) console.log(err);
  });
  res.redirect("/");
});

export default authRouter;
