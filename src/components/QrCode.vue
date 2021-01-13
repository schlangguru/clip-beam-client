<template>
  <div id="qr-code"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { BrowserQRCodeSvgWriter } from "@zxing/library";

const codeWriter = new BrowserQRCodeSvgWriter();

export default defineComponent({
  name: "QrCode",
  props: {
    value: String
  },
  data() {
    return {};
  },
  mounted() {
    codeWriter.writeToDom("#qr-code", this.value || "", 300, 300);
  }
});
</script>

<style scoped></style>
