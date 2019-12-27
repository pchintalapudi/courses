<template>
  <article :title="name">
    <h3>{{course_id}}</h3>
    <p>{{display_name}}</p>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import { CourseJSON } from "../../fireroad";
export default Vue.extend({
  props: { course_id: String },
  computed: {
    course(): CourseJSON {
      return (
        this.$store.state.classes.manifest_updated &&
        this.$store.state.classes.manifest.get(this.course_id)
      );
    },
    name(): string {
      return this.course.title;
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
      return fragments.slice(0, Math.max(i, 2)).join(" ");
    }
  }
});
</script>