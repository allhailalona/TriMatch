import { Request, Response } from "express";
import { createSession } from './sessionMiddleware.ts'
import { genNMail, validateOTP } from "../../login.ts";
import { delGameState } from "../../utils/redisClient.ts";
import type { UserData } from "../../utils/types.ts";

export const sendOTPRoute = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log("hello from /send-otp email is", email);
    await genNMail(email);
  } catch (err) {
    console.error("Error in /send-otp:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const validateOTPRoute = async (req: Request, res: Response) => {
  try {
    const { OTP, email } = req.body;
    console.log("req.cookies are", req.cookies);
    // I'd like to make something clear, the email that is passed to this function from the front, is the one mongoose will use to fetch data,
    // so even if someone tries to access the front, and maanges to modify the email associated with the validateOTP request, he will NOT
    // get the data of the original email, but the data assocaited with the request.
    const { isValidated, userData } = await validateOTP(OTP, email);

    let toReturn: {
      isValidated: boolean;
      userData: UserData;
      sessionId?: string;
    } = { isValidated, userData }; // Default return values for web app

    if (isValidated) {
      /*
       * We use the createSession function for better readabilty and coherence
       * Generate crypto key
       * Store in a correct structure according to user/guest request (in this case user, since it's one of three successful auth route)
       * Pass it back to the express listener where 
       * Cookies can be modified to store sessionId
       * Or sessionId can be directly passed to the expo front for secure-store
       */
      console.log('validateOTPRoute email is', userData._id)
      const sessionId = await createSession(userData._id)
      
      // This replaces the guest sessionId, if existed, with the guest sessionId
      console.log('storing cookies as', sessionId)
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: false, // Set this to true when in prod mode
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
      });

      // For mobile app - insert sessionId to toReturn to be securely stored in the front
      toReturn = { ...toReturn, sessionId };
    }

    console.log('done with everything toReturn is', toReturn)
    res.status(200).json(toReturn);
  } catch (err) {
    console.error("Error in /validate-otp:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logOutRoute = async (req: Request, res: Response) => {
  try {
    if (req.cookies.sessionId) {
      // First scenario for manual cookies, if none were found, simply nothing happens.
      await delGameState(req.cookies.sessionId); // Delete sessionId in Redis

      res.clearCookie("sessionId", {
        // Remove cookies manually
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.status(200).json({ message: "Logged out successfully" });
    } else if (req.session) {
      // Second scenario for auto cookies (with express-session)
      // Clear express-session session if exists, no error will be generated if there is no active session
      console.log("about to destory cookies, before", req.session);
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        // Session has been destroyed
      });
      console.log("just destroyed req.session:", req.session);
      res.status(200).json({ message: "Logged out successfully" });
    } else {
      console.log("init logout func - there are NO active cookies");
      res.status(401).json({ error: "No active session" });
    }
  } catch (err) {
    console.error("error in logout express", err.message);
    throw err;
  }
};
