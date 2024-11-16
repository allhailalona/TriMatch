import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { setGameState, getGameState } from "../../utils/redisClient.js";

export const handleGameSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log('hello from sessionMiddleware')
  try {
    // Parse sessionId from cookies - ensure it's a string
    const sessionId =
      req.cookies.sessionId /* for web reqs */ ||
      req.query.sessionId /* for mobile reqs */ ||
      undefined;

    console.log("hello middleware sessionId is", sessionId);
    if (sessionId) {
      // If a sessionId from the front was found
      console.log("hello handleGameSession found session id in front");

      // Validate session in Redis - will return an email or guest
      const redisSessionType = await getGameState(sessionId);

      // 2 options for a validated redis sessoinId:
      if (redisSessionType && redisSessionType !== "guest") {
        // a. session includes an email which is return to listener to modify the DB
        console.warn(
          "redis session is validated type is email:",
          redisSessionType,
        );
        req.sessionIdEmail = redisSessionType; // This will be used for checking new records
        req.sessionId = sessionId; // This is for accessing redis temp game data
        return next();
      } else if (redisSessionType === "guest") {
        // b. session includes 'guest', and only requires validation to change temp redis game keys
        console.warn("redis session is validated type is guest");
        req.sessionId = sessionId; // This is for accessing redis temp game data
        return next();
      } else {
        // In case no redis session was found - user is unauthorized
        console.warn(
          "middleware func no redis session found - most likely hacker alert return ",
        );
        return res
          .status(401)
          .json({ error: "no redis session found - user is unauthorized" });
      }
    } else {
      // Again the conditional is not strictly necessary but used for improved readability
      console.warn(
        "no sessionId was found in front, creating a temp guest sessionId if the request came from start game...",
      );
      // Handle new game sessions
      if (req.headers["x-request-origin"] === "/start-game") {
        const newSessionId = await createSession("guest");

        req.createdSession = true; // So we know to store the new session
        req.sessionId = newSessionId; // The newly created sessionId
        return next();
      } else {
        console.warn(
          "the request was not sent from start-game, most likely since a game was not started and some smart ass decided to manually call express....",
        );
      }
    }
  } catch (error) {
    // That's general error handling, irrelevant to the conditionals above...
    console.error("Session handling error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createSession = async (reqType: string): Promise<string> => {
  // Generate session ID
  const sessionId: string = crypto.randomBytes(18).toString("hex").slice(0, 36);

  // The key below will be deleted on iduser logout and on guest users end of game
  await setGameState(sessionId, reqType);
  console.log('redis session is', await getGameState(sessionId))

  return sessionId; // Return to be used in start game state creation or in the cookies/expo-secure-store
};
