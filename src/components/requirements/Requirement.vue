<template>
  <article>
    <section v-if="is_req">
      <h3 class="req"><div class="completion"></div>{{req.req}}</h3>
    </section>
    <section class="children" v-else>
      <h3 @click="collapsed=!collapsed" class="req-header"><div :collapsed="collapsed"></div>{{req.title}} <i>{{req.threshold_desc}} from</i></h3>
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
}
.req, .req-header {
    font-size: 1rem;
    position: relative;
    min-width: 200px;
}
.children {
    padding-left: 2em;
}
.req>.completion {
    position:absolute;
    left:-1em;
    top: calc(50% - 1px);
    bottom: calc(50% - 1px);
    width: 0.75em;
    background-color: black;
}
.req-header>div {
    position: absolute;
    left: -1em;
    width: 0.75em;
    height: 0.75em;
    top: 40%;
    border: solid transparent 0.375em;
    border-top:solid black 0.375em;
    transform-origin: 0.375em 0.1875em;
    transition: transform 300ms;
}
.req-header>[collapsed] {
    transform: rotate(-90deg);
}
</style>