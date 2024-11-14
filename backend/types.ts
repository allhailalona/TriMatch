// types.ts

export type Card = {
  _id: string;
  number: 1 | 2 | 3;
  shading: "full" | "striped" | "empty";
  color: "purple" | "green" | "red";
  symbol: "diamond" | "squiggle" | "oval";
};

export type Theme = {
  _id: string;
  cards: {
    _id: string;
    image: Buffer;
  }[];
};

export type User = {
  _id: string;
  username: string;
  stats: {
    gamesPlayed: number;
    setsFound: number;
    speedrun3min: number;
    speedrunWholeStack: number;
  };
};

export type Bin = { key: "bin"; value: string[] };
// The value of ShuffledStack is, I believe, changing multiple times in runtime, due to time constarints I'll leave it as any for now
export type ShuffledStack = { key: "shuffledStack"; value: any }; // eslint-disable-line
export type BoardFeed = {
  key: "boardFeed";
  value: Theme;
};
export type OTP = { key: `${string}:otp`; value: string };
export type SessionId = { key: `${string}:sessionId`; value: string };

export type GameStateKeys =
  | `${string}:bin`
  | `${string}:boardFeed`
  | `${string}:shuffledStack`
  | `${string}:gameMode`
  | `${string}:stopwatch`
  | `${string}:setsFound`
  | `${string}:otp`
  | string;
export type GameStateValues =
  | Bin["value"]
  | BoardFeed["value"]
  | ShuffledStack["value"]
  | OTP["value"]
  | SessionId["value"];

// In types.ts, update the MongoUpdates type to:
export type StatsKeys = keyof User["stats"];

// Use Record utility type for mapped object type
export type MongoUpdates = {
  [K in StatsKeys as `stats.${K}`]?: number; // Note the ? making it optional
};

declare module "express" {
  interface Request {
    createdSession?: boolean;
    sessionId: string;
    sessionIdEmail?: string;
    user?: User;
    query: {
      gameMode?: string;
      sbf?: string;
      sessionId?: string;
    } & qs.ParsedQs;
    headers: HeadersInit & {
      "x-source"?: string;
      "x-request-origin"?: string;
    };
  }
}

export type ValidateOTPResponse = {
  isValidated: boolean;
  userData: User;
};
