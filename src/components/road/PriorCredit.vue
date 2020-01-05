<template>
  <article class="prior-credit">
    <span class="prior-credit-header" :collapsed="collapse" @click="toggle_collapse">
      <b>Prior Credit</b>
      <p>{{unit_count}}</p>
      <span class="spacer"></span>
      <div v-if="collapse" class="collapsed-classes">
        <mini-card-vue
          v-for="(course, j) in classes"
          :key="`Prior credit: ${j}`"
          :course_id="course"
          @load-course="$emit('load-course', $event)"
          :year="-1"
          :quarter="0"
          :idx="j"
        ></mini-card-vue>
      </div>
    </span>
    <div
      v-if="!collapse"
      class="prior-credit-classes"
      :allowed="!!placing"
      :forbidden="!!placing && classes.includes(placing)"
      @click="$emit('place-course')"
    >
      <card-vue
        v-for="(course, j) in classes"
        :key="`Prior credit: ${j}`"
        :course_id="course"
        @load-course="$emit('load-course', $event)"
        @remove-course="remove(j)"
        :year="-1"
        :quarter="0"
        :idx="j"
      ></card-vue>
    </div>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import MiniCardVue from "./MiniCard.vue";
import CardVue from "./Card.vue";
import { CourseJSON } from "@/fireroad";
export default Vue.extend({
  components: { MiniCardVue, CardVue },
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
      this.$emit("remove-course", { year: -1, quarter: 0, idx: j });
    },
    toggle_collapse() {
        this.collapse = !this.collapse;
        this.$emit("graph-redraw");
    }
  }
});
</script>
<style scoped>
.prior-credit-header {
  background-color: #ffffff10;
  min-height: 2.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5em;
  transition: background-color 300ms;
}
.prior-credit-header:hover {
  background-color: #ffffff18;
}
.spacer {
  flex-grow: 1;
}
.prior-credit-header::after {
  content: "";
  border-right: solid white 2px;
  border-top: solid white 2px;
  height: 0.5em;
  width: 0.5em;
  transform: rotate(135deg);
  transition: transform 300ms;
}
[collapsed]::after {
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
.prior-credit-classes[forbidden] {
  background-color: #ff000022;
  cursor: pointer;
}
.prior-credit-classes[forbidden]:hover {
  background-color: #ff000044;
  cursor: pointer;
}
.prior-credit-header > p {
  padding: 0 10px;
}
.collapsed-classes {
  display: flex;
  flex-flow: row wrap;
  padding: 10px;
  max-width: 87.5%;
}
</style>