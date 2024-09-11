import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import './main.css'

import App from './App.vue'
import Navbar from './comps/Navbar.vue'

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App).use(vuetify)

app.component('Navbar', Navbar)
app.mount('#app')
