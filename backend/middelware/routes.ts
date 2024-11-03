import express from "express";
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

const router = express.Router();

router.get("/start-game", startGameRoute);
router.post("/validate", validateSetRoute);
router.get("/auto-find-set", autoFindSetRoute);
router.get("/draw-a-card", drawACardRoute);
router.post("/send-otp", sendOTPRoute);
router.post("/validate-otp", limiter, validateOTPRoute);
router.post("/log-out", logOutRoute);
router.post("/sync-with-server", syncWithServerRoute); // This is called from store.ts
router.post("/on-mount-fetch", onMountFetchRoute); // While this is called from onMount in App.vue

// Perform the actual validation
router.get(
  "/auth/google", // The fetch request route... Nothing new here
  passport.authenticate("google", { scope: ["profile", "email"] }), // Type of auth, and data to be extracted from it
); // This line is responsible for the actual authentication

// After validatoin /auth/google redirects here, which in turn redirects with/without data according to result of auth
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { // If auth fails
    failureRedirect: "/",
    failureMessage: true,
  }),
  (req, res) => { // If auth succeded
    if (req.user) {
      console.log(
        "Auth is successful, cb func was apparently already called, and its value is:",
        req.user,
      );
      req.session.email = req.user._id;
      console.log("just updated req.session.email valeu is", req.session.email);
      // Redirect to frontend with user data
      console.log(
        "a user was passed to this func userData is",
        JSON.stringify(req.user),
      );
      res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:5173/'}?user=${encodeURIComponent(JSON.stringify(req.user))}`,
      );
    } else { // Unknown error has occured
      console.error(
        "there is an unkown error with the passing of data from cb func, check it out",
      );
      res.redirect("/");
    }
  },
  (err, req, res, next) => {
    // Additional handling for failure, not sure what's happening the first time (above) 
    console.error(
      "Authentication failed:",
      err || req.session.messages || "Unknown error",
    );
    res.redirect("/"); // Redirect on failure
  },
);

export default router;
