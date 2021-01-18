<template>
  <div class="card">
    <!-- Message Content -->
    <div v-if="msg.transferCompleted">
      <!-- FILE -->
      <div v-if="isFile" class="content-file">
        <div class="content-left">
          <a :href="fileUrl" :download="msg.header.name">
            <i class="pi pi-file" style="fontSize: 2rem"></i>
          </a>
        </div>
        <div class="content-right">
          <a :href="fileUrl" :download="msg.header.name" class="download-link">
            {{ msg.header.name }}
          </a>
        </div>
        <Button
          @click="downloadFile"
          icon="pi pi-download"
          class="p-button-primary"
          v-tooltip.bottom="'Download'"
        />
      </div>

      <!-- TEXT -->
      <div v-else class="content-text">
        <span>{{ msg.payload }}</span>
        <Button
          @click="copyToClipboard"
          icon="pi pi-copy"
          class="p-button-primary"
          v-tooltip.bottom="'Copy into clipboard'"
        />
      </div>
    </div>

    <!-- Loader Skeleton -->
    <div v-else class="content-file">
      <div class="content-left">
        <Skeleton shape="circle" size="5rem"></Skeleton>
      </div>
      <div class="content-right">
        <Skeleton width="100%"></Skeleton>
        <Skeleton width="80%"></Skeleton>
      </div>
    </div>
    <div
      v-if="!msg.transferCompleted"
      class="progress"
      :style="{ width: `${msg.transferProgress}%` }"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "primevue/button";
import Skeleton from "primevue/skeleton";
import Tooltip from "primevue/tooltip";
import { MessageType, Message } from "../webRTC/Message";

export default defineComponent({
  name: "MessageCard",
  components: {
    Button,
    Skeleton
  },
  props: {
    msg: Object as () => Message
  },
  directives: {
    tooltip: Tooltip
  },
  data() {
    return {};
  },
  computed: {
    isFile(): boolean {
      return this.msg?.header.type === MessageType.FILE;
    },
    fileUrl(): string {
      if (this.msg?.payload) {
        const file = this.msg?.payload as File;
        return URL.createObjectURL(file);
      }

      return "";
    }
  },
  methods: {
    copyToClipboard() {
      if (this.msg?.header.type === MessageType.TEXT) {
        const textArea = document.createElement("textarea");
        textArea.value = this.msg.payload as string;
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    },

    downloadFile() {
      if (this.msg?.header.type === MessageType.FILE) {
        this.$el.querySelector(".download-link").click();
      }
    }
  }
});
</script>

<style scoped>
a,
a:visited,
a:hover,
a:active {
  color: #3d5a6c;
}

.card {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  background: #f8f9fa;
  border-radius: 3px;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
}

.card .content-text {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  padding: 15px;
}

.card .content-file {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 15px;
}

.card .content-file .content-left {
  width: 20%;
}

.card .content-file .content-right {
  width: 80%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 10px;
}

.card .progress {
  background: linear-gradient(90deg, #72a98f, #3d5a6c);
  height: 5px;
}
</style>
