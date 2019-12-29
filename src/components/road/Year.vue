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
            v-for="course in quarter"
            :key="`year ${idx} quarter ${i} course ${course}`"
            :course_id="course"
            @load-course="$emit('load-course', $event)"
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
  background-color: #dddddd;
  height: 1.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}
.year-header > b,
.quarter-header > i {
  flex: 1;
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
.quarter-header {
  background-color: #eeeeee;
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
  background-color: white;
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
</style>