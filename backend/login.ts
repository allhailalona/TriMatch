import nodemailer from 'nodemailer'
import otpGen from 'otp-generator'
import { timingSafeEqual } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

import { setGameState, getGameState } from './server.ts'
import { OTP } from './backendTypes.ts'

// Looking to send emails in production? Check out our Email API/SMTP product!
const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "4870f2b5a003aa",
    pass: "35982c387db403"
  }
});

export async function genNMail(email: string): Promise<void> {
  try {
    const otp: number = otpGen.generate(6, { upperCase: false, specialChars: false });
    console.log('generated otp', otp);

    await transport.sendMail({
      from: '"OTP Service" <noreply@demomailtrap.com>',
      to: email,
      subject: "Your OTP Code",
      text: `Hello, this is the OTP: ${otp}`,
      html: `<b>Hello, this is the OTP: ${otp}</b>`
    });

    await setGameState(`${email}:otp`, otp, 600)
  } catch (err) {
    throw new Error(`error in genNMail: ${err.message}`)
  }
}

export async function validateOTP(userInputOTP: OTP['value'], email: string): Promise<Object> {
  try {
    console.log('hello from validateOTP otp is', userInputOTP, 'email is', email)
    
    const storedOTP: OTP['value'] = await getGameState(`${email}:otp`)
    if (!storedOTP) {
      const isValidated = false
      return { isValidated, reason: 'timeout! gen another otp'};
    } else {
      // Secure validation
      const userOTPBuffer = Buffer.from(userInputOTP.padEnd(6, '0'));
      const storedOTPBuffer = Buffer.from(storedOTP.padEnd(6, '0'));
      
      const isValidated =  timingSafeEqual(userOTPBuffer, storedOTPBuffer);
      console.log('isValidated is', isValidated)
      if (isValidated) {
        const sessionId = await createSession(email);
        return { isValidated, 'reason': 'otp is correct!', sessionId}
      } else {
        return {isValidated, 'reason': 'otp is incorrect!'}
      }
    }  
  } catch (err) {
    throw new Error (`error in login.ts validateOTP: ${err.message}`)
  }
}

async function createSession(email: string): Promise<string> {
  const sessionId = uuidv4()
  // U could implement afk in the future
  await setGameState(`${email}:sessionId`, sessionId, 1800) // Store the sessionId in Redis for 30 minutes
  return sessionId
}