<template>
  <div v-if="show" class="overlay">
    <div class="content">
      <div class="wrapper">
        <div class="loader">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      <span v-if="label" class="label">{{ label }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Loader",
  props: {
    label: String,
    show: Boolean
  }
});
</script>

<style scoped>
.overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(67, 58, 63, 0.4);
  z-index: 999;
}

.overlay .content {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
}

.overlay .content .label {
  text-align: center;
  font-size: 2rem;
  color: #fff;
}

@keyframes loader {
  0% {
    transform: scale(1.1500000000000001);
  }
  100% {
    transform: scale(1);
  }
}

.loader div {
  position: absolute;
  width: 80px;
  height: 80px;
  top: 13.333333333333336px;
  left: 13.333333333333336px;
  background: #433a3f;
  animation: loader 1s cubic-bezier(0, 0.5, 0.5, 1) infinite;
  animation-delay: -0.3s;
}

.loader div:nth-child(2) {
  top: 13.333333333333336px;
  left: 106.66666666666666px;
  background: #3d5a6c;
  animation-delay: -0.2s;
}

.loader div:nth-child(3) {
  top: 106.66666666666666px;
  left: 13.333333333333336px;
  background: #fcd0a1;
  animation-delay: 0s;
}

.loader div:nth-child(4) {
  top: 106.66666666666666px;
  left: 106.66666666666666px;
  background: #72a98f;
  animation-delay: -0.1s;
}

.wrapper {
  width: 200px;
  height: 200px;
  display: inline-block;
  overflow: hidden;
  background: none;
}

.loader {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0; /* see note above */
}

.loader div {
  box-sizing: content-box;
}
</style>
