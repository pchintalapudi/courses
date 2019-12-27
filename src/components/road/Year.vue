<template>
  <article class="year">
    <span class="year-header">
      <b>{{`Year ${idx+1}`}}</b>
      <div class="collapsible"></div>
    </span>
    <section v-for="(quarter, i) in year" :key="`year ${idx} quarter ${i}`">
      <span class="quarter-header"><i>{{quarter_label(i)}}</i><div class="collapsible"></div></span>
      <div>
        <card-vue
          v-for="course in quarter"
          :key="`year ${idx} quarter ${i} course ${course}`"
          :course_id="course"
        ></card-vue>
      </div>
    </section>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CardVue from "./Card.vue";
import { Road } from "@/store/road";
export default Vue.extend({
  components: { CardVue },
  props: { year: Array as () => string[][], idx: Number },
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
.year-header, .quarter-header {
  background-color: #dddddd;
  height: 1.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.year-header>b, .quarter-header>i {
    flex: 1;
    padding: 10px;
}
.collapsible {
  border-right: solid black 2px;
  border-top: solid black 2px;
  height: .5em;
  width: .5em;
  transform: rotate(135deg) translateX(0.7071em) translateY(0.7071em);
}
.quarter-header {
  background-color: #eeeeee;
}
</style>