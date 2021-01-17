<template>
  <div class="app-container">
    <div class="panel">
      <div class="panel-header">
        <img src="/img/logo-inversed.svg" />
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
              <qr-scanner @scan="onQrScan" @error="onQrScanError"></qr-scanner>
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
                  <a :href="fileUrl(msg)" :download="msg.name">Download</a>
                </template>
              </Card>
            </div>
          </div>

          <div class="p-inputgroup text-input">
            <InputText
              @keyup.enter="sendText"
              placeholder="send text"
              v-model="currentMessage"
            />
            <Button
              @click="selectFile"
              icon="pi pi-paperclip"
              class="p-button-secondary"
            />
            <Button
              @click="sendText"
              icon="pi pi-caret-right"
              class="p-button-primary"
            />
            <input
              @change="onFileSelected"
              type="file"
              id="file-input"
              style="display: none"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error Dialog -->
    <Dialog header="Error" closable modal v-model:visible="showErrorDialog">
      {{ errorMessage }}

      <template #footer>
        <Button label="Close" @click="showErrorDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Compoenents
import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import QrCode from "./components/QrCode.vue";
import QrScanner from "./components/QrScanner.vue";

// Services
import { v4 as uuidv4 } from "uuid";
import { SignalingClient } from "./webRTC/SignalingClient";
import { PeerConnection } from "./webRTC/PeerConnection";

const signalingClient = new SignalingClient();
let connection: PeerConnection;

export default defineComponent({
  name: "App",
  components: {
    Card,
    Button,
    Dialog,
    InputText,
    TabView,
    TabPanel,
    QrCode,
    QrScanner
  },
  data() {
    return {
      myUuid: uuidv4(),
      peerUuid: null as string | null,
      connectionEstablished: false,

      currentMessage: "",
      messages: [] as (string | File)[],

      showErrorDialog: false,
      errorMessage: ""
    };
  },
  mounted() {
    signalingClient.registerClient(this.myUuid);
    signalingClient.onConnectionEstablished.addListener(con => {
      connection = con;
      this.connectionEstablished = true;
      connection.onClose.addListener(() => {
        this.errorMessage = "The connection was closed";
        this.showErrorDialog = true;
        this.connectionEstablished = false;
      });
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

    onQrScanError(error: string) {
      this.errorMessage = error;
      this.showErrorDialog = true;
    },

    connectToDevice() {
      if (this.peerUuid) {
        signalingClient.connectToDevice(this.peerUuid);
      }
    },

    sendText() {
      if (connection) {
        connection.sendText(this.currentMessage);
        this.addMessage(this.currentMessage);
        this.currentMessage = "";
      } else {
        this.connectionEstablished = false;
      }
    },

    addMessage(msg: string | File) {
      this.messages.push(msg);
      this.$nextTick(() => {
        const bottomMsg = this.$el.querySelector(".message:last-child");
        bottomMsg.scrollIntoView();
      });
    },

    selectFile() {
      this.$el.querySelector("#file-input").click();
    },

    onFileSelected(event: InputEvent) {
      const el = event.target as HTMLInputElement;
      const files = el.files;
      if (files && files.length >= 1) {
        const file = files[0];
        this.sendFile(file);
      }
    },

    sendFile(file: File) {
      if (connection) {
        connection.sendFile(file);
        this.addMessage(file);
      } else {
        this.connectionEstablished = false;
      }
    },

    fileUrl(file: File) {
      return URL.createObjectURL(file);
    }
  }
});
</script>

<style>
@import url("../node_modules/primevue/resources/themes/saga-blue/theme.css");
@import url("../node_modules/primevue/resources/primevue.min.css");
@import url("../node_modules/primeicons/primeicons.css");
@font-face {
  font-family: "Fredoka One";
  src: url("/fonts/Fredoka_One/FredokaOne-Regular.ttf") format("truetype");
}

html,
body {
  height: 100%;
  margin: 0;
}

/** Override some styles from prime. */
.p-button,
.p-button-primary {
  border-color: #3d5a6c !important;
  background-color: #3d5a6c !important;
}

.p-button-secondary {
  border-color: #72a98f !important;
  background-color: #72a98f !important;
}

.p-highlight .p-tabview-nav-link {
  color: #72a98f !important;
  border-color: #72a98f !important;
}

/** App Style. */
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-container {
  width: 100vw;
  height: 100vh;
  background-image: url("/img/background.png");
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
  background: #3d5a6c;
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
  height: 75vh;
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
