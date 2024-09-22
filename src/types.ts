// types.ts

export interface Card {
    _id: string;
    image: {
      data: number[];
    };
  }
  
  export interface FGS {
    boardFeed: Card[];
    selectedCards: string[];
    autoFoundSet: string[];
  }
  
  export type UpdateBoardFeed = (data: Card[]) => void;
  export type UpdateSelectedCards = (data: string[]) => void;
  export type UpdateAutoFoundSet = (data: string[]) => void;
  