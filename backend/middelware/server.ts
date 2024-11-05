import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import routes from "./routes.ts";
import { limiter } from "./rateLimiter.ts";
import { loginORegister } from "../login.ts";
import { sessionMiddleware } from "../utils/redisClient.ts";

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../", ".env");
dotenv.config({ path: envPath });

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || [
      "http://localhost:5173",
      "exp://10.100.102.143:8081",
    ],
    exposedHeaders: ["X-Source"],
    allowedHeaders: ["X-Source", "Content-Type", "Authorization", "Cookie"],
    credentials: true,
  }),
);

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// Basic serialization needed for Passport auth to work
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Should be the serve - where to redirect after auth is completed - wether successful or not.
      // DO NOT redirect to the front! This is the second step - see the second listener in routes.ts
      callbackURL: `${process.env.SERVER_URL || "http://localhost:3000/"}auth/google/callback`,
    },
    // If auth was successful performt he actions below, the actual auth starts at routes.ts
    async function (accessToken, refreshToken, profile, cb) {
      console.log("hello from cb func, auth was successful");
      const email = profile.emails[0].value; // Get the email used in auth
      const userData = await loginORegister(email); // Fetch data about linked to this email or create a new template
      console.log(
        "hello from after loginORegister in cb func, userData is",
        userData,
      );
      return cb(null, userData); // This becomes req.user
    },
  ),
);

app.use(limiter);
app.use("/", routes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("listening on port", port);
});
