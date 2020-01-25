<template>
  <button @click.stop="button_click" @mousedown.stop @mouseup.stop :open-button="!close">
    <p>{{close ? "×" : "+"}}</p>
  </button>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: { close: Boolean, stop: Boolean },
  methods: {
    button_click(event: MouseEvent) {
      this.$emit("button-click");
      if (this.stop) {
        event.stopPropagation();
      }
    }
  }
});
</script>
<style scoped>
button[open-button]::before {
  background-color: #0088ff88;
  font-size: 1.5em;
}
button[open-button] {
  color: hsl(var(--contrast));
}
button {
  opacity: var(--button-visible);
  transition: opacity 300ms;
  background-color: transparent;
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
  position: relative;
}
button::before {
  content: "";
  border-radius: 50%;
  background-color: #ff000088;
  opacity: 0.25;
  transition: opacity 150ms;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
button:hover::before {
  opacity: 0.5;
}
button:active::before {
  opacity: 1;
}
p {
  z-index: 1;
}
</style>