import { Request, Response } from "express";
import mongoose from "mongoose";
import { setGameState, getGameState } from "../../utils/redisClient.ts";
import { shuffleNDealCards } from "../../startGame.ts";
import { validate, autoFindSet, drawACard } from "../../gameLogic.ts";
import { connect, UserModel } from "../../utils/db.ts";
import { Card, User } from "../../utils/types.ts";

export const onMountFetchRoute = async (req: Request, res: Response) => {
  try {
    console.log('hello from onMountFetch entering three-way conditional')
    // Scenario 1- Check for manually stored cookies, since expo go works with cookies as well, we need to make sure the rqeuest did not come from web by including a header
    if (req.cookies.sessionId && req.headers['x-source'] !== 'expo') {
      console.log('scenario 1 - found manually stored cookies - request came from web:', req.cookies)
      const sessionIdEmail = await getGameState(req.cookies.sessionId);
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        return res.status(401).json({
          error:
            "No active Redis session onMountFetchRoute, it also means there is no active express-session session",
        });
      }
      await connect();
      const fetchedUserData: User | null = await UserModel.findById(sessionIdEmail);
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
    } else if (req.query.sessionId && req.headers['x-source'] === 'expo') { // Check if sessionId is coming from expo-secure-store
      // Check if sessionId is included in redis, and extract email
      console.log('Scenario 3- Expo credentials were found')
      const sessionIdEmail = await getGameState(req.query.sessionId);
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        return res.status(401).json({
          error:
            "No active Redis session onMountFetchRoute, it also means there is no active express-session session",
        });
      }
      await connect();
      const fetchedUserData: User | null = await UserModel.findById(sessionIdEmail);
      return res.status(200).json(fetchedUserData);
    } else {
      // Coulnd't find an active session whatsoever
      console.log('no condition was met')
      return res.status(401).json({ error: "No manual or express-session session found" });
    }
  } catch (err) {
    return res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  } finally {
    await mongoose.disconnect();
  }
 };

export const startGameRoute = async (req: Request, res: Response) => {
  try {
    console.log("calling shuffleNDealCards");
    const boardFeed = await shuffleNDealCards(); // boardFeed is still binaries here
    console.log("calling redis util functions");
    await setGameState("boardFeed", boardFeed); // It's here the binaries are converted to buffers!
    res.json(boardFeed);
  } catch (err) {
    console.error("Error in start-game function:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const validateSetRoute = async (req: Request, res: Response) => {
  try {
    const { selectedCards } = req.body as { selectedCards: string[] };

    const isValidSet = await validate(selectedCards);
    const boardFeed = await getGameState('boardFeed')

    console.log('express board feed is', boardFeed)

    // Provide the stored value of boardFeed regardless of the set's validity
    const toReturn: { isValidSet: boolean; boardFeed: Card[] } = {
      isValidSet,
      boardFeed
    };

    res.json(toReturn);
  } catch (err) {
    console.error("Error in /validate:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const autoFindSetRoute = async (req: Request, res: Response) => {
  try {
    const sbfString = req.query.sbf as string;
    console.log('sbfString is', sbfString)
    
    if (!sbfString) {
      return res.status(400).json({ error: 'Missing sbf parameter' });
    }

    // Convert the comma-separated string back to an array
    const sbf = sbfString.split(',');

    const autoFoundSet = await autoFindSet(sbf);
    console.log('autoFoundSet is', autoFoundSet)
    res.status(200).json(autoFoundSet);
  } catch (err) {
    console.error("Error in /auto-find-set:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const drawACardRoute = async (req: Request, res: Response) => {
  try {
    console.log("hello from draw-a-card exprress");
    await drawACard();
    const boardFeed = await getGameState("boardFeed");
    res.json(boardFeed);
  } catch (err) {
    console.error("Error in /draw-a-card:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const syncWithServerRoute = async (req: Request, res: Response) => {
  try {
    // console.log('req.body is', req.body)
    const userData = req.body['userData']
    console.log('syncWithServer user data is', userData)
    const frontSessionId = req.headers['x-source'] === 'expo' ? req.body.sessionId : req.cookies.sessionId || req.session /* Currently unsupported */
    console.log('front sessionId is', frontSessionId)
    if (!frontSessionId) {
      return res.status(401).json({ error: "No valid session found" });
    }

    let userEmail: string = ''
    if (frontSessionId) {
      console.log('active cookie session found:', frontSessionId, 'comparing sessionId with redis sessionId')
      userEmail = await getGameState(frontSessionId);
      console.log('comparison successful! userEmail is', userEmail)

      if (!userEmail) {
        console.log('no sessionId found in redis')
        return res.status(401).json({ error: "Invalid session" });
      }
    }

    await connect();
    const fetchedUserData: User | null = await UserModel.findById(userEmail);
    if (!fetchedUserData) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log('fetchedUserData is', fetchedUserData)

    const updates = {};
    const stats = [
      "gamesPlayed",
      "setsFound",
      "speedrun3min",
      "speedrunWholeStack",
    ];
    stats.forEach((stat) => {
      const compare = stat.includes("speedrun") ? "<" : ">";
      if (
        eval(`userData.stats[stat] ${compare} fetchedUserData.stats[stat]`)
      ) {
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
