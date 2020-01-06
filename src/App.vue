<template>
  <div id="app">
    <router-view />
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({});
</script>
<style>
body * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  background-color: #121212;
  color: hsl(0deg, 0%, 80%);
}
#app,
#app input {
  display: flex;
  font-family: "Titillium Web", sans-serif;
  --button-visible: 1;
}
.p-req,
.c-req {
  stroke-width: 2;
  fill: transparent;
  transition: stroke 150ms;
  opacity: 0.5;
  stroke-dasharray: var(--length);
  stroke-dashoffset: var(--length);
  animation: draw 500ms ease-in-out 0ms 1 normal forwards;
}
.p-req {
  stroke: hsl(240deg, 0%, 50%);
}
.c-req {
  stroke: hsl(60deg, 75%, 50%);
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>