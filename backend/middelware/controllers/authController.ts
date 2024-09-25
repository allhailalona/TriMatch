import { Request, Response } from 'express'
import { genNMail, validateOTP } from '../../login.ts'
import { delGameState } from '../../utils/redisClient.ts'

export const sendOTPRoute = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    console.log('hello from /send-otp email is', email)
    await genNMail(email)
  } catch (err) {
    console.error('Error in /send-otp:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const validateOTPRoute = async (req: Request, res: Response) => {
  try {
    const { OTP, email } = req.body
    const { isValidated, userData, sessionId } = await validateOTP(OTP, email)

    if (isValidated) {
      console.log('validatoin successful adding cookies')
      // Those are instructions on saving cookies for the front
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: false, // Set this to true when in dev mode
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      })
    }
    res.json({ isValidated, userData })
  } catch (err) {
    console.error('Error in /validate-otp:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const logOutRoute = async (req: Request, res: Response) => {
  try {
    // If the user is logged, this here is more a failsafe mechanism, since this button shouldn't appear if he is not logged in
    if (req.cookies.sessionId) {
      console.log('there are cookies')
      await delGameState(req.cookies.sessionId) // Delete sessionId in Redis

      // Then remove cookies from browser
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      })

      res.status(200).json({ message: 'Logged out successfully' })
    } else {
      console.log('there are NO active cookies')
      res.status(401).json({ error: 'No active session' })
    }
  } catch (err) {
    console.error('error in logout express', err.message)
    throw err
  }
}
