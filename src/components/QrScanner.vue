<template>
  <div class="container">
    <Dropdown
      v-model="selectedCamera"
      :options="cameras"
      optionLabel="label"
      placeholder="Select a camera"
      @change="cameraChanged"
    />

    <video ref="video"></video>

    <Button @click="initCameras" label="Scan"></Button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";

// Services
import { BrowserQRCodeReader, VideoInputDevice } from "@zxing/library";

const codeReader = new BrowserQRCodeReader();

export default defineComponent({
  name: "QrScanner",
  components: {
    Button,
    Dropdown
  },
  emits: ["scan", "error"],
  data() {
    return {
      cameras: [] as VideoInputDevice[],
      selectedCamera: null as VideoInputDevice | null
    };
  },
  methods: {
    async initCameras() {
      const videoInputDevices = await codeReader.getVideoInputDevices();
      if (videoInputDevices.length == 0) {
        this.$emit("error", "No camera found.");
      } else {
        this.cameras = videoInputDevices;
        this.selectedCamera = this.cameras[0];
      }
      this.scan();
    },

    async scan() {
      if (!this.selectedCamera) {
        this.$emit("error", "No camera selected.");
        return;
      }

      const videoElement = this.$refs.video as HTMLVideoElement;
      try {
        const result = await codeReader.decodeFromInputVideoDevice(
          this.selectedCamera.deviceId,
          videoElement
        );
        this.$emit("scan", result.getText());
      } catch (err) {
        // ignore
      }
    },

    cameraChanged() {
      codeReader.reset();
      this.scan();
    }
  }
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
}

video {
  border: 1px solid gray;
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>
