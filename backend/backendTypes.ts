// types.ts

export interface Card {
    _id: string;
    number: 1 | 2 | 3;
    shading: 'full' | 'striped' | 'empty';
    color: 'purple' | 'green' | 'red';
    symbol: 'diamond' | 'squiggle' | 'oval';
  }

export interface Theme {
  _id: string;
  cards: {
    _id: string;
    image: Buffer;
  }[];
}

export interface User {
  _id: string
}

export type Bin = {key: 'bin', value: string[]}
// The value of ShuffledStack is, I believe, changing multiple times in runtime, due to time constarints I'll leave it as any for now
export type ShuffledStack = {key: 'shuffledStack', value: any} 
export type BoardFeed = {key: 'boardFeed'; value: {_id : string, image: Buffer}};
export type OTP = {key: `${string}:otp`, value: string}
export type sessionId = {key: `${string}:sessionId`, value: string}

export type GameStateKeys = Bin['key'] | BoardFeed['key'] | ShuffledStack['key'] | OTP['key'] | sessionId['key']
export type GameStateValues = Bin['value'] | BoardFeed['value'] | ShuffledStack['value'] | OTP['value'] | sessionId['value']
