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
}
#app {
    display: flex;
}
</style>