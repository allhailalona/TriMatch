import { Request, Response } from "express";
import { setGameState, getGameState, startTimer } from "../../utils/redisClient.ts";
import { handleClassicGameIsOver } from '../../utils/ClassicWholeStackIsOverUtil.ts'
import { shuffleNDealCards } from "../../startGame.ts";
import { validate, autoFindSet, drawACard } from "../../gameLogic.ts";

export const startGameRoute = async (req: Request, res: Response) => {
  try {
    let toReturn = {}

    // Store session in cookies for web version or pass to front to store in expo-secure-store for mobile
    if (req.createdSession) { // Store data if sessionId was just created
      console.log('created a new temp guest session')
      if (req.headers['x-source'] === 'web') {
        res.cookie('sessionId', req.sessionId, {
          httpOnly: true,
          secure: false, // Set this to true when in prod mode
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
        });
      } else if (req.headers['x-source'] === 'expo') {
        console.log('passing to expo req.sessionId is', req.sessionId)
        toReturn = {...toReturn, sessionId: req.sessionId}
      }
    } 

    // Start stopwatch/timer according to game mode
    console.log('req.gameMode is', req.query.gameMode)
    if (req.query.gameMode == 1) {
      console.log('game mode is classic whole stack sessionId is', req.sessionId) 
      await setGameState(`${req.sessionId}:gameMode`, 'classic') // For clarity and readability
      await setGameState(`${req.sessionId}:stopwatch`, new Date()) // Get timestamp to compare with when game is over and/or show result in front
    } else if (req.query.gameMode == 2) {
      console.log('game mdoe is 3min speedrun')
      await setGameState(`${req.sessionId}:gameMode`, '3minSpeedRun') // For clarity and readability
      await setGameState(`${req.sessionId}:setsFound`, 0) // Reset sets found count for a new game 
      
      // Pass email as well if the sessionId is of a logged in user
      if (req.sessionIdEmail) {
        startTimer(180000, req.sessionId, req.sessionIdEmail) // 3 minutes
      } else {
        startTimer(180000, req.sessionId, null) // 3 minutes
      }
    } else {
      console.error('u shouldnt be here something is wrong')
    }

    // Prepare game
    console.log("calling shuffleNDealCards with sessinId", req.sessionId );
    const boardFeed = await shuffleNDealCards(req.sessionId); // boardFeed is still binaries here - Pass sessionId here 
    console.log('now storing boardFeed in Redis')
    await setGameState(`${req.sessionId}:boardFeed`, boardFeed); // It's here the binaries are converted to buffers!
    
    toReturn = {...toReturn, boardFeed}
    res.json(toReturn);
  } catch (err) {
    console.error("Error in start-game function:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const validateSetRoute = async (req: Request, res: Response) => {
  try {
    const { selectedCards } = req.body as { selectedCards: string[] };
    console.log('hello validateSetRoute sessionId is', req.sessionId)
    const isValidSet = await validate(selectedCards, req.sessionId); // Include sessionId to access the correct game state
    console.log('isValidSet is', isValidSet)
    const boardFeed = await getGameState(`${req.sessionId}:boardFeed`); // Fetch boardFeed from redis to pass to front to prevent cheating

    let toReturn = {}

    console.log('checking game mode and start conditionals if classic')
    const gameMode = await getGameState(`${req.sessionId}:gameMode`)
    
    // If game mode is classic (1) check for length then run autoFindSet otherwise just return the validity and boardFeed and continue playing
    if (gameMode === 'classic') {
      const classicGameReturnValue = await handleClassicGameIsOver(toReturn, req.sessionId, boardFeed, req.sessionIdEmail, req.headers['x-source'], isValidSet)
      // Clear cookies here if isGuest is true
      if (classicGameReturnValue.isGuest) {
        console.log('u are a guest, clearing cookies')
        res.clearCookie('sessionId');
      } else {
        console.log('u are not a guest, doing nothing')
      }
      toReturn = {...toReturn, ...classicGameReturnValue.toReturn}
    } else if (gameMode == '3minSpeedRun') { // That's not a classic mode game the entire conditional is irrelevant!
      console.log('game mode is 3min speedrun increment sets found')
      let setsFound = await getGameState(`${req.sessionId}:setsFound`)
      setsFound ++
      await setGameState(`${req.sessionId}:setsFound`, setsFound)
      toReturn = {...toReturn, isValidSet, boardFeed} // Continue playing
    } else {
      console.log('game mode is not classic neither 3min speedrun nothing happens now!')
      toReturn = {...toReturn, isValidSet, boardFeed} // Just return the validity of the Set with an updated boardFeed as an anticheat measure
    }

    console.log('done with everything toReturn is', toReturn)
    res.status(200).json(toReturn);
  } catch (err) {
    console.error("Error in /validate:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const autoFindSetRoute = async (req: Request, res: Response) => {
  try {
    const sbfString = req.query.sbf as string;
    console.log("sbfString is", sbfString);

    if (!sbfString) {
      return res.status(400).json({ error: "Missing sbf parameter" });
    }

    // Convert the comma-separated string back to an array
    const sbf = sbfString.split(",");
    console.log('about to send the following to autoFindSet', sbf)

    const autoFoundSet = await autoFindSet(sbf);
    console.log("autoFoundSet is", autoFoundSet);
    res.status(200).json(autoFoundSet);
  } catch (err) {
    console.error("Error in /auto-find-set:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const drawACardRoute = async (req: Request, res: Response) => {
  try {
    console.log("hello from draw-a-card express sessionId is", req.sessionId);
    await drawACard(req.sessionId); // Draw a card is modding the boardFeed so we need sessionId
    const boardFeed = await getGameState(`${req.sessionId}:boardFeed`); // Again, and anti cheat measure- the redis state is always the one we see in front!
    res.json(boardFeed);
  } catch (err) {
    console.error("Error in /draw-a-card:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
