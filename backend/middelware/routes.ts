import express from 'express'
import {
  startGameRoute,
  validateRoute,
  autoFindSetRoute,
  drawACardRoute
} from './controllers/gameController.ts'
import { sendOTPRoute, validateOTPRoute, logOutRoute } from './controllers/authController.ts'
import { limiter } from './rateLimiter.ts'

const router = express.Router()

router.post('/start-game', startGameRoute)
router.post('/validate', validateRoute)
router.post('/auto-find-set', autoFindSetRoute)
router.post('/draw-a-card', drawACardRoute)
router.post('/send-otp', sendOTPRoute)
router.post('/validate-otp', limiter, validateOTPRoute)
router.post('/log-out', logOutRoute)

export default router
