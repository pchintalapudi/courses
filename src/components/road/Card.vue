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
      <close-button-vue @button-click="$emit('remove-course')" :close="true"></close-button-vue>
    </h3>
    <p>{{course ? display_name : 'Loading Course Name...'}}</p>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CloseButtonVue from "@/components/utils/ActionButton.vue";
import { CourseJSON, compute_color } from "@/fireroad";
import VueRouter from "vue-router";
export default Vue.extend({
  components: { CloseButtonVue },
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
  --button-visible: 0;
}
.card > h3 {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
.card:hover {
  --button-visible: 1;
}
</style>