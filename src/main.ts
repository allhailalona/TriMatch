import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles' // eslint-disable-line
import { createVuetify } from 'vuetify'
import { createPinia } from 'pinia'
import * as components from 'vuetify/components' // eslint-disable-line
import * as directives from 'vuetify/directives' // eslint-disable-line

import './main.css'

import App from './App.vue'

const vuetify = createVuetify({
  components,
  directives
})

const app = createApp(App).use(vuetify)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
