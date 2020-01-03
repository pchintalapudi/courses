<template>
  <article class="year">
    <span class="year-header" @click="full_collapse=!full_collapse">
      <b>{{`Year ${idx+1}`}}</b>
      <div class="collapsible" :collapsed="full_collapse"></div>
    </span>
    <article v-if="!full_collapse" class="year-body">
      <section v-for="(quarter, i) in year" :key="`year ${idx} quarter ${i}`" class="quarter">
        <span class="quarter-header" @click="collapsed.splice(i, 1, !collapsed[i])">
          <i>{{quarter_label(i)}}</i>
          <p>{{unit_count(i)}}</p>
          <p>{{hour_count(i)}}</p>
          <div class="collapsible" :collapsed="collapsed[i]"></div>
        </span>
        <div
          v-if="!collapsed[i]"
          class="quarter-classes"
          :allowed="placing!==''&&allow(i)"
          :forbidden="placing!==''&&forbid(i)"
          :loading="placing!==''&&!allowed"
          @click="$emit('place-course', i)"
        >
          <card-vue
            v-for="(course, j) in quarter"
            :key="`year ${idx} quarter ${i} course ${j}`"
            :course_id="course"
            @load-course="$emit('load-course', $event)"
            @remove-course="remove(idx, i, j)"
            :year="idx"
            :quarter="i"
            :idx="j"
          ></card-vue>
        </div>
      </section>
    </article>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CardVue from "./Card.vue";
import { Road } from "@/store/road";
export default Vue.extend({
  components: { CardVue },
  props: {
    year: Array as () => string[][],
    idx: Number,
    placing: String,
    allowed: Array as () => boolean[]
  },
  data() {
    return { collapsed: [false, true, false, true], full_collapse: false };
  },
  methods: {
    quarter_label(idx: 0 | 1 | 2 | 3) {
      switch (idx) {
        case 0:
          return "Fall";
        case 1:
          return "IAP";
        case 2:
          return "Spring";
        case 3:
          return "Summer";
      }
    },
    allow(i: number) {
      return (
        this.allowed &&
        this.allowed[i] &&
        this.year[i].indexOf(this.placing) === -1
      );
    },
    forbid(i: number) {
      return (
        this.allowed &&
        (!this.allowed[i] || this.year[i].indexOf(this.placing) !== -1)
      );
    },
    unit_count(quarter: number): string {
      if (!this.$store.state.classes.manifest_updated) {
        return "Loading Total Unit Count...";
      }
      const sum = this.year[quarter]
        .map(id => this.$store.state.classes.manifest.get(id)!.total_units)
        .reduce((run, next) => run + next, 0);
      return `Units: ${sum}`;
    },
    hour_count(quarter: number): string {
      if (!this.$store.state.classes.manifest_updated) {
        return "Loading Total Hour Count...";
      }
      const hours = this.year[quarter]
        .map(id => this.$store.state.classes.manifest.get(id))
        .map(cls =>
          cls.in_class_hours !== undefined &&
          cls.out_of_class_hours !== undefined
            ? cls.in_class_hours + cls.out_of_class_hours
            : Number.NaN
        );
      const nan = hours.reduce((old, next) => old || Number.isNaN(next), false);
      const sum = hours.reduce((old, next) => old + next || 0, 0);
      return `Hours: ${nan ? "≥" : ""}${Number(sum.toFixed(2))}`;
    },
    remove(year: number, quarter: number, idx: number) {
      this.$emit("remove-course", { year, quarter, idx });
    }
  }
});
</script>
<style scoped>
.year {
  display: flex;
  flex: 1;
  flex-flow: column nowrap;
}
.year-header,
.quarter-header {
  background-color: #ffffff10;
  height: 2.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 0.5em;
}
.collapsible {
  border-right: solid white 2px;
  border-top: solid white 2px;
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
.quarter-header {
  background-color: #ffffff08;
  flex-grow: 0;
}
.quarter {
  display: flex;
  flex-flow: column nowrap;
}
.quarter-classes {
  display: flex;
  flex: 1;
  transition: background-color 500ms;
  flex-basis: 150px;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-evenly;
}
.quarter-classes[loading] {
  background-color: #ffff0022;
  cursor: pointer;
}
.quarter-classes[allowed] {
  background-color: #00ff0022;
  cursor: pointer;
}
.quarter-classes[forbidden] {
  background-color: #ff000022;
  cursor: pointer;
}
.quarter-classes[loading]:hover {
  background-color: #ffff0044;
}
.quarter-classes[allowed]:hover {
  background-color: #00ff0044;
}
.quarter-classes[forbidden]:hover {
  background-color: #ff000044;
}
.quarter-header > p {
  padding: 0 10px;
}
</style>