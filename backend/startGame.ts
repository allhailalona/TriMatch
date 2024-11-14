import mongoose from "mongoose";
import { setGameState, delGameState } from "./utils/redisClient.js";
import { connect, ThemeModel } from "./utils/db.js";
import { Theme } from "./types.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../", ".env");
dotenv.config({ path: envPath });

// Fetch data - Later on we will need conditional fetching by selected theme
async function fetchThemes() {
  try {
    // Establish and verify connection
    await connect();

    // Fetch data
    const fetchedData = await ThemeModel.find({});

    return fetchedData;
  } finally {
    await mongoose.disconnect();
  }
}

export async function shuffleNDealCards(
  sessionId: string,
): Promise<Theme["cards"]> {
  // Fetch cards
  console.log("session id is", sessionId);

  console.log("trying to fetch cards from mongoDB");
  const fetchedData = await fetchThemes();
  console.log("successfuly fetched cards");

  // Inspection suggests that redis is NOT cleared after reload, which is why it's cleared now before reuse
  // Those methods (client.del) would NOT yield errors if the keys don't exist
  await Promise.all([
    delGameState(`${sessionId}:shuffledStack`),
    delGameState(`${sessionId}:bin`),
    delGameState(`${sessionId}:boardFeed`),
  ]);

  // The required theme data will be an object inside an arrary, which is why
  // we need to do the following
  const extractedTheme = fetchedData![0];

  // Shuffle cards, begin by cloning recieved data
  const shuffledStack = [...extractedTheme.cards]; // Create a shallow copy

  for (let i = shuffledStack.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledStack[i], shuffledStack[j]] = [shuffledStack[j], shuffledStack[i]];
  }

  // Deal cards
  const boardFeed = shuffledStack.splice(0, 12); // boardFeed is still binaries here
  console.log(
    "hello from startGame.js shuffledStack length is",
    shuffledStack.length,
  );
  console.log("about to add shuffledStack to redis sessionId is", sessionId);
  await setGameState(`${sessionId}:shuffledStack`, shuffledStack); // Update shuffledStack after dealing cards
  // Board feed is intentionally stored in the listener to give same structures to svg buffers in redis and front - the one the front can read

  return boardFeed;
}
