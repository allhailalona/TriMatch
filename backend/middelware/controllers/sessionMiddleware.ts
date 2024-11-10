import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { setGameState, getGameState } from '../../utils/redisClient';

export const handleGameSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('checking if sessionId comes from expo', req.query.sessionId)
        // Parse sessionId from cookies - ensure it's a string
        const sessionId = req.cookies.sessionId /* for web reqs */ || req.query.sessionId /* for mobile reqs */ || undefined;

        console.log('hello middleware sessionId is', sessionId)
        if (sessionId) { // If a sessionId from the front was found
            console.log('hello handleGameSession found session id in front')

            // Validate session in Redis - will return an email or guest
            const redisSessionType = await getGameState(sessionId);

            // 2 options for a validated redis sessoinId:
            if (redisSessionType && redisSessionType !== 'guest') { 
                // a. session includes an email which is return to listener to modify the DB
                console.log('redis session is validated type is email:', redisSessionType)
                req.sessionIdEmail = redisSessionType // This will be used for modding DB
                req.isSessionValid = true // We could use the req.sessionId, but I make this specific item for clarity and readability
                req.sessionId = sessionId // Pass the validated session id in this form if it was validated
                return next();
            } else if (redisSessionType === 'guest') {
                // b. session includes 'guest', and only requires validation to change temp redis game keys
                console.log('redis session is validated type is guest')
                req.isSessionValid = true
                req.sessionId = sessionId // To access the correct game keys in redis!
                return next()
            } else { // In case no redis session was found
                // While the else is not strictly required since return next() is used, it's used for better readability
                console.warn('no redis session found');
                return res.status(401).json({ error: 'no redis session found' });
            }
        } else {
            // Again the conditional is not strictly necessary but used for improved readability
            console.warn('no sessionId was found in front, creating a temp guest sessionId if the request came from start game...')
            // Handle new game sessions
            if (req.headers['x-request-origin'] === '/start-game') {
                const newSessionId = await createSession('guest');
                console.log('created a new temp sessionId', newSessionId)

                req.createdSession = true // So we know to store the new session 
                req.sessionId = newSessionId; // The newly created sessionId
                return next();
            } else {
                console.warn('the request was not sent from start-game, most likely since a game was not started and some smart ass decided to manually call express....')
            }
        }
    } catch (error) {
        // That's general error handling, irrelevant to the conditionals above...
        console.error('Session handling error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const createSession = async (reqType: string): Promise<string> => {
    // Generate session ID
    const sessionId = crypto.randomBytes(18).toString('hex').slice(0, 36);
    
    // Store in Redis for one hour
    await setGameState(sessionId, reqType, 3600);
    
    return sessionId; // Return to be used in start game state creation or in the cookies/expo-secure-store
};


