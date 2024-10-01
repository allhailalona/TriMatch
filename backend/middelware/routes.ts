import express from 'express'
import {
  startGameRoute,
  validateSetRoute,
  autoFindSetRoute,
  drawACardRoute,
  syncWithServerRoute,
  onMountFetchRoute
} from './controllers/gameController.ts'
import { sendOTPRoute, validateOTPRoute, logOutRoute } from './controllers/authController.ts'
import { limiter } from './rateLimiter.ts'
import passport from 'passport'

const router = express.Router()

router.post('/start-game', startGameRoute)
router.post('/validate', validateSetRoute)
router.post('/auto-find-set', autoFindSetRoute)
router.post('/draw-a-card', drawACardRoute)
router.post('/send-otp', sendOTPRoute)
router.post('/validate-otp', limiter, validateOTPRoute)
router.post('/log-out', logOutRoute)
router.post('/sync-with-server', syncWithServerRoute) // This is called from store.ts
router.post('/on-mount-fetch', onMountFetchRoute) // While this is called from onMount in App.vue

// Routes simply manage the redirects, while the actions that should take place after a successful/failed validation are located in server.ts
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] })) // This line is responsible for the actual authentication

// This one is responsible for handling the result
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/', failureMessage: true }),
  (req, res) => {
    // This log will execute on successful authentication
    if (req.user) {
      console.log(
        'Auth is successful, cb func was apparently already called, and its value is:',
        req.user
      )
      console.log('hiter req.user._id is', req.user._id)
      req.session.email = req.user._id
      console.log('just updated req.session.email valeu is', req.session.email)
      // Redirect to frontend with user data
      console.log('a user was passed to this func userData is', JSON.stringify(req.user))
      res.redirect(`http://localhost:5173/?user=${encodeURIComponent(JSON.stringify(req.user))}`)
    } else {
      console.error('there is an unkown error with the passing of data from cb func, check it out')
      res.redirect('/')
    }
  },
  (err, req, res, next) => {
    // This log will execute on authentication failure
    console.error('Authentication failed:', err || req.session.messages || 'Unknown error')
    res.redirect('/') // Redirect on failure
  }
)

export default router
