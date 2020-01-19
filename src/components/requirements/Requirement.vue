<template>
  <article>
    <template v-if="is_req">
      <h3
        class="req"
        :completed="req.fulfilled"
        :override="can_override && overriden"
        @click="override"
      >{{req.req}}</h3>
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
          :key="name + '.' + i"
          :req="child"
          :idx="idx"
          :name="name + '.' + i"
          :overrides="overrides"
          @req-override="$emit('req-override', $event)"
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
    name: String,
    idx: Number,
    overrides: Array as () => any[]
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
    can_override(): boolean {
      return this.is_req && !!this.req.threshold;
    },
    overriden(): boolean {
      return this.overrides.findIndex(obj => this.name in obj) !== -1;
    }
  },
  methods: {
    override() {
      if (this.can_override) {
        const obj: any = {};
        obj[this.name] = this.req.threshold!.cutoff;
        obj.idx = this.idx;
        this.$emit("req-override", obj);
      }
    }
  },
  name: "requirement-vue"
});
</script>
<style scoped>
.req-header {
  margin-left: -2em;
}
.req,
.req-header {
  font-size: 1rem;
  position: relative;
  min-width: 200px;
  padding: 5px;
  cursor: pointer;
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
  border: solid hsl(var(--contrast)) var(--height);
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
[override][completed]::before {
  border-color: hsl(60deg, 75%, 50%);
  border-right-color: transparent;
  border-top-color: transparent;
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
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
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