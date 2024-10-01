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
    // I'd like to make something clear, the email that is passed to this function from the front, is the one mongoose will use to fetch data,
    // so even if someone tries to access the front, and maanges to modify the email associated with the validateOTP request, he will NOT
    // get the data of the original email, but the data assocaited with the request. I was very stressed at first thinking I made a grave mistake
    // but after further thinking, I reached the conclusion it's okay.
    const { isValidated, userData, sessionId } = await validateOTP(OTP, email)

    if (isValidated) {
      console.log('validatoin successful MANUALLY adding cookies')
      // Those are instructions on saving cookies for the front
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: false, // Set this to true when in dev mode
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // Store cookies for 24 hours only
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
    // Make sure there is indeed a session to remove
    if (req.cookies.sessionId) {
      console.log('trying to init logout func - there are cookies')
      await delGameState(req.cookies.sessionId) // Delete sessionId in Redis

      // Then remove Manual cookies from browser, again nothing happens if no session
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      })

      res.status(200).json({ message: 'Logged out successfully' })
    } else if (req.session) {
      // Clear express-session session if exists, no error will be generated if there is no active session
      console.log('about to destory cookies, before', req.session)
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        // Session has been destroyed
      });
      console.log('after destroying session:', req.session)
      res.status(200).json({ message: 'Logged out successfully' })
    } else {
      console.log('init logout func - there are NO active cookies')
      res.status(401).json({ error: 'No active session' })
    }
  } catch (err) {
    console.error('error in logout express', err.message)
    throw err
  }
}
