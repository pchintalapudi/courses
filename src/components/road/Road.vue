<template>
  <article>
    <year-vue v-for="(year, idx) in years" :key="`year ${idx}`" :year="year" :idx="idx"></year-vue>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import YearVue from "./Year.vue";
export default Vue.extend({
  components: { YearVue },
  computed: {
    years() {
      return this.$store.state.roads.course_roads[
        this.$store.state.roads.viewing
      ];
    }
  }
});
</script>