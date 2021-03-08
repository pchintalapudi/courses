<template>
  <article class="year">
    <span class="year-header" :collapsed="full_collapse" @mouseup.stop="year_header_up">
      <b>{{`Year ${idx+1}`}}</b>
      <span class="spacer"></span>
      <div v-if="full_collapse" class="collapsed-year">
        <mini-card-vue
          v-for="course in courses"
          :key="course.key"
          :course_id="course.course"
          :year="idx"
          :quarter="course.quarter"
          :idx="course.idx"
          @drag-start="$emit('drag-start', $event)"
        ></mini-card-vue>
      </div>
      <close-button-vue @button-click="$emit('remove-year', idx)" :close="true"></close-button-vue>
    </span>
    <article v-if="!full_collapse" class="year-body">
      <section
        v-for="(quarter, i) in year"
        :key="`year ${idx} quarter ${i}`"
        class="quarter"
        @mouseup.stop="quarter_up(i)"
        @mousemove="$emit('drag-move', {year:idx, quarter:i})"
      >
        <span class="quarter-header" :collapsed="collapsed[i]" @mouseup.stop="quarter_header_up(i)">
          <i>{{quarter_label(i)}}</i>
          <p>{{unit_count(i)}}</p>
          <p>{{hour_count(i)}}</p>
          <span class="spacer"></span>
          <div v-if="collapsed[i]" class="collapsed-quarter">
            <mini-card-vue
              v-for="(course, j) in quarter"
              :key="`year ${idx} quarter ${i} course ${j}`"
              :course_id="course"
              :year="idx"
              :quarter="i"
              :idx="j"
              @drag-start="$emit('drag-start', $event)"
            ></mini-card-vue>
          </div>
        </span>
        <div
          v-if="!collapsed[i]"
          class="quarter-classes"
          :allowed="placing!==''&&allow(i)"
          :forbidden="placing!==''&&forbid(i)"
          :loading="placing!==''&&!allowed"
        >
          <card-vue
            v-for="(course, j) in quarter"
            :key="`year ${idx} quarter ${i} course ${j}`"
            :course_id="course"
            @remove-course="remove(idx, i, j)"
            @force-sat="$emit('force-sat', $event)"
            :year="idx"
            :quarter="i"
            :idx="j"
            @drag-start="$emit('drag-start', $event)"
          ></card-vue>
        </div>
      </section>
    </article>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CardVue from "./Card.vue";
import MiniCardVue from "./MiniCard.vue";
import CloseButtonVue from "@/components/utils/ActionButton.vue";
import { Road, ClassData } from "@/store/road";
export default Vue.extend({
  components: { MiniCardVue, CardVue, CloseButtonVue },
  props: {
    year: Array as () => ClassData[][],
    idx: Number,
    placing: String,
    allowed: Array as () => boolean[]
  },
  data() {
    return { collapsed: [false, true, false, true], full_collapse: false };
  },
  computed: {
    courses(): Array<{
      quarter: number;
      idx: number;
      key: string;
      course: ClassData;
    }> {
      const out = [];
      const map = new Map<string, number>();
      for (let quarter = 0; quarter < this.year.length; quarter++) {
        for (let idx = 0; idx < this.year[quarter].length; idx++) {
          const course = this.year[quarter][idx];
          if (!map.has(course.name)) {
            map.set(course.name, 1);
          } else {
            map.set(course.name, map.get(course.name)! + 1);
          }
          out.push({
            quarter,
            idx,
            key: `${this.idx} ${quarter} ${idx} ${map.get(
              this.year[quarter][idx].name
            )!}`,
            course
          });
        }
      }
      return out;
    }
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
        this.year[i].findIndex(d => d.name === this.placing) === -1
      );
    },
    forbid(i: number) {
      return (
        this.allowed &&
        (!this.allowed[i] ||
          this.year[i].findIndex(d => d.name === this.placing) !== -1)
      );
    },
    unit_count(quarter: number): string {
      if (!this.$store.state.classes.manifest_tracker) {
        return "Loading Total Unit Count...";
      }
      const sum = this.year[quarter]
        .map(id => this.$store.getters["classes/class"](id.name).total_units)
        .filter(id => id === id)
        .reduce((run, next) => run + next, 0);
      return `Units: ${sum}`;
    },
    hour_count(quarter: number): string {
      if (!this.$store.state.classes.manifest_tracker) {
        return "Loading Total Hour Count...";
      }
      const hours = this.year[quarter]
        .map(id => this.$store.getters["classes/class"](id.name))
        .map(cls =>
          cls.in_class_hours !== undefined &&
          cls.out_of_class_hours !== undefined
            ? cls.in_class_hours + cls.out_of_class_hours
            : Number.NaN
        );
      const nan = hours.reduce((old, next) => old || next !== next, false);
      const sum = hours.reduce((old, next) => old + (next || 0), 0);
      return `Hours: ${nan ? "≥" : ""}${Number(sum.toFixed(2))}`;
    },
    remove(year: number, quarter: number, idx: number) {
      this.$emit("remove-course", { year, quarter, idx });
    },
    toggle_collapse(i: number) {
      this.collapsed.splice(i, 1, !this.collapsed[i]);
      this.$emit("graph-redraw", { year: this.idx, quarter: i });
    },
    toggle_full() {
      this.full_collapse = !this.full_collapse;
      this.$emit("graph-redraw", { year: this.idx, quarter: 0 });
    },
    year_header_up() {
      if (this.placing) {
        if (this.full_collapse) {
          this.toggle_full();
        }
      } else {
        this.toggle_full();
      }
    },
    quarter_up(quarter: number) {
      this.$emit("drag-end", { year: this.idx, quarter });
    },
    quarter_header_up(quarter: number) {
      if (this.placing) {
        this.quarter_up(quarter);
      } else {
        this.toggle_collapse(quarter);
      }
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
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
  min-height: 2.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5em;
}
.year-header {
  --button-visible: 0;
}
.year-header:hover {
  --button-visible: 1;
}
.year-header:hover,
.quarter-header:hover {
  background-color: hsla(var(--contrast), calc(var(--level) * 4));
}
.spacer {
  flex-grow: 1;
}
.year-header::after,
.quarter-header::after {
  content: "";
  border-right: solid hsl(var(--contrast)) 2px;
  border-top: solid hsl(var(--contrast)) 2px;
  height: 0.5em;
  width: 0.5em;
  transform: rotate(135deg);
  transition: transform 300ms;
  margin: 0 10px;
}
[collapsed]::after {
  transform: rotate(-45deg);
}
.quarter-header {
  background-color: hsla(var(--contrast), calc(var(--level)));
  flex-grow: 0;
  cursor: var(--accept);
}
.quarter {
  display: flex;
  flex-flow: column nowrap;
}
.quarter-classes {
  display: flex;
  flex: 1;
  flex-basis: 150px;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-evenly;
}
.quarter-classes[loading] {
  background-color: #ffff0022;
  cursor: var(--accept);
}
.quarter-classes[allowed] {
  background-color: #00ff0022;
  cursor: var(--accept);
}
.quarter-classes[forbidden] {
  background-color: #ff000022;
  cursor: var(--accept);
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
.collapsed-quarter,
.collapsed-year {
  display: flex;
  flex-flow: row wrap;
  max-width: 62.5%;
  padding: 10px;
}
.collapsed-year {
  max-width: 87.5%;
}
</style>