/* eslint-disable */

import { TouchableOpacity } from "react-native";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { AntDesign } from "@expo/vector-icons";

const GOOGLE_ANDROID_CLIENT_ID =
  Constants.expoConfig?.extra?.GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID;

export default function GoogleLogin() {
  WebBrowser.maybeCompleteAuthSession();

  const [response, request, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  async function googleSignIn() {
    const res = await promptAsync();
    if (res?.type === "success") {
      const { authentication } = res;
    }
  }

  return (
    <TouchableOpacity
      onPress={() =>
        alert(
          "Currently Unsupported! If you are proficient in expo-auth-session and Google Cloud OAUTH2.0 configuration, and willing to help, please contact me at lotanbar3@gmail.com. Thanks!",
        )
      }
    >
      <AntDesign name="google" size={24} color="black" />
    </TouchableOpacity>
  );
}
