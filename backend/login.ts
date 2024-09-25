import nodemailer from 'nodemailer'
import otpGen from 'otp-generator'
import { timingSafeEqual } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { generateFromEmail } from 'unique-username-generator'

import { setGameState, getGameState } from './server.ts'
import { OTP, User } from './backendTypes.ts'

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

export async function validateOTP(userInputOTP: OTP['value'], email: string): Promise<Object> {
  try {
    console.log('hello from validateOTP otp is', userInputOTP, 'email is', email)

    const storedOTP: OTP['value'] = await getGameState(`${email}:otp`)
    if (!storedOTP) {
      const isValidated = false
      return { isValidated, reason: 'timeout! gen another otp' }
    } else {
      // Secure validation
      const userOTPBuffer = Buffer.from(userInputOTP.padEnd(6, '0'))
      const storedOTPBuffer = Buffer.from(storedOTP.padEnd(6, '0'))

      const isValidated = timingSafeEqual(userOTPBuffer, storedOTPBuffer)
      console.log('isValidated is', isValidated)
      if (isValidated) {
        const sessionId = await createSession(email)
        const username = await loginORegister(email)

        return { isValidated, cause: 'otp is correct!', sessionId, username }
      } else {
        return { isValidated, reason: 'otp is incorrect!' }
      }
    }
  } catch (err) {
    throw err
  }
}

async function createSession(email: string): Promise<string> {
  try {
    const sessionId = uuidv4()
    // U could implement afk in the future
    await setGameState(`${email}:sessionId`, sessionId, 1800) // Store the sessionId in Redis for 30 minutes
    return sessionId
  } catch (err) {
    throw err
  }
}

async function loginORegister(email: string) {
  try {
    // Establish and verify connection
    await connect()
    if (mongoose.connection.readyState === 1) {
      console.log('connection active')
    } else {
      console.log('connection NOT active')
    }

    const username = await fetchUser(email) // Register or login
    console.log('fetched username is', username)
    return username
  } catch (err) {
    throw err
  }
}

// Connect to MongoDB with Mongoose
const UserSchema = new mongoose.Schema({
  _id: String,
  username: String
})

const UserModel = mongoose.model<User>('user', UserSchema, 'Users')

async function connect(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('Connected successfully')
  } catch (err) {
    throw err
  }
}

async function fetchUser(email: string): Promise<string> {
  try {
    let user = await UserModel.findById(email)
    if (!user) {
      // If there is no user create a new one
      console.log('there is no user with this email, creating a new one value of no user is', user)
      const coolUsername = generateFromEmail(email, 3)
      user = new UserModel({
        _id: email,
        username: coolUsername
        // Add other default fields
      })
      await user.save()
    }
    return user.username
  } catch (err) {
    throw err
  }
}
