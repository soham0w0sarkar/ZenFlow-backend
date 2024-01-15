import oauth2Client from "../config/oauth.js";
import User from "../models/user.js";

export const googleLogin = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });
  const { data } = await oauth2.userinfo.get();

  const user = await User.findOne({ email: data.email });

  if (user) {
    user.access_token = tokens.access_token;
    await user.save();
    return res.redirect("http://localhost:5173");
  }

  await User.create({
    name: data.name,
    email: data.email,
    access_token: tokens.access_token,
  });

  res.redirect("http://localhost:5173");
};
