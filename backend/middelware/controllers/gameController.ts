import { Request, Response } from "express";
import {
  setGameState,
  getGameState,
  startTimer,
} from "../../utils/redisClient.js";
import { handleClassicGameIsOver } from "../../utils/ClassicWholeStackIsOverUtil.js";
import { shuffleNDealCards } from "../../startGame.js";
import { validate, autoFindSet, drawACard } from "../../gameLogic.js";
import { GameStateKeys } from "../../types.js";

export const startGameRoute = async (req: Request, res: Response) => {
  try {
    let toReturn = {};

    // Step 1: Store session in front if it was determined by sessionMiddleware.ts
    if (req.createdSession) {
      console.log("created a new temp guest session req.sessoinId is", req.sessionId);
      if (req.headers["x-source"] === "web") { // Expo does not have cookies
        console.log('request came from web')
        res.cookie("sessionId", req.sessionId, {
          httpOnly: true,
          secure: true, // Set to true when in prod mode! It won't work otherwise!
          sameSite: "none",
          maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
        });
      } else if (req.headers["x-source"] === "expo") { // Return it to store in expo-secure-store
        console.log("passing to expo req.sessionId is", req.sessionId);
        toReturn = { ...toReturn, sessionId: req.sessionId };
      } else { // That's for debugging
        console.log('thats neither a web neither an expo session, u shouldnt be here something went wrong')
      }
    }

    // Step 2: Initialize clear game state according the game mode
    console.log("req.gameMode is", req.query.gameMode);
    if (req.query.gameMode === "1") {
      // Compare with string
      console.log(
        "game mode is classic whole stack sessionId is",
        req.sessionId,
      );
      await setGameState(
        `${req.sessionId}:gameMode` as GameStateKeys,
        "classic",
      );
      await setGameState(
        `${req.sessionId}:stopwatch` as GameStateKeys,
        new Date(),
      );
    } else if (req.query.gameMode === "2") {
      // Compare with string
      console.log("game mode is 3min speedrun");
      await setGameState(
        `${req.sessionId}:gameMode` as GameStateKeys,
        "3minSpeedRun",
      );
      await setGameState(`${req.sessionId}:setsFound` as GameStateKeys, 0);

      // Pass email as well if the sessionId is of a logged in user
      if (req.sessionIdEmail) {
        startTimer(180000, req.sessionId, req.sessionIdEmail); // 3 minutes
      } else {
        startTimer(180000, req.sessionId, null); // 3 minutes
      }
    } else {
      console.error("u shouldnt be here something is wrong");
    }

    // Step 3: Prepare the cards
    console.log("calling shuffleNDealCards with sessinId", req.sessionId);
    const boardFeed = await shuffleNDealCards(req.sessionId); // boardFeed is still binaries here - Pass sessionId here
    console.log("now storing boardFeed in Redis");
    await setGameState(`${req.sessionId}:boardFeed`, boardFeed); // It's here the binaries are converted to buffers!

    toReturn = { ...toReturn, boardFeed };
    res.json(toReturn);
  } catch (err) {
    console.error(
      "Error in start-game function:",
      err instanceof Error ? err.message : String(err),
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const validateSetRoute = async (req: Request, res: Response) => {
  try {
    const { selectedCards } = req.body as { selectedCards: string[] };
    console.log("hello validateSetRoute sessionId is", req.sessionId);
    const isValidSet = await validate(selectedCards, req.sessionId); // Include sessionId to access the correct game state
    console.log("isValidSet is", isValidSet);
    const boardFeed = await getGameState(`${req.sessionId}:boardFeed`); // Fetch boardFeed from redis to pass to front to prevent cheating

    let toReturn = {};

    console.log("checking game mode and start conditionals if classic");
    const gameMode = await getGameState(`${req.sessionId}:gameMode`);

    // If game mode is classic (1) check for length then run autoFindSet otherwise just return the validity and boardFeed and continue playing
    if (gameMode === "classic") {
      const classicGameReturnValue = await handleClassicGameIsOver(
        toReturn,
        req.sessionId,
        boardFeed,
        req.sessionIdEmail || "", // Add fallback for undefined
        (req.headers["x-source"] as string) || "",
        isValidSet,
      );
      // Clear cookies here if isGuest is true
      if (classicGameReturnValue.isGuest) {
        console.log("u are a guest, clearing cookies");
        res.clearCookie("sessionId");
      } else {
        console.log("u are not a guest, doing nothing");
      }
      toReturn = { ...toReturn, ...classicGameReturnValue.toReturn };
    } else if (gameMode == "3minSpeedRun") {
      // That's not a classic mode game the entire conditional is irrelevant!
      console.log("game mode is 3min speedrun increment sets found");
      let setsFound = await getGameState(`${req.sessionId}:setsFound`);
      setsFound++;
      await setGameState(`${req.sessionId}:setsFound`, setsFound);
      toReturn = { ...toReturn, isValidSet, boardFeed }; // Continue playing
    } else {
      console.log(
        "game mode is not classic neither 3min speedrun nothing happens now!",
      );
      toReturn = { ...toReturn, isValidSet, boardFeed }; // Just return the validity of the Set with an updated boardFeed as an anticheat measure
    }

    console.log("done with everything toReturn is", toReturn);
    res.status(200).json(toReturn);
  } catch (err) {
    console.error("Error in /validate:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const autoFindSetRoute = async (req: Request, res: Response) => {
  try {
    console.log('hello from autoFindSet route req.sessionId is', req.sessionId)
    const sbfString = req.query.sbf as string;
    console.log("sbfString is", sbfString);

    if (!sbfString) {
      return res.status(400).json({ error: "Missing sbf parameter" });
    }

    // Convert the comma-separated string back to an array
    const sbf = sbfString.split(",");
    console.log("about to send the following to autoFindSet", sbf);

    console.log('calling autoFoundSet')
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
