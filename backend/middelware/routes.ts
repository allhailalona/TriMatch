import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createSession } from './controllers/sessionMiddleware.ts'
import { setGameState, getGameState } from "../utils/redisClient.ts";
import { handleGameSession } from './controllers/sessionMiddleware.ts'
import {
  startGameRoute,
  validateSetRoute,
  autoFindSetRoute,
  drawACardRoute,
  syncWithServerRoute,
  onMountFetchRoute,
} from "./controllers/gameController.ts";
import {
  sendOTPRoute,
  validateOTPRoute,
  logOutRoute,
} from "./controllers/authController.ts";
import { limiter } from "./rateLimiter.ts";
import passport from "passport";

declare module "express" {
  interface User {
    email: string;
    id: string;
    // add other properties as needed
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      _id: string;
      // Add other user properties you expect
    };
  }
}

declare module "express-session" {
  interface SessionData {
    email?: string;
    // Add other session properties you expect
  }
}

const router = express.Router();

router.get("/start-game", limiter, handleGameSession, startGameRoute);
router.post("/validate", handleGameSession, validateSetRoute);
router.get("/auto-find-set", handleGameSession, autoFindSetRoute);
router.get("/draw-a-card", handleGameSession, drawACardRoute);
router.post("/send-otp", sendOTPRoute);
router.post("/validate-otp", limiter, validateOTPRoute);
router.post("/log-out", logOutRoute);
router.post("/sync-with-server", syncWithServerRoute); // This is called from store.ts
router.get("/on-mount-fetch", onMountFetchRoute); // While this is called from onMount in App.vue

// Routes for Google OAuth
router.get(
  "/auth/google", // Initial auth route
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/auth/google/callback", // Callback route must match exactly what's in Google Strategy
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  async (req, res) => { // This func starts after the cb thing in server.ts... Yes that's very very odd and unintuitive
    if (!req.user) {
      return res.redirect("/");
    }

    const sessionId = await createSession(req.user._id)
    console.log('after successful google auth path called createSession sessionId is', sessionId)

    // No google auth for Expo (and if if there was one, most odds it wouldn't have been here) so only cookies storage is necessary here
    // This block also replaces guest sessionIds with id ones
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: false, // Set this to true when in prod mode
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
    });

    // In Google auth, the userData, which was passed in validateOTP via the response of the vaildateOTP listener
    // is now passed vai the query URL params... That's how OAUTH2.0 Passport.js works...
    const redirectURL = new URL(
      process.env.CLIENT_URL || "http://localhost:5173",
    );
    redirectURL.searchParams.set("user", JSON.stringify(req.user));
    res.redirect(redirectURL.toString());
  },
);

export default router;
