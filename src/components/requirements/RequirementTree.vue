<template>
  <section class="tree">
    <h2
      @click="collapsed=!collapsed"
    ><div :collapsed="collapsed"></div>{{reqs.loading ? 'Loading Title...' : reqs.reqs.short_title + " " + reqs.reqs.title}}</h2>
    <div v-if="has_progress && !collapsed">
      <requirement-vue
        v-for="(req, idx) in reqs.reqs.reqs"
        :key="`requirement ${reqs.reqs.list_id} idx ${idx}`"
        :req="req"
        :idx="idx"
        :name="reqs.reqs.short_title + reqs.reqs.title"
      ></requirement-vue>
    </div>
    <span v-else-if="!collapsed">Loading Requirements...</span>
  </section>
</template>
<script lang="ts">
import Vue from "vue";
import {
  RequirementTitles,
  has_requirements,
  has_progress,
  RequirementsJSON,
  ProgressJSON
} from "@/fireroad";
import RequirementVue from "./Requirement.vue";
interface Requirements {
  loading: boolean;
  reqs: RequirementTitles;
}
export default Vue.extend({
  components: { RequirementVue },
  props: {
    requirements: String
  },
  data() {
    return { collapsed: true };
  },
  computed: {
    reqs(): Requirements {
      return this.$store.state.requirements.manifest.get(this.requirements);
    },
    has_progress(): boolean {
      return this.$store.state.requirements.manifest_tracker && has_progress(this.reqs.reqs);
    },
    as_progress(): ProgressJSON {
      return this.reqs.reqs as ProgressJSON;
    }
  }
});
</script>
<style scoped>
h2 {
  font-size: 1rem;
  cursor: pointer;
  margin-left: -2em;
  position: relative;
}
.tree {
    padding-left: 4em;
}
h2>div {
    position: absolute;
    left: -1em;
    width: 0.75em;
    height: 0.75em;
    top: 40%;
    border: solid transparent 0.375em;
    border-top:solid white 0.375em;
    transform-origin: 0.375em 0.1875em;
    transition: transform 300ms;
}
h2>[collapsed] {
    transform: rotate(-90deg);
}
</style>