import express from "express";
import { createSession } from "./controllers/sessionMiddleware.js";
import { handleGameSession } from "./controllers/sessionMiddleware.js";
import {
  startGameRoute,
  validateSetRoute,
  autoFindSetRoute,
  drawACardRoute,
} from "./controllers/gameController.js";
import {
  syncWithServerRoute,
  onMountFetchRoute,
} from "./controllers/dataPersistanceController.js";
import {
  sendOTPRoute,
  validateOTPRoute,
  logOutRoute,
} from "./controllers/authController.js";
import { limiter } from "./rateLimiter.js";
import passport from "passport";
import { clear3minSpeedRunTimer } from '../utils/redisClient.js'

const router = express.Router();

// Advanced TypeScript errors are intentionally left visible (red underlines).
// They relate to complex Express/Passport type declarations.
// Looking for input from experienced developers on proper typing approach.
router.get("/start-game", limiter, handleGameSession, startGameRoute);
router.post('/clear-timer', clear3minSpeedRunTimer)
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
  async (req, res) => {
    // This func starts after the cb thing in server.ts... Yes that's very very odd and unintuitive
    if (!req.user) {
      return res.redirect("/");
    }

    const sessionId = await createSession(req.user._id);
    console.log(
      "after successful google auth path called createSession sessionId is", sessionId);

    // No google auth for Expo (and if if there was one, most odds it wouldn't have been here) so only cookies storage is necessary here
    // This block also replaces guest sessionIds with id ones
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: true, // Set to true when in prod mode! It won't work otherwise!
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
    });

    // In Google auth, the userData, which was passed in validateOTP via the response of the vaildateOTP listener
    // is now passed vai the query URL params... That's how OAUTH2.0 Passport.js works...
    console.log('redirecting to', process.env.CLIENT_URL || "http://localhost:5173")
    const redirectURL = new URL(
      process.env.CLIENT_URL || "http://localhost:5173",
    );
    redirectURL.searchParams.set("user", JSON.stringify(req.user));
    res.redirect(redirectURL.toString());
  },
);

export default router;
