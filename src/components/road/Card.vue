<template>
  <article
    :title="course ? name : 'Loading Course Name...'"
    @click.stop="$emit('load-course', course_id.name)"
    :class="`card ${course_id.name}`"
    :style="`background-color:${color};`"
    :id="JSON.stringify({year, quarter, idx})"
    :unsat="unsafe_sat || course_id.force_sat ? false : !!course_id.unsat"
  >
    <h3>
      {{course_id.name}}
      <close-button-vue @button-click="$emit('remove-course')" :close="true" :title="`Remove ${course_id.name}`"></close-button-vue>
    </h3>
    <p>{{course ? display_name : 'Loading Course Name...'}}</p>
    <transition name="fade">
      <p
        v-if="!unsafe_sat && course_id.unsat"
        class="unsat"
        :title="unsafe_sat && course_id.force_sat ? false : `Click to hide warning`"
        @click.stop="$emit('force-sat', {year, quarter, idx})"
      >{{course_id.force_sat ? "Click to show warning" : "Missing:\n" + course_id.unsat}}</p>
    </transition>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CloseButtonVue from "@/components/utils/ActionButton.vue";
import { CourseJSON, FullCourseJSON, compute_color } from "@/fireroad";
import { ClassData } from '@/store/road';
export default Vue.extend({
  components: { CloseButtonVue },
  props: { course_id: Object as () => ClassData, year: Number, quarter: Number, idx: Number },
  computed: {
    course(): CourseJSON | undefined {
      return this.$store.getters["classes/class"](this.course_id.name);
    },
    name(): string {
      return this.course!.title;
    },
    display_name(): string {
      return this.truncate_name(this.name);
    },
    color(): string {
      return `hsl(${compute_color(this.course_id.name)}deg, 75%, 45%)`;
    },
    unsafe_sat(): boolean {
      return !this.course || this.year === -1;
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
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
  position: relative;
  transition: box-shadow 300ms;
}
.card > h3 {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
.card:hover {
  --button-visible: 1;
}
[unsat] {
  box-shadow: 5px 5px 5px #00000044, 0px 0px 5px 10px #ff0000;
}
.unsat {
  position: absolute;
  top: 75%;
  content: attr(data-content);
  white-space: pre-line;
  z-index: 1;
  background-color: hsl(0deg, 75%, 50%);
  padding: 5px;
  border-radius: 5px;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms, background-color 300ms;
}
.card:hover .unsat {
  opacity: 1;
  pointer-events: all;
}
.card:hover .unsat:hover {
  background-color: hsl(0deg, 75%, 40%);
}
.card:hover .unsat:active {
  background-color: hsl(0deg, 75%, 30%);
}
</style>