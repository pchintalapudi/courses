<template>
  <article :title="course ? name : 'Loading Course Name...'" @click.stop="$emit('load-course', course_id)" class="card">
    <h3>{{course_id}}</h3>
    <p>{{course ? display_name : 'Loading Course Name...'}}</p>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import { CourseJSON } from "@/fireroad";
export default Vue.extend({
  props: { course_id: String },
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
      if (this.name.length < 25) {
        return this.name;
      }
      const fragments = this.name.split(" ");
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
    background-color: #0088ff;
    color: white;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 5px 5px 5px #00000044;
}
</style>