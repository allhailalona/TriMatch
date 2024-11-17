import { createApp } from "vue";
import Toast, { type PluginOptions } from "vue-toastification";
import "vue-toastification/dist/index.css";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import "./main.css";
import App from "./App.vue";

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
});

// Create app instance
const app = createApp(App);

// Toast options
const toastOptions: PluginOptions = {
  position: "top-center",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: "button",
  icon: true,
  rtl: false
}

// Use plugins
app.use(vuetify);
app.use(createPinia());
app.use(Toast, toastOptions);

// Mount app
app.mount("#app");