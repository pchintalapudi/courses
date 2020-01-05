<template>
  <article
    :title="course ? name : 'Loading Course Name...'"
    @click.stop="$emit('load-course', course_id)"
    :class="`card ${course_id}`"
    :style="`background-color:${color};`"
    :id="JSON.stringify({year, quarter, idx})"
  >
    <h3>
      {{course_id}}
      <button @click="$emit('remove-course')">&times;</button>
    </h3>
    <p>{{course ? display_name : 'Loading Course Name...'}}</p>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import { CourseJSON, compute_color } from "@/fireroad";
export default Vue.extend({
  props: { course_id: String, year: Number, quarter: Number, idx: Number },
  computed: {
    course(): CourseJSON | undefined {
      return this.$store.state.classes.manifest_updated
        ? this.$store.state.classes.manifest.get(this.course_id)
        : undefined;
    },
    name(): string {
      return this.course!.title;
    },
    display_name(): string {
      return this.truncate_name(this.name);
    },
    color(): string {
      return `hsl(${compute_color(this.course_id)}deg, 75%, 45%)`;
    }
  },
  methods: {
    truncate_name(name: string): string {
      if (name.length < 25) {
        return name;
      }
      const fragments = name.split(" ");
      let length = 0;
      let i = 0;
      for (; i < fragments.length && length < 25; i++) {
        length += fragments[i].length;
      }
      return fragments.slice(0, Math.max(i, 2)).join(" ") + " ...";
    }
  }
});
</script>
<style scoped>
.card {
  display: flex;
  flex-flow: column nowrap;
  height: 100px;
  width: 200px;
  color: white;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 5px 5px 5px #00000044;
  margin: 12.5px 0;
}
.card > h3 {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
button {
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms, background-color 150ms;
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
}
.card:hover button {
  opacity: 1;
  pointer-events: all;
}
button:hover {
  background-color: #ff000022;
}
button:active {
  background-color: #ff000044;
}
</style>