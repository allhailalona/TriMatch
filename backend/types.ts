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
  
  export type GameStateKey = 'bin' | 'boardFeed' | 'shuffledStack';