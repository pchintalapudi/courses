<template>
  <button @click="$emit('button-click')" :open="!close">{{close ? "×" : "+"}}</button>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: { close: Boolean }
});
</script>
<style scoped>
button[open] {
  background-color: #0088ff88;
  font-size: 1.5em;
}
button {
  opacity: calc(0.25 * var(--button-visible));
  transition: opacity 300ms;
  background-color: red;
  border: none;
  color: white;
  font-size: 1em;
  width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 50%;
  cursor: pointer;
}
button:hover {
  opacity: 0.5;
}
button:active {
  opacity: 0.75;
}
</style>