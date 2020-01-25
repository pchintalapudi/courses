<template>
  <aside class="requirements">
    <requirement-search-vue :disable="!road" @load-requirement="add_requirement"></requirement-search-vue>
    <section class="reqs" v-if="road">
      <requirement-tree-vue
        v-for="(req, idx) in requirements"
        :key="`Requirement ${req.name}`"
        :requirements="req"
        :idx="idx"
        @remove-requirement="remove_req(idx)"
        @req-override="override"
      ></requirement-tree-vue>
    </section>
    <section v-else>
      <i>Add some requirements!</i>
    </section>
  </aside>
</template>
<script lang="ts">
import Vue from "vue";
import RequirementTreeVue from "../requirements/RequirementTree.vue";
import RequirementSearchVue from "../requirements/RequirementSearch.vue";
import { Road } from "@/store/road";
import { Requirements } from "@/store/requirements";
export default Vue.extend({
  components: {
    RequirementTreeVue,
    RequirementSearchVue
  },
  props: {
    road: Object as () => Road | undefined,
    requirements: Array as () => Requirements[] | undefined,
    overrides: Object as () => any | undefined
  },
  methods: {
    add_requirement(req: string) {
      this.$store.dispatch("roads/add_requirement", req);
      this.update_progresses();
    },
    remove_req(idx: number) {
      this.$store.dispatch("roads/remove_requirement", idx);
    },
    override(obj: any) {
      const idx = obj.idx;
      this.$store.dispatch("roads/toggle_override", obj);
      this.update_progresses(idx);
    },
    update_progresses(idx = -1) {
      this.$emit("update-progresses", idx);
    }
  }
});
</script>
<style scoped>
.reqs {
  overflow: auto;
  flex: 1;
}
</style>