<template>
  <section>
    <h2>{{reqs.loading ? 'Loading Title...' : reqs.reqs.short_title + reqs.reqs.title}}</h2>
    <div v-if="is_full">
        <requirement-vue v-for="(req, idx) in reqs.reqs.reqs" :key="`requirement ${reqs.reqs.list_id} idx ${idx}`" :req="req"></requirement-vue>
    </div>
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
    is_full(): boolean {
      return has_requirements(this.reqs.reqs);
    },
    has_progress(): boolean {
      return has_progress(this.reqs.reqs);
    },
    as_json(): RequirementsJSON {
      return this.reqs.reqs as RequirementsJSON;
    },
    as_progress(): ProgressJSON {
      return this.reqs.reqs as ProgressJSON;
    }
  }
});
</script>