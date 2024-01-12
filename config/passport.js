import GoogleStrategy from "passport-google-oauth20";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import User from "../models/user.js";

export default (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async function (_, __, profile, done) {
        const user = await User.findOne({ email: profile._json.email });
        if (user) {
          return done(null, user);
        }
        const newUser = await User.create({
          name: profile._json.name,
          email: profile._json.email,
        });
        return done(null, newUser);
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};
