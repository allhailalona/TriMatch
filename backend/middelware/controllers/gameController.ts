import { Request, Response } from 'express'
import { setGameState, getGameState } from '../../utils/redisClient.ts'
import { shuffleNDealCards } from '../../startGame.ts'
import { validate, autoFindSet, drawACard } from '../../gameLogic.ts'

import { Card } from '../../utils/backendTypes.ts'

export const startGameRoute = async (req: Request, res: Response) => {
  try {
    const boardFeed = await shuffleNDealCards() // boardFeed is still binaries here
    await setGameState('boardFeed', boardFeed) // It's here the binaries are converted to buffers!
    res.json(boardFeed)
  } catch (err) {
    console.error('Error in start-game function:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const validateRoute = async (req: Request, res: Response) => {
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
