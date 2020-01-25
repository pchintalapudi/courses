<template>
  <label @click="editing=true" class="notes" v-if="road">
    <p>Notes</p>
    <iframe :srcdoc="document" frameborder="0" v-if="!editing" sandbox="allow-scripts"></iframe>
    <textarea
      v-else
      name="notes"
      id="notes"
      cols="30"
      rows="10"
      v-model="notes"
      @blur="editing=false"
      @keydown.enter.ctrl.exact.prevent="editing=false"
    ></textarea>
  </label>
</template>
<script lang="ts">
import Vue from "vue";
import marked from "marked";
import { Road } from "@/store/road";
export default Vue.extend({
  props: { road: Object as () => Road | undefined },
  data() {
    return { notes: "", editing: false, saving: false };
  },
  mounted() {
    if (this.road) {
      this.notes = this.road.notes;
    }
  },
  watch: {
    road(next: Road | undefined, old: Road | undefined) {
      if (old) {
        old.notes = this.notes;
        this.$store.dispatch("roads/save");
      }
      if (next) {
        this.notes = next.notes;
      }
    },
    notes() {
        this.save();
    }
  },
  computed: {
    dark_mode(): boolean {
      return this.$store.state.roads.dark_mode;
    },
    style(): string {
      return `<style>html{color:hsl(${
        this.dark_mode ? "0, 0%, 93%" : "0, 0%, 7%"
      });background-color:hsl(${
        this.dark_mode ? "0, 0%, 7%" : "0, 0%, 100%"
      })}</style>`;
    },
    document(): string {
      return `<!DOCTYPE html><html><head><title>Notes</title>${this.style}<head><body>${this.compiled}</body></html>`;
    },
    compiled(): string {
      return marked.parse(this.notes);
    }
  },
  methods: {
    save() {
      if (!this.saving && this.road) {
        const road = this.road;
        this.$nextTick(() => {
          if (this.road === road) {
            road.notes = this.notes;
            this.$store.dispatch("roads/save");
            this.saving = false;
          }
        });
        this.saving = true;
      }
    }
  }
});
</script>
<style scoped>
.notes {
  display: flex;
  flex-flow: column nowrap;
}
.notes > :not(p) {
  box-sizing: border-box;
  margin: 0;
  flex: 1;
}
#notes {
  background-color: hsl(var(--background));
  color: hsl(var(--contrast));
}
p {
  cursor: pointer;
  margin: 0;
  flex-grow: 0;
}
</style>