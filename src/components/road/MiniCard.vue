<template>
  <article
    :title="course ? name : 'Loading Course Name...'"
    @click.stop="$emit('load-course', course_id.name)"
    :class="`mini-card ${course_id.name}`"
    :style="`background-color:${color};`"
    :id="JSON.stringify({year, quarter, idx})"
  ><h3>{{course_id.name}}</h3></article>
</template>
<script lang="ts">
import Vue from "vue";
import { compute_color, CourseJSON } from "@/fireroad";
import { ClassData } from '@/store/road';
export default Vue.extend({
  props: { course_id: Object as () => ClassData, year: Number, quarter: Number, idx: Number },
  computed: {
    course(): CourseJSON | undefined {
      return this.$store.getters["classes/class"](this.course_id.name);
    },
    name(): string {
      return this.course!.title;
    },
    color(): string {
      return `hsl(${compute_color(this.course_id.name)}deg, 75%, 45%)`;
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