<template>
  <article>
    <template v-if="is_req">
      <h3 class="req" :completed="req.fulfilled">{{req.req}}</h3>
    </template>
    <section class="children" :collapsed="collapsed" v-else>
      <h3
        @click="collapsed=!collapsed"
        class="req-header"
        :fulfilled="!!req.fulfilled"
        :progress="req.percent_fulfilled !== undefined && req.sat_courses.length > 0"
        :style="req.percent_fulfilled !== undefined && `--progress:${req.percent_fulfilled / 100}`"
      >
        {{req.title}}
        <i>{{req.threshold_desc}} from</i>
      </h3>
      <template v-if="!collapsed">
        <requirement-vue
          v-for="(child, i) in children"
          :key="key_prefix + i"
          :req="child"
          :idx="i"
          :name="key_prefix + i"
        ></requirement-vue>
      </template>
    </section>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import { Requirement, RequirementGroup, is_requirement } from "@/fireroad/";
export default Vue.extend({
  props: {
    req: Object as () => Requirement | RequirementGroup,
    idx: Number,
    name: String
  },
  data() {
    return { collapsed: true };
  },
  computed: {
    is_req(): boolean {
      return is_requirement(this.req);
    },
    children(): Array<Requirement | RequirementGroup> {
      return (this.req as RequirementGroup).reqs;
    },
    key_prefix(): string {
      return this.name + this.idx;
    }
  },
  name: "requirement-vue"
});
</script>
<style scoped>
.req-header {
  cursor: pointer;
  margin-left: -2em;
}
.req,
.req-header {
  font-size: 1rem;
  position: relative;
  min-width: 200px;
  padding: 5px;
}
.children {
  padding-left: 2em;
  position: relative;
}
.req::before {
  content: "";
  position: absolute;
  left: -1em;
  --height: 1px;
  top: calc(50% - var(--height));
  bottom: calc(50% - var(--height));
  width: 0.75em;
  border: solid hsl(0, 0%, 80%) var(--height);
  transition: border-color 300ms, border-width 300ms, border-style 300ms,
    top 300ms, bottom 300ms, transform 300ms;
}
[completed]::before {
  border-color: hsl(120deg, 75%, 50%);
  border-right-color: transparent;
  border-top-color: transparent;
  border-bottom-style: solid;
  border-left-style: solid;
  --height: 3px;
  transform: translateY(-3px) translateX(-3px) rotate(-45deg);
}
.children::before {
  content: "";
  position: absolute;
  left: -1em;
  top: 0.625em;
  border: solid transparent 0.375em;
  border-top: solid white 0.375em;
  transform-origin: 0.375em 0.1875em;
  transition: transform 300ms;
}
[collapsed]::before {
  transform: rotate(-90deg);
}
[fulfilled][progress]::after {
  background-color: hsl(120deg, 75%, 50%);
}
.req-header::before,
.req-header::after {
  content: "";
  width: 100%;
  height: 2px;
  transform-origin: left;
  background-color: #ffffff18;
  position: absolute;
  top: 100%;
  left: 0;
}
.req-header::after {
  transform: scaleX(0);
  transition: transform 300ms, background-color 300ms;
}
[progress]::after {
  background-color: hsl(60deg, 75%, 50%);
  transform: scaleX(var(--progress));
}
</style>