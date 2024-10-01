import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import routes from './routes.ts'
import { limiter } from './rateLimiter.ts'
import passport from 'passport'
import session from 'express-session'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { loginORegister } from '../login.ts'
import { sessionMiddleware } from '../utils/redisClient.ts'

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

const app = express()
const port = process.env.PORT

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(limiter)
app.use(cookieParser())
app.use(sessionMiddleware)

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
},
async function(accessToken, refreshToken, profile, cb) {
  console.log('hello from cb func, auth was successful')
  const email = profile.emails[0].value; // Get the email used in auth
  const userData = await loginORegister(email); // Fetch data about linked to this email or create a new template
  console.log('hello from after loginORegister in cb func, userData is', userData)
  return cb(null, userData); // Return userDdata to the router in routes.ts as req.body
}
));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize())
app.use(passport.session())
app.use('/', routes)

app.listen(port, () => {
  console.log('listening on port', port)
})
