<template>
  <div class="card">
    <!-- Message Content -->
    <div v-if="msg.transferCompleted">
      <!-- FILE -->
      <div v-if="isFile" class="content">
        <div class="content-left">
          <a :href="fileUrl" :download="msg.header.name">
            <i class="pi pi-file" style="fontSize: 5rem"></i>
          </a>
        </div>
        <div class="content-right">
          <a :href="fileUrl" :download="msg.header.name">
            {{ msg.header.name }}
          </a>
        </div>
      </div>
      <!-- TEXT -->
      <div v-else class="content">
        {{ msg.payload }}
      </div>
    </div>

    <!-- Loader Skeleton -->
    <div v-else class="content">
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
import Skeleton from "primevue/skeleton";
import { MessageType, Message } from "../webRTC/Message";

export default defineComponent({
  name: "MessageCard",
  components: {
    Skeleton
  },
  props: {
    msg: Object as () => Message
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

.card .content {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 15px;
}

.card .content .content-left {
  width: 20%;
}

.card .content .content-right {
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
