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
#app, #app input {
  display: flex;
  font-family: "Titillium Web", sans-serif;
}
.p-req, .c-req {
    stroke:#ffffff66;
    stroke-width: 2;
    fill: transparent;
    transition: stroke 150ms;
}
.c-req {
    stroke-dasharray: 5 5;
}
</style>