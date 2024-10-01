import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { setGameState, getGameState } from '../../utils/redisClient.ts'
import { shuffleNDealCards } from '../../startGame.ts'
import { validate, autoFindSet, drawACard } from '../../gameLogic.ts'
import { connect, UserModel } from '../../utils/db.ts'
import { Card, User } from '../../utils/backendTypes.ts'

export const onMountFetchRoute = async (req: Request, res: Response) => {
  try {
    console.log('hello from onAppStart function')
    if (req.cookies.sessionId) { // Check for data in manual Redis storage
      console.log('found cookies from prev session looking for a match in Redis')
      const sessionIdEmail = await getGameState(req.cookies.sessionId)
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        res.status(401).json({ error: 'No active Redis session onMountFetchRoute, it also means there is no active express-session session' })
      } 
      // Each sessionId is asc with an email, which is used (if validated) to fetch the correct data from the DB
      console.log('hello from onAppStart found a sessionId its email is', sessionIdEmail)
      await connect()
      const fetchedUserData: User = await UserModel.findById(sessionIdEmail)
      console.log('just fetched user data from DB:', fetchedUserData)
      res.status(200).json(fetchedUserData)
    } else if (req.session && Object.keys(req.session).length > 0) { // Check for data in express-session Redis storage
      // Check for data in express-session Redis storage
      console.log('Found express-session data:', req.session)
      console.log('trying to fetch the email asc with this sessionId')
      const userEmail = req.session.email
      console.log('the session email is', userEmail)
      if (userEmail) {
        await connect()
        const fetchedUserData: User = await UserModel.findById(userEmail)
        console.log('Fetched user data from DB using express-session:', fetchedUserData)
        res.status(200).json(fetchedUserData) // Returning fetched data to front with a 'success' message
      } else {
        
      }
    } else { // Coulnd't find an active session whatsoever
      res.status(401).json({ error: 'No manual or express-session session found' })
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

export const syncWithServerRoute = async (req: Request, res: Response) => {
  try {
    const activeSession = req.cookies.sessionId || req.session || null;
    if (!activeSession) {
      return res.status(401).json({ error: 'No valid session found' });
    }

    if (req.cookies.sessionId) {
      const redisSessionId = await getGameState(req.cookies.sessionId);
      if (!redisSessionId) {
        return res.status(401).json({ error: 'Invalid session' });
      }
    }

    const frontUserData: User = req.body;
    if (!frontUserData || !frontUserData._id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    await connect();
    const fetchedUserData: User = await UserModel.findById(frontUserData._id);
    if (!fetchedUserData) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updates = {};
    const stats = ['gamesPlayed', 'setsFound', 'speedrun3min', 'speedrunWholeStack'];
    stats.forEach(stat => {
      const compare = stat.includes('speedrun') ? '<' : '>';
      if (eval(`frontUserData.stats[stat] ${compare} fetchedUserData.stats[stat]`)) {
        updates[`stats.${stat}`] = frontUserData.stats[stat];
      }
    });

    if (Object.keys(updates).length > 0) {
      await UserModel.updateOne({_id: frontUserData._id}, {$set: updates});
    }

    res.status(200).json({ message: 'User data updated successfully' });
  } catch (err) { 
    console.error('Error in syncWithServerRoute', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
 