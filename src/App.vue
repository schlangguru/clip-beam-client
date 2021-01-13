<template>
  <div class="app-container">
    <div class="panel">
      <div class="panel-header">
        Clip Beam
      </div>
      <!-- Establish connection view -->
      <div v-if="!connectionEstablished" class="panel-content">
        <div class="description">
          <h1>How to use Clip Beam:</h1>
          <ol>
            <li>Open the web app on 2 devices</li>
            <li>
              On the first device show the
              <i class="pi pi-th-large"></i>
              QR coden
            </li>
            <li>
              On the second device open the
              <i class="pi pi-camera"></i>
              QR scanner
            </li>
            <li>
              Scan the QR code to connect the 2 devices
            </li>
          </ol>
        </div>
        <div class="qr-code">
          <TabView>
            <TabPanel>
              <template #header>
                <i class="pi pi-th-large"></i>
              </template>
              <qr-code :value="myUuid"></qr-code>
              <div class="p-inputgroup text-input">
                <InputText
                  v-model="myUuid"
                  class="my-uuid-input-text"
                  readonly
                />
                <Button
                  @click="copyUuidToClipboard"
                  icon="pi pi-copy"
                  class="p-button-primary"
                />
              </div>
            </TabPanel>
            <TabPanel>
              <template #header>
                <i class="pi pi-camera"></i>
              </template>
              <qr-scanner @scan="onQrScan"></qr-scanner>
              <div style="height: 1rem;"></div>
              <div class="p-inputgroup text-input">
                <InputText
                  @keyup.enter="connectToDevice"
                  v-model="peerUuid"
                  placeholder="enter device id manually"
                />
                <Button
                  icon="pi pi-caret-right"
                  class="p-button-primary"
                  @click="connectToDevice"
                />
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>

      <!-- Data Channel view -->
      <div v-else class="panel-content">
        <div class="data-channel">
          <div class="messages-wrapper">
            <div class="messages">
              <Card v-for="msg in messages" v-bind:key="msg" class="message">
                <template #content>
                  {{ msg }}
                </template>
              </Card>
            </div>
          </div>

          <div class="p-inputgroup text-input">
            <InputText
              @keyup.enter="sendMessage"
              placeholder="send text"
              v-model="currentMessage"
            />
            <Button icon="pi pi-paperclip" class="p-button-secondary" />
            <Button
              @click="sendMessage"
              icon="pi pi-caret-right"
              class="p-button-primary"
            />
          </div>
        </div>
      </div>
    </div>

    <Toast></Toast>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Compoenents
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import TabView from "primevue/tabview";
import Toast from "primevue/toast";
import TabPanel from "primevue/tabpanel";
import QrCode from "./components/QrCode.vue";
import QrScanner from "./components/QrScanner.vue";

// Services
import { v4 as uuidv4 } from "uuid";
import webRTCService from "./services/WebRTCService";

export default defineComponent({
  name: "App",
  components: {
    Card,
    Button,
    InputText,
    TabView,
    TabPanel,
    Toast,
    QrCode,
    QrScanner
  },
  data() {
    return {
      myUuid: uuidv4(),
      peerUuid: null as string | null,
      connectionEstablished: false,

      currentMessage: "",
      messages: [] as string[]
    };
  },
  mounted() {
    webRTCService.registerClient(this.myUuid);
    webRTCService.onConnected.addListener(() => {
      this.connectionEstablished = true;
    });
    webRTCService.onData.addListener(msg => {
      this.addMessage(msg);
    });
  },
  methods: {
    copyUuidToClipboard() {
      const inputText = this.$el.querySelector(".my-uuid-input-text");
      inputText.focus();
      inputText.select();
      inputText.setSelectionRange(0, 99999);
      document.execCommand("copy");
    },

    onQrScan(uuid: string) {
      this.peerUuid = uuid;
      this.connectToDevice();
    },

    connectToDevice() {
      if (this.peerUuid) {
        webRTCService.connectToDevice(this.peerUuid);
      }
    },

    sendMessage() {
      webRTCService.sendMessage(this.currentMessage);
      this.addMessage(this.currentMessage);
      this.currentMessage = "";
    },

    addMessage(msg: string) {
      this.messages.push(msg);
      this.$nextTick(() => {
        const bottomMsg = this.$el.querySelector(".message:last-child");
        bottomMsg.scrollIntoView();
      });
    }
  }
});
</script>

<style>
@import url("../node_modules/primevue/resources/themes/saga-blue/theme.css");
@import url("../node_modules/primevue/resources/primevue.min.css");
@import url("../node_modules/primeicons/primeicons.css");

html,
body {
  height: 100%;
  margin: 0;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-container {
  width: 100vw;
  height: 100vh;
  background-image: url("https://cdn.pixabay.com/photo/2015/03/03/21/10/forest-657903_960_720.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  display: flex;
  justify-content: center;
  align-items: center;
}

.panel {
  background: #f8f9fa;
  border-radius: 5px;
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 5px 8px 0 rgba(0, 0, 0, 0.14),
    0 1px 14px 0 rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.panel-header {
  background: #607d8b;
  padding: 10px 15px;
  text-align: center;
  font-size: 2rem;
  color: #f8f9fa;
}

.panel-content {
  display: flex;
  flex-wrap: wrap-reverse;
  justify-content: center;

  width: 90vw;
  height: 80vh;
  max-width: 1000px;
  max-height: 600px;
  padding: 10px;

  overflow: auto;
}

.panel-content .description {
  width: 600px;
  flex-grow: 1;
}

.panel-content .description ol {
  line-height: 200%;
}

.panel-content .qr-code {
  width: 300px;
  flex-grow: 1;
  text-align: center;
}

.panel-content .data-channel {
  display: flex;
  flex-direction: column;

  width: 100%;
}

.panel-content .data-channel .messages-wrapper {
  flex-grow: 1;
  position: relative;
}
.panel-content .data-channel .messages-wrapper .messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}

.panel-content .data-channel .message {
  margin-top: 1rem;
}

.panel-content .data-channel .text-input {
  flex-grow: 0;
}
</style>
