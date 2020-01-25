<template>
  <article
    :title="course ? name : 'Loading Course Name...'"
    :class="`mini-card ${course_id.name}`"
    :style="`background-color:${color};`"
    :id="JSON.stringify({year, quarter, idx})"
    @mousedown="$emit('drag-start', {year, quarter, idx, name:course_id.name})"
  >
    <h3>{{course_id.name}}</h3>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import { compute_color, CourseJSON } from "@/fireroad";
import { ClassData } from "@/store/road";
export default Vue.extend({
  props: {
    course_id: Object as () => ClassData,
    year: Number,
    quarter: Number,
    idx: Number
  },
  computed: {
    course(): CourseJSON | undefined {
      return this.$store.getters["classes/class"](this.course_id.name);
    },
    name(): string {
      return this.course!.title;
    },
    color(): string {
      return `hsl(${compute_color(this.course_id.name)}deg, var(--saturate), var(--lightness))`;
    }
  }
});
</script>
<style scoped>
.mini-card {
  display: flex;
  flex-flow: column nowrap;
  color: white;
  border-radius: 10px;
  margin: 0.25em;
  justify-content: center;
  align-items: center;
  width: 5em;
  height: 2.5em;
  cursor: grab;
  transition: background-color 1s;
}
.mini-card > h3 {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
.mini-card:active {
    cursor: grabbing;
}
</style>