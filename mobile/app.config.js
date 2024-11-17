export default {
  expo: {
    name: "Trimatch",
    slug: "mobile",
    version: "1.0.0",
    orientation: "landscape",
    icon: "./assets/favicon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    extra: {
      SERVER_URL: "https://set-the-game.onrender.com/",
      GOOGLE_ANDROID_CLIENT_ID: "445050027513-ha0gksunl0htogn71hu8c40ba68krnue.apps.googleusercontent.com",
      GOOGLE_WEB_CLIENT_ID: "445050027513-kq30gse2738kq7kiqca40mnalnnrs41m.apps.googleusercontent.com",
      eas: {
        projectId: "229cf498-8a87-4030-a664-40a471baf4c5",
      },
    },
    owner: "allhailalona",
    android: {
      package: "com.allhailalona.setthegame", // Choose one package name
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    scheme: "trimatch",
    plugins: ["expo-secure-store"],
  },
};