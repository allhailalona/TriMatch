import express from 'express'
import {
  startGameRoute,
  validateSetRoute,
  autoFindSetRoute,
  drawACardRoute,
  updateUserDataOnMountRoute,
  onAppStartRoute
} from './controllers/gameController.ts'
import { sendOTPRoute, validateOTPRoute, logOutRoute } from './controllers/authController.ts'
import { limiter } from './rateLimiter.ts'

const router = express.Router()

router.post('/start-game', startGameRoute)
router.post('/validate', validateSetRoute)
router.post('/auto-find-set', autoFindSetRoute)
router.post('/draw-a-card', drawACardRoute)
router.post('/send-otp', sendOTPRoute)
router.post('/validate-otp', limiter, validateOTPRoute)
router.post('/log-out', logOutRoute)
router.post('/update-user-data-on-mount', updateUserDataOnMountRoute)
router.post('/on-app-start', onAppStartRoute)

export default router
