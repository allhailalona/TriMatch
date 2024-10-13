import { View } from "react-native";
import { styled } from "nativewind";

export default function App() {
  const StyledView = styled(View);

  return (
    <StyledView className="w-screen h-screen flex items-center flex-row bg-zinc-700"></StyledView>
  );
}
