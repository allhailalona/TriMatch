import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Server } from "socket.io";
import http from "http";
import routes from "./routes.js";
import { initPubSub } from "../utils/redisClient.js";
import { limiter } from "./rateLimiter.js";
import { loginORegister } from "../login.js";
import { sessionMiddleware } from "../utils/redisClient.js";

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
    exposedHeaders: ["X-Source", "X-Request-Origin"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Source",
      "X-Request-Origin",
    ],
    credentials: true,
  }),
);

app.use(sessionMiddleware);

// Setup Socket.io
// a. create http server
const socketioServer = http.createServer(app);

// b. Config server
const io = new Server(socketioServer, {
  cors: {
    origin: process.env.CLIENT_URL || [
      "http://localhost:5173",
      "exp://10.100.102.143:8081",
    ],
    credentials: true,
  },
});

// Setup passport.js google oauth 2.0
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
    // If auth was successful perform the actions below, the actual auth starts at routes.ts
    async function (accessToken, refreshToken, profile, cb) {
      console.log("hello from cb func, auth was successful");
      const email = profile.emails[0].value; // Get the email used in auth
      const userData = await loginORegister(email); // Fetch data about linked to this email or create a new template
      console.log(
        "hello from after loginORegister in cb func, userData is",
        userData,
      );
      return cb(null, userData); // This becomes req.user the logic continues in auth controller
    },
  ),
);

app.use(limiter);
app.use("/", routes);

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await initPubSub();

    socketioServer
      .listen(port, () => {
        console.log(`🚀 Server listening on http://localhost:${port}`);
      })
      .on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          console.error(
            `❌ Port ${port} is already in use. Try: npx kill-port ${port}`,
          );
        } else {
          console.error("❌ Server failed to start:", error);
        }
        process.exit(1);
      });
  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
}

startServer();

export { io };
