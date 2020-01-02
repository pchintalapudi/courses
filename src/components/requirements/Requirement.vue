<template>
  <article>
    <section v-if="is_req">
      <h3 class="req">
        <div class="completion" :completed="req.fulfilled"></div>
        {{req.req}}
      </h3>
    </section>
    <section class="children" v-else>
      <h3
        @click="collapsed=!collapsed"
        class="req-header"
        :fulfilled="!!req.fulfilled"
        :progress="req.percent_fulfilled !== undefined && req.sat_courses.length > 0"
        :style="req.percent_fulfilled !== undefined && `--progress:${req.percent_fulfilled / 100}`"
      >
        <div :collapsed="collapsed"></div>
        {{req.title}}
        <i>{{req.threshold_desc}} from</i>
      <span class="progress"></span>
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
    return { collapsed: false };
  },
  computed: {
    is_req(): boolean {
      return is_requirement(this.req);
    },
    as_req(): Requirement {
      return this.req as Requirement;
    },
    as_group(): RequirementGroup {
      return this.req as RequirementGroup;
    },
    children(): Array<Requirement | RequirementGroup> {
      return this.as_group.reqs;
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
  display: flex;
  flex-flow: row wrap;
}
.req,
.req-header {
  font-size: 1rem;
  position: relative;
  min-width: 200px;
}
.children {
  padding-left: 2em;
}
.req > .completion {
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
.req > [completed] {
  border-color: hsl(120deg, 75%, 50%);
  border-right-color: transparent;
  border-top-color: transparent;
  border-bottom-style: solid;
  border-left-style: solid;
  --height: 2px;
  transform: translateY(-3px) rotate(-45deg);
}
.req-header > div {
  position: absolute;
  left: -1em;
  width: 0.75em;
  height: 0.75em;
  top: 40%;
  border: solid transparent 0.375em;
  border-top: solid white 0.375em;
  transform-origin: 0.375em 0.1875em;
  transition: transform 300ms;
}
.req-header>i {
    padding-left: 10px;
}
.req-header > [collapsed] {
  transform: rotate(-90deg);
}
[fulfilled][progress] > .progress::before {
    background-color: hsl(120deg, 75%, 50%);
}
.progress {
    position:relative;
    width: 100%;
    transition: height 300ms, background-color 300ms;
}
.progress::before {
    width: 100%;
    height: 100%;
    transform-origin: left;
}
[progress] > .progress::before {
    position: absolute;
    background-color: hsl(60deg, 75%, 50%);
    content:"";
    transform: scaleX(var(--progress));
    transition: transform 300ms, background-color 300ms;
}
[progress] > .progress {
    background-color: #ffffff18;
    height: 2px;
}
</style>