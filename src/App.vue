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
  background-color: hsl(var(--background));
  color: hsl(var(--contrast));
  transition: background-color 1s, color 1s;
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
  opacity: 0.75;
  animation: draw 500ms ease-in-out 0ms 1 normal forwards;
  stroke: hsla(var(--contrast), calc(var(--level) * 10));
}
.c-req {
    stroke-dasharray: 0.3%;
}
#app.dark-mode {
    --background: 0, 0%, 7%;
    --contrast: 0, 0%, 93%;
    --level: 0.05;
    --saturate: 75%;
    --lightness: 45%;
}
#app {
    --background: 0, 0%, 100%;
    --contrast: 0, 0%, 7%;
    --level: 0.05;
    --saturate: 75%;
    --lightness: 50%;
}
</style>