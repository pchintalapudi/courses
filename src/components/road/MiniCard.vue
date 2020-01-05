<template>
  <article
    :title="course ? name : 'Loading Course Name...'"
    @click.stop="$emit('load-course', course_id)"
    :class="`mini-card ${course_id}`"
    :style="`background-color:${color};`"
    :id="JSON.stringify({year, quarter, idx})"
  ><h3>{{course_id}}</h3></article>
</template>
<script lang="ts">
import Vue from "vue";
import { compute_color, CourseJSON } from "@/fireroad";
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
    color(): string {
      return `hsl(${compute_color(this.course_id)}deg, 75%, 45%)`;
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
  box-shadow: 5px 5px 5px #00000044;
  margin: 0.25em;
  justify-content: center;
  align-items: center;
  width: 5em;
  height: 2.5em;
}
.mini-card > h3 {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
</style>