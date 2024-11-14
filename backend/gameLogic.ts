import mongoose from "mongoose";
import { getGameState, setGameState } from "./utils/redisClient.js";
import { connect, CardModel } from "./utils/db.js";
import { Card } from "./types.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../", ".env");
dotenv.config({ path: envPath });

// Define return type explicitly and handle potential undefined case
async function fetchCardProps(
  selectedCards: string[] | null,
  sbf: string[] | null,
): Promise<Card[]> {
  try {
    await connect();
    if (mongoose.connection.readyState !== 1) {
      // Return empty array if connection fails
      return [];
    }

    // Fetch cards based on conditions
    const fetchedData = selectedCards
      ? await CardModel.find({ _id: { $in: selectedCards } })
      : sbf
        ? await CardModel.find({ _id: { $in: sbf } })
        : [];

    // Ensure returned data matches Card type
    return fetchedData as Card[];
  } finally {
    await mongoose.disconnect();
  }
}

// attention, perhaps renaming is in order
export async function validate(
  selectedCards: string[],
  sessionId: string,
): Promise<boolean> {
  // esc stands for expandedSelectedCards, which are the props of the selectedCards, as located by MongoDB's find function.
  const esc = await fetchCardProps(selectedCards, null);

  const [card1, card2, card3] = esc;
  if (isValidSet(card1, card2, card3)) {
    await userFoundSet(selectedCards, sessionId); // Again pass it to modify the correct redis states
    return true;
  } else {
    return false;
  }
}

// Misc functions regarding the game logic, for now it's the autoFindSet function
export async function autoFindSet(sbf: string[]): Promise<string[] | null> {
  // ebf stands for expandedBoardFeed, contains the MongoDB props that match sbf
  const ebf = await fetchCardProps(null, sbf);

  // Iterate over all possible combinations of 3 cards
  for (let i = 0; i < ebf.length - 2; i++) {
    for (let j = i + 1; j < ebf.length - 1; j++) {
      for (let k = j + 1; k < ebf.length; k++) {
        if (isValidSet(ebf[i], ebf[j], ebf[k])) {
          // Return the IDs of the cards forming a valid set
          return [ebf[i]._id, ebf[j]._id, ebf[k]._id];
        }
      }
    }
  }

  // If no set is found, return null or an appropriate message
  return null;
}

// Validation logic - the following is a simplified version of the validation for better debugging
function isValidSet(card1: Card, card2: Card, card3: Card): boolean {
  // Define props as a tuple of valid Card keys
  const props = ["number", "shading", "color", "symbol"] as const;

  // Use type assertion to tell TypeScript these are valid keys of Card
  type CardProps = keyof Card;

  let isValidSet = true;

  for (const prop of props) {
    // Now TypeScript knows prop is a valid key of Card
    const allSame =
      card1[prop as CardProps] === card2[prop as CardProps] &&
      card2[prop as CardProps] === card3[prop as CardProps];
    const allDiff =
      card1[prop as CardProps] !== card2[prop as CardProps] &&
      card2[prop as CardProps] !== card3[prop as CardProps] &&
      card1[prop as CardProps] !== card3[prop as CardProps];

    if (!allSame && !allDiff) {
      isValidSet = false;
      break;
    }
  }

  return isValidSet;
}

// ctr stands for cardsToRemove
async function userFoundSet(ctr: string[], sessionId: string) {
  const bin = (await getGameState(`${sessionId}:bin`)) || []; // Get bin from Redis if it's there otherwise provide a clean version
  const boardFeed = await getGameState(`${sessionId}:boardFeed`);
  if (!boardFeed || !boardFeed.length) {
    // Make sure boardFeed is not empty
    throw new Error("Board feed not found or empty");
  }

  let replaceCount: number = 12 - (boardFeed.length - 3); // How many cards to replace, this count will help us later on in the iteration
  let drawnCards: string[];
  console.log(replaceCount, "cards should be replaced!");

  // If we are left with 12 cards after throwing ctr to bin, there is no need to draw new cards
  // Although the removing action is smiliar in both conditions, since we use splice to replace, and the removing has to be done in the expression
  // we have to double it!
  console.log("about to modify boardFeed", boardFeed.length);
  if (replaceCount === 0) {
    // Remove from boardFeed and throw to bin WITHOUT replacing
    replaceNRemove(bin);
  } else {
    // We need to draw cards
    const shuffledStack = await getGameState(`${sessionId}:shuffledStack`); // There are cards to draw, we need the shuffledStack
    drawnCards = shuffledStack.splice(0, replaceCount); // Draw a specific amount of cards from shuffledStack so we have only 12
    console.log("successfully drawn enough cards to reach 12");
    await setGameState(`${sessionId}:shuffledStack`, shuffledStack); // Update redis shuffledStack key to ensure future availability

    replaceNRemove(bin);
  }

  function replaceNRemove(bin: string[]) {
    // Remove cards from boardFeed and replace them with the drawnCards
    for (let i = 0; i < 3; i++) {
      const index = boardFeed!.findIndex(
        (obj: typeof boardFeed) => obj._id === ctr[i],
      ); // Find the object that has the _id of the current ctr
      if (index > -1) {
        // If this object was indeed found in boardFeed
        let removedCard: string;
        if (replaceCount > 0) {
          removedCard = boardFeed.splice(index, 1, drawnCards[i])[0]; // Remove cards AND replace them
          replaceCount--;
        } else {
          removedCard = boardFeed.splice(index, 1)[0]; // Remove cards and do NOT replace them
        }
        // In both cases we should push removedCard to bin after modifying boardFeed
        bin.push(removedCard);
        console.log("cards in bin are", bin);
      } else {
        console.log("couldnt find the selectedCard! check it out!");
      }
    }
  }

  await setGameState(`${sessionId}:boardFeed`, boardFeed);
  await setGameState(`${sessionId}:bin`, bin);
}

export async function drawACard(sessionId: string): Promise<void> {
  console.log("hello from drawACard gameLogic.js sessionId is", sessionId);

  const boardFeed = await getGameState(`${sessionId}:boardFeed`);
  console.log("board feed is", boardFeed);
  const shuffledStack = await getGameState(`${sessionId}:shuffledStack`);

  const drawnCard = shuffledStack.splice(0, 1); // Draw a new card
  await setGameState(`${sessionId}:shuffledStack`, shuffledStack); // Update Redis shuffledStack to avoid drawing identical cards

  // Update Redis boardFeed
  boardFeed.push(drawnCard[0]);
  await setGameState(`${sessionId}:boardFeed`, boardFeed);
}
