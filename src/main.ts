import { createApp } from 'vue'
import App from './App.vue'

//import './style.css'
import './3rdparty/fontawesome-free-6.7.2/css/all.min.css'
import './assets/css/appstyle.css'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

createApp(App)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
