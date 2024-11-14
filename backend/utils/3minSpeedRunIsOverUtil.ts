import { getGameState, delGameState } from "./redisClient.js";
import { connect, UserModel } from "./db.js";
import { io } from "../middelware/server.js";

export async function handleTimeIsUp(sessionId: string, userEmail: string) {
  console.log("game is over time is up sessionId is", sessionId);
  const setsFound = await getGameState(`${sessionId}:setsFound`);
  console.log("total sets found are", setsFound);

  let toReturn = {};

  // Fetch prev record from DB if the user is logged in (only then a record can be broken)
  console.log("user EMAIL IS", userEmail);
  if (!userEmail) {
    console.log("u are not logged in passing data to front");
    toReturn = { ...toReturn, setsFound }; // isBrokenRecord is NOT present since that's a guest session
  } else {
    console.log("u are logged in checking for new record");
    await connect();
    const prevRecord = (await UserModel.findById(userEmail))!.stats
      .speedrun3min;

    console.log("prev record is", prevRecord);
    console.log("and current score is", setsFound);

    // Check if record is broken
    if (prevRecord < setsFound) {
      console.log("u are logged in record was broken congrats!");
      await UserModel.findByIdAndUpdate(userEmail, {
        "stats.speedrun3min": setsFound,
      });
      toReturn = { ...toReturn, isRecordBroken: true, setsFound };
    } else {
      console.log("u are logged in but no record was brokne");
      toReturn = { ...toReturn, isRecordBroken: false, setsFound };
    }
  }

  // Remove those regardless of the session type - guest/logged in user - the front sessionId will only be removed if the session type is guest
  await Promise.all([
    delGameState(`${sessionId}:boardFeed`),
    delGameState(`${sessionId}:shuffledStack`),
    delGameState(`${sessionId}:bin`),
    delGameState(`${sessionId}:gameMode`),
  ]);

  console.log("emitting game over ");
  io.emit("3minSpeedRunGameEnded", toReturn); // Pass toReturn to the front with Socket.io
}
