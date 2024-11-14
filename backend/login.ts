import nodemailer from "nodemailer";
import otpGen from "otp-generator";
import { timingSafeEqual } from "crypto";
import { generateFromEmail } from "unique-username-generator";
import mongoose from "mongoose";
import { setGameState, getGameState } from "./utils/redisClient.js";
import { connect, UserModel } from "./utils/db.js";
import { OTP } from "./types.js";

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../", ".env");
dotenv.config({ path: envPath });

// Looking to send emails in production? Check out our Email API/SMTP product!
const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "4870f2b5a003aa",
    pass: "35982c387db403",
  },
});

export async function genNMail(email: string): Promise<void> {
  const otp: string = otpGen.generate(8, {
    digits: true,
    specialChars: true,
  });
  console.log("generated otp", otp);

  await transport.sendMail({
    from: '"OTP Service" <noreply@demomailtrap.com>',
    to: email,
    subject: "Your OTP Code",
    text: `Hello, this is the OTP: ${otp}`,
    html: `<b>Hello, this is the OTP: ${otp}</b>`,
  });

  await setGameState(`${email}:otp`, otp, 600); // Store for 10 minutes
}

export async function validateOTP(userInputOTP: OTP["value"], email: string) {
  const storedOTP: OTP["value"] = await getGameState(`${email}:otp`); // Fetch OTP stored in Redis
  if (!storedOTP) {
    // If Redis OTP was not found, most likely due to a timeout!
    const isValidated = false;
    return { isValidated, reason: "timeout! gen another otp" };
  } else {
    // If Redis OTP was found, compare it with the one from the front securely.
    // Secure validation that takes a constant amount of time to prevent time attacks
    const userOTPBuffer = Buffer.from(userInputOTP.padEnd(6, "0"));
    const storedOTPBuffer = Buffer.from(storedOTP.padEnd(6, "0"));
    const isValidated = timingSafeEqual(userOTPBuffer, storedOTPBuffer);
    console.log("isValidated is", isValidated);
    ////////////////// So far with OTP validation /////////////////////////

    if (isValidated) {
      // Redis OTP found and matches user OTP
      const userData = await loginORegister(email); // Fetch or create user data from DB

      return { isValidated, userData };
    } else {
      // Redis OTP found but but doesn't match user OTP
      console.log("otp found on redis, but does NOT match the front OTP");
      return { isValidated };
    }
  }
}

// This function will be shared with authController to handle successful google auth in the future
export async function loginORegister(email: string) {
  try {
    await connect(); // Establish and verify connection with MongoDB
    let user = await UserModel.findById(email); // Try to fetch user by email to see if there is already a user in DB
    if (!user || !user._id || !user.username || !user.stats) {
      // If there is no user, or if it lacks a certain property, register!
      console.log("no or incomplete user, creating a new one");
      await UserModel.deleteOne({ _id: email }); // Delete current user, no error would be created if there is no user to delete...
      const coolUsername = generateFromEmail(email, 3); // Generate a cool username
      user = new UserModel({
        _id: email,
        username: coolUsername,
        stats: {
          gamesPlayed: 0,
          setsFound: 0,
          speedrun3min: 0,
          speedrunWholeStack: 0,
        },
      });
      await user.save(); // Save new user in DB
    } // Otherwsie, the value of user will be the value found in the DB search conducted before the conditional
    return user;
  } finally {
    await mongoose.disconnect();
  }
}
