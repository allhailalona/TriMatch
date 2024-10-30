import { View } from "react-native";
import { styled } from 'nativewind';
import { useGameContext } from '../../context/GameContext';
import { SvgXml } from 'react-native-svg';
import type { Card } from '../../types';

const StyledView = styled(View);
const StyledSvgXml = styled(SvgXml);

export default function GameBoard() {
  const { gameData } = useGameContext();

  const rows = gameData.boardFeed.reduce((acc, card, i) => {
    const rowIndex = Math.floor(i / 4);
    acc[rowIndex] = acc[rowIndex] || [];
    acc[rowIndex].push(card);
    return acc;
  }, [] as Card[][]);

  return (
    <StyledView className="flex-1 justify-center items-center bg-purple-500 py-5">
      {rows.map((row, rowIndex) => (
        <StyledView key={rowIndex} className="flex flex-row justify-center flex-1">
          {row.map((card: Card, index: number) => (
            <StyledView 
              key={index}
              style={{ transform: [{ scale: 1.2 }] }}
              className={`border-4 rounded-lg mx-4 my-5 flex justify-center items-center bg-white py-1
                ${gameData.selectedCards.includes(card._id) 
                  ? 'border-green-600' 
                  : 'border-black'}
                ${gameData.autoFoundSet.includes(card._id) && !gameData.selectedCards.includes(card._id)
                  ? 'border-orange-400'
                  : 'border-black'}`}
            >
              <StyledSvgXml 
                xml={String.fromCharCode(...card.image.data)}
                width={100}
                height={140}
                preserveAspectRatio="xMidYMid meet"
                className="bg-white"
              />
            </StyledView>
          ))}
        </StyledView>
      ))}
    </StyledView>
  );
}
