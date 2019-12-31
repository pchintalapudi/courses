<template>
  <article class="prior-credit">
    <span class="prior-credit-header">
      <b>Prior Credit</b>
      <p>{{unit_count}}</p>
      <div class="collapsible" :collapsed="collapse"></div>
    </span>
    <div
      v-if="!collapse"
      class="prior-credit-classes"
      :allowed="!!placing"
      @click="$emit('place-course')"
    >
      <card-vue
        v-for="(course, j) in classes"
        :key="`Prior credit: ${j}`"
        :course_id="course"
        @load-course="$emit('load-course', $event)"
        @remove-course="remove(j)"
      ></card-vue>
    </div>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CardVue from "./Card.vue";
import { CourseJSON } from "@/fireroad";
export default Vue.extend({
  components: { CardVue },
  props: { classes: Array as () => string[], placing: String },
  data() {
    return { collapse: false };
  },
  computed: {
    unit_count(): string {
      if (!this.$store.state.classes.manifest_updated) {
        return "Loading Total Unit Count...";
      }
      const sum = this.classes
        .map(id => this.$store.state.classes.manifest.get(id)!.total_units)
        .reduce((run, next) => run + next, 0);
      return `Units: ${sum}`;
    }
  },
  methods: {
    remove(j: number) {
      this.$store.commit("remove_course", { year: -1, quarter: 0, idx: j });
    }
  }
});
</script>
<style scoped>
.prior-credit-header {
  background-color: #dddddd;
  height: 2.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 0.5em;
}
.collapsible {
  border-right: solid black 2px;
  border-top: solid black 2px;
  height: 0.5em;
  width: 0.5em;
  transform: rotate(135deg);
  transition: transform 300ms;
  position: absolute;
  right: 1em;
}
.collapsible[collapsed] {
  transform: rotate(-45deg);
}
.prior-credit {
  display: flex;
  flex-flow: column nowrap;
}
.prior-credit-classes {
  display: flex;
  flex: 1;
  transition: background-color 500ms;
  flex-basis: 150px;
  flex-flow: row wrap;
  background-color: white;
  align-items: center;
  justify-content: space-evenly;
}
.prior-credit-classes[allowed] {
  background-color: #00ff0022;
  cursor: pointer;
}
.prior-credit-classes[allowed]:hover {
  background-color: #00ff0044;
}
.prior-credit-header > p {
  padding: 0 10px;
}
</style>