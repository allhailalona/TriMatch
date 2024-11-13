import { getGameState, delGameState } from './redisClient'
import { connect, UserModel } from './db'
import { autoFindSet } from '../gameLogic'
import type { SessionId, BoardFeed, ShuffledStack } from '../types'

export async function handleClassicGameIsOver(toReturn, sessionId: SessionId, boardFeed: BoardFeed[], userEmail: string, headers: string, isValidSet) {
  console.log('gameMode IS classic checking length of shuffledStack and boardFeed')
  const shuffledStack: ShuffledStack[] = await getGameState(`${sessionId}:shuffledStack`)
  console.log('length of boardFeed and shuffledStack is', boardFeed.length + shuffledStack.length)

  let isGuest = false // Default value

  // If there are still sets there is no need to stop the game
  if (shuffledStack.length + boardFeed.length <= 21) { // A game with more than 21 cards will ALWAYS contain a set
    console.log('total available cards are below 21 - its possible that no more sets are present - checking with autoFindSet')

    // Refactor available cards to check for existing sets
    const availCardsRaw: (BoardFeed | ShuffledStack)[] = [...boardFeed, ...shuffledStack]
    const availCardsIdOnly: string[] = availCardsRaw.map(card => card._id)
    console.log('availCardsIdOnly is', availCardsIdOnly)

    const setFound = await autoFindSet(availCardsIdOnly) // The autoFindSets will start after we know there might be a board with NO SETS 

    if (setFound) { // If the board has a set, the game is not over yet... dont start with the 'broken record' logic
      // Simply do nothing let the toReturn logic after the conditional continue
      console.log('a set was found, the game continues, nothing happens')
    } else { // Game Over!
      console.log('a set wasnt found, declare game over - stopping stopwatch then checking for new records')
      // A. Stop the stopwatch and get time result
        // Convert both times to milliseconds for comparison
        const startingTime: number = new Date(await getGameState(`${sessionId}:stopwatch`)).getTime()
        console.log('starting time is', startingTime)

        const currentTime: number = new Date().getTime()
        console.log('current time is', currentTime)

        // Explicit conversion to ms with getTime()
        const timeDiff: number = currentTime - startingTime
        console.log('timeDiff is', timeDiff)

        // Convert to seconds - newScore is the final time result
        const newScore: number = Math.floor(timeDiff / 1000)

      // B. Check if record is broken - is new score lower than previous score
      console.log('user email is', userEmail)
        if (userEmail) {
          // Since this is an id user session - Show result in front AND check if record was broken
          console.log('thats an id session, lets check if record was broken for user', userEmail)

          // Connect to DB then compare with newScore
          await connect()
          const prevRecord = (await UserModel.findById(userEmail))!.stats.speedrunWholeStack

          console.log('current score is', newScore)
          console.log('users previous record is', prevRecord)

          if (prevRecord > newScore) { // If record was broken
            // Record was broken, update DB then pass score to front
            console.log('broken record congrats! updating DB')
            await UserModel.findByIdAndUpdate(userEmail, { "stats.speedrunWholeStack": newScore })
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
          delGameState(sessionId)
          // Remove cookies/expo-secure-store
          if (headers !== 'expo') {
            // The request IS NOT coming from expo let's remove cookies
            // Since there is no direct access to cookies from here, we'll add a flag
            isGuest = true
          } // Else the sessionId is removed from expo in expo files
          toReturn = {...toReturn, /*no isRecordBroken since thats a guest session*/ newScore} // This time the user cannot break a record since he's a guest
        }

        // Remove those regardless of the session type - guest/logged in user - the front sessionId will only be removed if the session type is guest
        await Promise.all([
          delGameState(`${sessionId}:boardFeed`),
          delGameState(`${sessionId}:shuffledStack`),
          delGameState(`${sessionId}:bin`),
          delGameState(`${sessionId}:gameMode`)
        ])
    }      
  } else { // The game is not over yet there are still sets to find!
    console.log('there are still sets to find classic game continues!')
    toReturn = {...toReturn, isValidSet, boardFeed} // Just return the validity of the Set with an updated boardFeed as an anticheat measure
  }

  return { toReturn, isGuest}
}