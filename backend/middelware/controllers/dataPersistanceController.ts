import { Request, Response } from "express";
import mongoose from "mongoose";
import { getGameState } from "../../utils/redisClient.js";
import { connect, UserModel } from "../../utils/db.js";
import { User, GameStateKeys, StatsKeys, MongoUpdates } from "../../types.js";

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
      } else if (sessionIdEmail === "guest") {
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
      console.log(
        "Scenario 3- Expo credentials were found:",
        req.query.sessionId,
      );
      const sessionIdEmail = await getGameState(
        `${req.query.sessionId as string}:sessionId` as GameStateKeys,
      );
      if (!sessionIdEmail) {
        // Redis couldnt find a key that corresponds to sessionId
        console.log("scneario three no redis session found at all");
        return res.status(401).json({
          error:
            "No active Redis session onMountFetchRoute, it also means there is no active express-session session",
        });
      } else if (sessionIdEmail === "guest") {
        // The sessionId found belogns to a guest there is nothing to retieve from DB
        console.log(
          "hello sync with server - found a redis session but  it belongs to a guest... hence there is no data to fetch from DB",
        );
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
    return res.status(500).json({
      error: `Internal Server Error: ${err instanceof Error ? err.message : String(err)}`,
    });
  } finally {
    await mongoose.disconnect();
  }
};

export const syncWithServerRoute = async (req: Request, res: Response) => {
  try {
    const userData = req.body; // Use redis data to check for new records! not the front data! fix this

    const frontSessionId =
      req.headers["x-source"] === "expo"
        ? req.body.sessionId
        : req.cookies.sessionId;

    if (!frontSessionId) {
      return res.status(401).json({ error: "No valid session found" });
    }

    let userEmail = "";
    const sessionData = await getGameState(
      `${frontSessionId}:sessionId` as GameStateKeys,
    );
    if (!sessionData) {
      console.log("no sessionId found in redis");
      return res.status(401).json({ error: "Invalid session" });
    }
    userEmail = sessionData;

    await connect();
    const fetchedUserData = await UserModel.findById(userEmail);
    if (!fetchedUserData) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates: MongoUpdates = {};
    const stats: StatsKeys[] = ["gamesPlayed", "setsFound"];

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
    console.error(
      "Error in syncWithServerRoute",
      err instanceof Error ? err.message : String(err),
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
