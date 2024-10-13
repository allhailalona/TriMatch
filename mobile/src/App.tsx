import { View } from "react-native";
import { styled } from "nativewind";
import Navbar from './comps/Navbar'
import GameBoard from './comps/GameBoard'

export default function App() {
  const StyledView = styled(View);

  return (
    <StyledView className="w-screen h-screen flex items-center flex-row">
      <Navbar />
      <GameBoard />
    </StyledView>
  );
}