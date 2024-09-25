import nodemailer from 'nodemailer'
import otpGen from 'otp-generator'
import { timingSafeEqual } from 'crypto'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { generateFromEmail } from 'unique-username-generator'
import { v4 as uuidv4 } from 'uuid'

import { setGameState, getGameState } from './utils/redisClient.ts'
import { connect, UserModel } from './utils/db.ts'
import { OTP } from './utils/backendTypes.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Looking to send emails in production? Check out our Email API/SMTP product!
const transport = nodemailer.createTransport({
  // eslint-disable-line
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '4870f2b5a003aa',
    pass: '35982c387db403'
  }
})

export async function genNMail(email: string): Promise<void> {
  try {
    const otp: number = otpGen.generate(6, { upperCase: false, specialChars: false })
    console.log('generated otp', otp)

    /*
    For now, to not reach limit early the otp is provided in console
    await transport.sendMail({
      from: '"OTP Service" <noreply@demomailtrap.com>',
      to: email,
      subject: "Your OTP Code",
      text: `Hello, this is the OTP: ${otp}`,
      html: `<b>Hello, this is the OTP: ${otp}</b>`
    });
    */

    await setGameState(`${email}:otp`, otp, 600)
  } catch (err) {
    throw err
  }
}

export async function validateOTP(userInputOTP: OTP['value'], email: string) {
  try {
    console.log('hello from validateOTP otp is', userInputOTP, 'email is', email)

    const storedOTP: OTP['value'] = await getGameState(`${email}:otp`) // Fetch OTP stored in Redis
    if (!storedOTP) {
      // Redis OTP was not found, most likely due to a timeout!
      const isValidated = false
      return { isValidated, reason: 'timeout! gen another otp' }
    } else {
      // Secure validation that takes a constant amount of time to prevent time attacks
      const userOTPBuffer = Buffer.from(userInputOTP.padEnd(6, '0'))
      const storedOTPBuffer = Buffer.from(storedOTP.padEnd(6, '0'))

      const isValidated = timingSafeEqual(userOTPBuffer, storedOTPBuffer)
      console.log('isValidated is', isValidated)
      if (isValidated) {
        // Redis OTP found and matches user OTP
        // Gen sessionId and store temp in Redis
        const sessionId = uuidv4()
        setGameState(`${email}:sessionId`, sessionId)

        const userData = await loginORegister(email) // Fetch or create user data from DB

        return { isValidated, sessionId, userData }
      } else {
        // Redis OTP found but but doesn't match user OTP
        return { isValidated }
      }
    }
  } catch (err) {
    throw err
  }
}

async function loginORegister(email: string) {
  try {
    await connect() // Establish and verify connection with MongoDB
    let user = await UserModel.findById(email) // Try to fetch user by email to see if there is already a user in DB
    if (!user || !user._id || user.username || user.stats) {
      // If there is no user, or if one of it lacks a certain property, register!
      console.log('no or incomplete user, creating a new one')
      await UserModel.deleteOne({ _id: email }) // Delete current user, an error won't be created if there is no user...
      const coolUsername = generateFromEmail(email, 3)
      user = new UserModel({
        _id: email,
        username: coolUsername,
        stats: {
          gamesPlayed: 0,
          setsFound: 0,
          speedrun3min: 0,
          speedrunWholeStack: 0
        }
      })
      await user.save() // Save new user in DB
    } // Otherwsie, the value of user will be the value found in the DB search conducted above
    return user
  } catch (err) {
    throw err
  }
}
