import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import routes from './routes.ts'
import { limiter } from './rateLimiter.ts'

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

const app = express()
const port = process.env.PORT

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
)
app.use(express.json())
app.use(limiter)
app.use(cookieParser())

app.use('/', routes)

app.listen(port, () => {
  console.log('listening on port', port)
})
