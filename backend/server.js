import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import express from 'express'
import cors from 'cors'


//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('dirname is', __dirname)

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '..', '.env')
console.log('envPath is', envPath)

// Then specify the path of the dotenv file using config
dotenv.config({path: envPath})


// Config Express.js
//////////////////////////////////////////////////////////////////

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.post('/start-game', (req, res) => {
  console.log('hello from start-game')
  res.json({ messege: 'calling start game from main logic file'})
})

app.listen(port, () => {
  console.log('listening on port ', port)
})