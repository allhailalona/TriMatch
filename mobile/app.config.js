// app.config.js
export default {
  expo: {
    extra: {
      // SERVER_URL: "https://set-the-game.onrender.com/" // Only exists in Expo - Uncomment when using Prod mode
      GOOGLE_ANDROID_CLIENT_ID: "445050027513-ha0gksunl0htogn71hu8c40ba68krnue.apps.googleusercontent.com",
      GOOGLE_WEB_CLIENT_ID: "445050027513-kq30gse2738kq7kiqca40mnalnnrs41m.apps.googleusercontent.com",
      eas: {
        projectId: "229cf498-8a87-4030-a664-40a471baf4c5"
      }
    },
    owner: "allhailalona",
    android: {
      package: "com.allhailalona.setthegame"
    },
    scheme: "setthegame",
    plugins: [
      "expo-secure-store"
    ]
  }
};
