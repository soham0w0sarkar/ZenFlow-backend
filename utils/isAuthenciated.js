export const isAuthenciated = (req, res, next) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
