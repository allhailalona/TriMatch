import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { setGameState, getGameState } from '../../utils/redisClient.ts'
import { shuffleNDealCards } from '../../startGame.ts'
import { validate, autoFindSet, drawACard } from '../../gameLogic.ts'
import { connect, UserModel } from '../../utils/db.ts'
import { Card, User } from '../../utils/backendTypes.ts'

export const onAppStartRoute = async (req: Request, res: Response) => {
  try {
    console.log('hello from onAppStart function')
    if (req.cookies.sessionId) {
      console.log('found cookies from prev session looking for one in Redis')
      const sessionIdEmail = await getGameState(req.cookies.sessionId)
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        res.status(401).json({ error: 'No active Redis session onAppStartRoute' })
      } 
      // If the code reached here Redis has found a key - let's fetch data from DB
      console.log('hello from onAppStart found a sessionId its email is', sessionIdEmail)
      await connect()
      const fetchedUserData: User = await UserModel.findById(sessionIdEmail)
      console.log('just fetched user data from DB:', fetchedUserData)
      res.status(200).json(fetchedUserData)
    } else {
      res.status(401).json({ error: 'No active front https-cookies session onAppStartRoute' })
    }
  } catch (err) {
    res.status(500).json({ error: `Internal Server Error: ${err.message}`})
  } finally {
    await mongoose.disconnect()
  }
}

export const startGameRoute = async (req: Request, res: Response) => {
  try {
    console.log('calling shuffleNDealCards')
    const boardFeed = await shuffleNDealCards() // boardFeed is still binaries here
    console.log('calling redis util functions')
    await setGameState('boardFeed', boardFeed) // It's here the binaries are converted to buffers!
    res.json(boardFeed)
  } catch (err) {
    console.error('Error in start-game function:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const validateSetRoute = async (req: Request, res: Response) => {
  try {
    const { selectedCards } = req.body as { selectedCards: string[] }

    const isValidSet = await validate(selectedCards)

    const toReturn: { isValidSet: boolean; boardFeed?: Card[] } = { isValidSet }

    // Return boardFeed as well if the set is valid (the boardFeed is updated)
    if (isValidSet) {
      const boardFeed = await getGameState('boardFeed')
      console.log('after update express', boardFeed)
      toReturn.boardFeed = boardFeed
    }

    res.json(toReturn)
  } catch (err) {
    console.error('Error in /validate:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const autoFindSetRoute = async (req: Request, res: Response) => {
  try {
    const { sbf } = req.body as { sbf: string[] }
    const autoFoundSet = await autoFindSet(sbf)
    res.json(autoFoundSet)
  } catch (err) {
    console.error('Error in /find-set:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const drawACardRoute = async (req: Request, res: Response) => {
  try {
    console.log('hello from draw-a-card exprress')
    await drawACard()
    const boardFeed = await getGameState('boardFeed')
    res.json(boardFeed)
  } catch (err) {
    console.error('Error in /draw-a-card:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateUserDataOnMountRoute = async (req: Request, res: Response) => {
  try {
    if (req.cookies.sessionId) {
      console.log('hello from updateUserDataOnMountRoute found cookies', req.cookies.sessionId)
      const frontUserData: User = req.body
      await connect()
      const fetchedUserData: User = await UserModel.findById(frontUserData._id) // eslint-disable-line
  
      console.log('trying to fetch sessionId from redis', frontUserData._id)
      const redisSessionId = await getGameState(req.cookies.sessionId)
      console.log('fetched sessionId from redis', redisSessionId)

      if (redisSessionId) { // If there is a value (should be an email), associated with the sessionId, we can proceed
        // Create a deep clone of fetchedUserData
        let updates = {}
    
        const stats = ['gamesPlayed', 'setsFound', 'speedrun3min', 'speedrunWholeStack'];
        stats.forEach(stat => {
          const compare = stat.includes('speedrun') ? '<' : '>';
          // JS does NOT allow conditional compare signs to be used as external varaibles... which is why we use eval - that allows us to execute strings
          if (eval(`frontUserData.stats[stat] ${compare} fetchedUserData.stats[stat]`)) {
            updates = {
              ...updates, // eslint-disable-line
              [`stats.${stat}`]: frontUserData.stats[stat]
            }
          }
        });
    
        // If you need to save the updated data back to the database, do so here
        if (Object.keys(updates).length > 0) {
          console.log('detected changes in updates updating database')
          await UserModel.updateOne({_id: frontUserData._id}, {$set: updates})
        }
        res.status(200).json({ message: 'User data updated successfully' });
      } else {
        console.log('no redis sessionId found')
        res.status(401).json({ error: 'No Redis sessionId found' })
      }
    } else {
      res.status(401).json({ error: 'No front https-cookies found' })
    }

  } catch (err) { 
    console.error('Error in /update-user-data-onmount:', err)
    res.status(500).json({ error: 'Internal server error' })
  }

}
 