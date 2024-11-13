import { createClient } from "redis";
import RedisStore from "connect-redis";
import session from "express-session";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { handleTimeIsUp } from './3minSpeedRunIsOverUtil.ts'
import type { GameStateKeys, GameStateValues } from "../types.ts";

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../", ".env");
dotenv.config({ path: envPath });

// Config Redis and Connect
const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect();

export async function getGameState(
  key: GameStateKeys,
): Promise<GameStateValues | null> {
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
}

export async function setGameState(
  key: GameStateKeys,
  value: GameStateValues,
  time?: number,
): Promise<void> {
  if (time) {
    await client.set(key, JSON.stringify(value), { EX: time }); // That's seconds
  } else {
    await client.set(key, JSON.stringify(value));
  }
}

export async function delGameState(key: GameStateKeys): Promise<void> {
  await client.del(key);
}

export const sessionMiddleware = session({
  store: new RedisStore({ client: client }),
  secret: process.env.REDIS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Do not create a session if auth failed
  cookie: {
    httpOnly: true,
    secure: true, // Set this to true when in prod mode
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // Store cookies for 24 hours only
  },
});


// Create separate clients for publisher and subscriber
const pub = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
 });
 const sub = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
 });
 
 // Handle connection errors
 pub.on("error", (err) => console.error("Publisher Error:", err));
 sub.on("error", (err) => console.error("Subscriber Error:", err));
 
 // Initialize pub/sub system
 export async function initPubSub() {
  await Promise.all([pub.connect(), sub.connect()]);
  
  // Setup subscriber with JSON message parsing
  await sub.subscribe("timer-channel", (message) => {
    const data = JSON.parse(message);
    if (data.type === "time-over") {
      handleTimeIsUp(data.sessionId, data.userEmail);
    }
  });
 }
 
 // Timer function with sessionId and userEmail
 export async function startTimer(duration: number, sessionId: string, userEmail: null | string) {
  try {
    await pub.publish("timer-channel", JSON.stringify({
      type: "timer-started",
      sessionId,
      userEmail
    }));
    
    setTimeout(async () => {
      await pub.publish("timer-channel", JSON.stringify({
        type: "time-over",
        sessionId,
        userEmail
      }));
    }, duration);
    
    console.log("Timer started for session:", sessionId, "user:", userEmail);
  } catch (error) {
    console.error("Timer error:", error);
  }
 }