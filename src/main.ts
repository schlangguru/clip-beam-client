import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import App from "./App.vue";

createApp(App)
  .use(PrimeVue)
  .use(ToastService)
  .mount("#app");
