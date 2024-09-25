import fs from 'fs/promises'
import os from 'os'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '../..', '.env')

// Then specify the path of the dotenv file using config
dotenv.config({ path: envPath })

// Declare schema
//////////////////////////////////////////////////////////////////
const ThemeSchema = new mongoose.Schema({
  _id: String,
  cards: [
    {
      _id: String,
      image: Buffer
    }
  ]
})

// Create model
const ThemeModel = mongoose.model(null, ThemeSchema, 'Themes') // 'themes' specifies the collection name

async function genThemesArr() {
  try {
    // Get path to desktop
    const desktopPath = path.join(os.homedir(), 'Desktop')

    // Join it with Exports Folder
    const exportsFolderPath = path.join(desktopPath, 'Exports Folder')

    // Read folder and get files
    const files = await fs.readdir(exportsFolderPath)

    // Iterate through the files and create card objects
    const cards = await Promise.all(
      files.map(async (file) => {
        // Get path for current file
        const filePath = path.join(exportsFolderPath, file)

        // Read its contents
        const image = await fs.readFile(filePath)

        // Create an object for each - name is image name and image is image content
        return {
          _id: path.basename(file, path.extname(file)),
          image: image
        }
      })
    )

    return cards
  } catch (err) {
    throw err
  }
}

// Validate passcode to mongoDB
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables')
  process.exit(1)
}

// Upload to mongoDB
async function uploadArr() {
  try {
    const res = await genThemesArr()
    console.log('res is ', res)

    const themeToInsert = {
      _id: 'ClassicTheme',
      cards: res
    }

    console.log('length of cards is', themeToInsert.cards.length)

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('connected to MongoDB')

    // Delete prev content to prepare for overwrite
    // Attention is required here since the code is not working
    await ThemeModel.deleteMany({})

    // Now insert content to blank DB
    await ThemeModel.insertMany(themeToInsert)
    console.log('inserting completed!')
  } catch (err) {
    throw err
  } finally {
    await mongoose.disconnect()
    console.log('disconnected from MongoDB')
  }
}

console.log('calling uploadArr')
await uploadArr()
