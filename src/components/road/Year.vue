<template>
  <article class="year">
    <span class="year-header">{{`Year ${idx+1}`}}</span>
    <section v-for="(quarter, i) in year" :key="`year ${idx} quarter ${i}`">
      <span class="quarter-header">{{quarter_label(i)}}</span>
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