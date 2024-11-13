import { Request, Response } from "express";
import mongoose from "mongoose";
import { delGameState, setGameState, getGameState } from "../../utils/redisClient.ts";
import { shuffleNDealCards } from "../../startGame.ts";
import { validate, autoFindSet, drawACard } from "../../gameLogic.ts";
import { connect, UserModel } from "../../utils/db.ts";
import { User, Theme } from "../../utils/types.ts";

export const onMountFetchRoute = async (req: Request, res: Response) => {
  try {
    console.log("hello from onMountFetch entering three-way conditional");
    // Scenario 1- Check for manually stored cookies, since expo go works with cookies as well, we need to make sure the rqeuest did not come from web by including a header
    if (req.cookies.sessionId && req.headers["x-source"] !== "expo") {
      console.log(
        "scenario 1 - found manually stored cookies - request came from web:",
        req.cookies,
      );
      const sessionIdEmail = await getGameState(req.cookies.sessionId);
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        return res.status(401).json({
          error:
            "No active Redis session onMountFetchRoute, it also means there is no active express-session session",
        });
      } else if (sessionIdEmail === 'guest') {
        // The sessionId found belogns to a guest there is nothing to retieve from DB
        return res.status(401).json({
          error:
            "The sessionId found belogns to a guest there is nothing to retieve from DB",
        });
      }
      
      await connect();
      const fetchedUserData: User | null =
        await UserModel.findById(sessionIdEmail);
      return res.status(200).json(fetchedUserData);
      // } else if (req.session.passport._id) { // Check for auth stored cookies (with express session) CURRENTLY NOT FUNCTIONAL!
      //   console.log("scenario 2 - found auto stored express-session data:", req.session);
      //   const userEmail = req.session.email;
      //   console.log("the session email is", userEmail);
      //   await connect();
      //   const fetchedUserData: User | null = await UserModel.findById(userEmail);
      //   console.log(
      //     "Fetched user data from DB using express-session:",
      //     fetchedUserData,
      //   );
      //   res.status(200).json(fetchedUserData); // Returning fetched data to front with a 'success' message
    } else if (req.query.sessionId && req.headers["x-source"] === "expo") {
      // Check if sessionId is coming from expo-secure-store
      // Check if sessionId is included in redis, and extract email
      console.log("Scenario 3- Expo credentials were found:", req.query.sessionId);
      const sessionIdEmail = await getGameState(req.query.sessionId);
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        console.log('scneario three no redis session found at all')
        return res.status(401).json({
          error:
            "No active Redis session onMountFetchRoute, it also means there is no active express-session session",
        });
      } else if (sessionIdEmail === 'guest') {
        // The sessionId found belogns to a guest there is nothing to retieve from DB
        console.log('hello sync with server - found a redis session but  it belongs to a guest... hence there is no data to fetch from DB')
        return res.status(401).json({
          error:
            "The sessionId found belogns to a guest there is nothing to retieve from DB",
        });
      }

      await connect();
      const fetchedUserData: User | null =
        await UserModel.findById(sessionIdEmail);
      return res.status(200).json(fetchedUserData);
    } else {
      // Coulnd't find an active session whatsoever
      console.log("no condition was met");
      return res
        .status(401)
        .json({ error: "No manual or express-session session found" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${err.message}` });
  } finally {
    await mongoose.disconnect();
  }
};

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
      await setGameState(`${req.sessionId}:gameMode`, '3min speedrun') // For clarity and readability
      await setGameState(`${req.sessionId}:timer`, 'expires in 3min', 180) // The actual content of the key is irrelevant, its' the expiry that matters
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
    const boardFeed = await getGameState(`${req.sessionId}:boardFeed`); // Fetch boardFeed from redis to pass to front to prevent cheating

    let toReturn = {}

    console.log('checking game mode and start conditionals if classic')
    const gameMode = await getGameState(`${req.sessionId}:gameMode`)
    
    // If game mode is classic (1) check for length then run autoFindSet otherwise just return the validity and boardFeed and continue playing
    if (gameMode === 'classic') {
      console.log('gameMode IS classic checking length of shuffledStack and boardFeed')
      const shuffledStack = await getGameState(`${req.sessionId}:shuffledStack`)
      console.log('length of boardFeed and shuffledStack is', boardFeed.length + shuffledStack.length)

      // If there are still sets there is no need to stop the game
      if (shuffledStack.length + boardFeed.length <= 21) { // A game with more than 21 cards will ALWAYS contain a set
        console.log('total available cards are below 21 - its possible that no more sets are present - checking with autoFindSet')

        // Refactor available cards to check for existing sets
        const availCardsRaw = [...boardFeed, ...shuffledStack]
        const availCardsIdOnly = availCardsRaw.map((card: Theme) => card._id)
        console.log('availCardsIdOnly is', availCardsIdOnly)

        const setFound = await autoFindSet(availCardsIdOnly) // The autoFindSets will start after we know there might be a board with NO SETS 

        if (setFound) { // If the board has a set, the game is not over yet... dont start with the 'broken record' logic
          // Simply do nothing let the toReturn logic after the conditional continue
          console.log('a set was found, the game continues, nothing happens')
        } else { // Game Over!
          console.log('a set wasnt found, declare game over - stopping stopwatch then checking for new records')
          // A. Stop the stopwatch and get time result
            // Convert both times to milliseconds for comparison
            const startingTime: number = new Date(await getGameState(`${req.sessionId}:stopwatch`)).getTime()
            console.log('starting time is', startingTime)

            const currentTime: number = new Date().getTime()
            console.log('current time is', currentTime)

            // Explicit conversion to ms with getTime()
            const timeDiff: number = currentTime - startingTime
            console.log('timeDiff is', timeDiff)

            // Convert to seconds - newScore is the final time result
            const newScore: number = Math.floor(timeDiff / 1000)

          // B. Check if record is broken - is new score lower than previous score
            if (req.sessionIdEmail) {
              // Since this is an id user session - Show result in front AND check if record was broken
              console.log('thats an id session, lets check if record was broken for user', req.sessionIdEmail)

              // Connect to DB then compare with newScore
              await connect()
              const prevRecord = (await UserModel.findById(req.sessionIdEmail))!.stats.speedrunWholeStack

              console.log('current score is', newScore)
              console.log('users previous record is', prevRecord)

              if (prevRecord > newScore) { // If record was broken
                // Record was broken, update DB then pass score to front
                console.log('broken record congrats! updating DB')
                await UserModel.findByIdAndUpdate(req.sessionIdEmail, { "stats.speedrunWholeStack": newScore })
                toReturn = {...toReturn, isRecordBroken: true, newScore}
              } else {
                // Record was not broken, pass score to front only
                // Note that isRecordBroken is included so the user can know the system IS AWARE that is he's logged in and could break a record
                console.log('no record was broken doing nothing')
                toReturn = {...toReturn, isRecordBroken: false, newScore}
              }
            } else {
              // Only show result in front
              console.log('thats a guest session, lets only pass data to front')
              // Remove guest auth as well (logged in user sessionId persists between games)
              delGameState(req.sessionId)
              // Remove cookies/expo-secure-store
              console.log('request is coming from', req.headers['x-source'])
              if (req.headers['x-source'] !== 'expo') {
                // The request IS NOT coming from expo let's remove cookies
                res.clearCookie('sessionId'); 
              } // Else the sessionId is removed from expo in expo files
              toReturn = {...toReturn, /*no isRecordBroken since thats a guest session*/ newScore} // This time the user cannot break a record since he's a guest
            }

            // Remove those regardless of the session type - guest/logged in user - the front sessionId will only be removed if the session type is guest
            await Promise.all([
              delGameState(`${req.sessionId}:boardFeed`),
              delGameState(`${req.sessionId}:shuffledStack`),
              delGameState(`${req.sessionId}:bin`)
              delGameState(`${req.sessionId}:gameMode`)
            ])

        }      
      } else { // The game is not over yet there are still sets to find!
        console.log('there are still sets to find classic game continues!')
        toReturn = {...toReturn, isValidSet, boardFeed} // Just return the validity of the Set with an updated boardFeed as an anticheat measure
      }
    } else { // That's not a classic mode game the entire conditional is irrelevant!
      console.log('game mode is not classic nothing happens now!')
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

export const syncWithServerRoute = async (req: Request, res: Response) => {
  try {
    const userData = req.body
    const frontSessionId =
      req.headers["x-source"] === "expo"
        ? req.body.sessionId
        : req.cookies.sessionId
    if (!frontSessionId) {
      return res.status(401).json({ error: "No valid session found" });
    }

    let userEmail: string = "";
    if (frontSessionId) {
      userEmail = await getGameState(frontSessionId);

      if (!userEmail) {
        console.log("no sessionId found in redis");
        return res.status(401).json({ error: "Invalid session" });
      }
    }

    await connect();
    const fetchedUserData: User | null = await UserModel.findById(userEmail);
    if (!fetchedUserData) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};
    const stats = ["gamesPlayed", "setsFound"];
    stats.forEach((stat) => {
      if (userData.stats[stat] > fetchedUserData.stats[stat]) {
        updates[`stats.${stat}`] = userData.stats[stat];
      }
    });

    if (Object.keys(updates).length > 0) {
      await UserModel.updateOne({ _id: userData._id }, { $set: updates });
    }

    res.status(200).json({ message: "User data updated successfully" });
  } catch (err) {
    console.error("Error in syncWithServerRoute", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
