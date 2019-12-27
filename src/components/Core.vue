<template>
  <main>
    <aside>
      <!--TODO Requirements-->
    </aside>
    <section>
      <span>
        <!--TODO Header-->
      </span>
      <nav>
        <!--TODO Road Navigation-->
      </nav>
      <road-vue></road-vue>
    </section>
  </main>
</template>
<script lang="ts">
import Vue from "vue";
import RoadVue from "./road/Road.vue";
export default Vue.extend({
  components: { RoadVue }
});
</script>