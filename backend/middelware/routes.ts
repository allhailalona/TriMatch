import express from "express";
import { v4 as uuidv4 } from "uuid";
import { setGameState, getGameState } from "../utils/redisClient.ts";
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

router.get("/start-game", startGameRoute);
router.post("/validate", validateSetRoute);
router.get("/auto-find-set", autoFindSetRoute);
router.get("/draw-a-card", drawACardRoute);
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
    if (!req.user) {
      return res.redirect("/");
    }

    // Since req.session is not working for now, I use manuall cookies instead.
    // // Set session data
    // req.session.email = req.user._id;

    // // Make sure to wait for session to be saved
    // req.session.save((err) => {
    //   if (err) {
    //     console.error('Session save error:', err);
    //     return res.redirect('/error');
    //   }

    //   console.log('Session saved successfully:', req.session);  // Debug log
    // });

    // Gen sessionId and store temp in Redis
    const sessionId = uuidv4();
    // The user data is NOT required to run the app, it mainly shows stats and optional information. Which is why it won't be store in Redis.
    await setGameState(sessionId, req.user._id, 43200); // Store for 12 hours
    console.log(
      "saved sessionId in google auth route value is now",
      await getGameState(sessionId),
    );

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: false, // Set this to true when in prod mode
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
    });

    const redirectURL = new URL(
      process.env.CLIENT_URL || "http://localhost:5173",
    );
    redirectURL.searchParams.set("user", JSON.stringify(req.user));
    res.redirect(redirectURL.toString());
  },
);

export default router;
