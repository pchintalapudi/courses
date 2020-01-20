<template>
  <section class="tree" v-if="has_reqs">
    <div
      class="progress"
      :fulfilled="!!reqs.reqs.fulfilled"
      :progress="reqs.reqs.percent_fulfilled !== undefined"
      :highlight="reqs.reqs.percent_fulfilled === 0 && !reqs.reqs.fulfilled"
      :style="reqs.reqs.percent_fulfilled !== undefined && `--progress:${reqs.reqs.percent_fulfilled / 100}`"
    >
      <h2
        @click="collapsed=!collapsed"
        :collapsed="collapsed"
      >{{reqs.loading ? 'Loading Title...' : reqs.reqs.short_title + " " + reqs.reqs.title}}</h2>
      <close-button-vue @button-click="$emit('remove-requirement')" :close="true"></close-button-vue>
    </div>
    <template v-if="(has_progress || has_requirement) && !collapsed">
      <requirement-vue
        v-for="(req, i) in reqs.reqs.reqs"
        :key="requirements.name + '.' + i"
        :req="req"
        :idx="idx"
        :name="requirements.name + '.' + i"
        :overrides="requirements.overrides"
        @req-override="$emit('req-override', $event)"
      ></requirement-vue>
    </template>
    <span v-else-if="!collapsed">Loading Requirements...</span>
  </section>
  <span v-else>Loading Requirements...</span>
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
import CloseButtonVue from "@/components/utils/ActionButton.vue";
import { RequirementData } from "@/store/road";
interface Requirements {
  loading: boolean;
  reqs: RequirementTitles;
}
export default Vue.extend({
  components: { RequirementVue, CloseButtonVue },
  props: {
    requirements: Object as () => RequirementData,
    idx: Number
  },
  data() {
    return { collapsed: true };
  },
  computed: {
    reqs(): Requirements | undefined {
      return this.$store.state.requirements.manifest.get(
        this.requirements.name
      );
    },
    has_requirement(): boolean {
      return (
        this.$store.state.requirements.manifest_tracker &&
        has_requirements(this.reqs!.reqs)
      );
    },
    has_progress(): boolean {
      return (
        this.$store.state.requirements.manifest_tracker &&
        has_progress(this.reqs!.reqs)
      );
    },
    as_progress(): ProgressJSON {
      return this.reqs!.reqs as ProgressJSON;
    },
    has_reqs(): boolean {
      return (
        this.$store.state.requirements.manifest_tracker &&
        this.reqs !== undefined
      );
    }
  }
});
</script>
<style scoped>
.progress {
  display: flex;
  flex-flow: row nowrap;
  position: relative;
  align-items: center;
}
.progress::before {
  box-sizing: content-box;
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
  top: 100%;
  margin-left: -2em;
  padding-right: 2em;
}
.progress::after {
  box-sizing: content-box;
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: hsl(60deg, 75%, 50%);
  top: 100%;
  margin-left: -2em;
  padding-right: 2em;
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 300ms, background-color 300ms;
}
[fulfilled][progress]::after {
  background-color: hsl(120deg, 75%, 50%);
}
[highlight][progress]::before {
  background-color: hsl(0deg, 75%, 50%);
}
[progress]::after {
  transform: scaleX(var(--progress));
}
h2 {
  font-size: 1rem;
  cursor: pointer;
  margin-left: -2em;
  position: relative;
  flex: 1;
  padding: 5px;
}
.tree {
  padding-left: 4em;
  --button-visible: 0;
}
.tree:hover {
  --button-visible: 1;
}
h2::before {
  content: "";
  position: absolute;
  left: -1em;
  top: 40%;
  border: solid transparent 0.375em;
  border-top: solid hsl(var(--contrast)) 0.375em;
  transform-origin: 0.375em 0.1875em;
  transition: transform 300ms, border-top-color 1s;
}
[collapsed]::before {
  transform: rotate(-90deg);
}
</style>