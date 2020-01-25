<template>
  <article class="prior-credit" @mouseup="outer_mouse_up" @mousemove="$emit('drag-move', {year:-1, quarter:0})">
    <span class="prior-credit-header" :collapsed="collapse" @mouseup.stop="header_mouse_up">
      <b>Prior Credit</b>
      <p>{{unit_count}}</p>
      <span class="spacer"></span>
      <div v-if="collapse" class="collapsed-classes">
        <mini-card-vue
          v-for="(course, j) in classes"
          :key="`Prior credit: ${j}`"
          :course_id="course"
          :year="-1"
          :quarter="0"
          :idx="j"
          @drag-start="$emit('drag-start', $event)"
        ></mini-card-vue>
      </div>
    </span>
    <div
      v-if="!collapse"
      class="prior-credit-classes"
      :allowed="!!placing"
      :forbidden="forbidden"
    >
      <card-vue
        v-for="(course, j) in classes"
        :key="`Prior credit: ${j}`"
        :course_id="course"
        :year="-1"
        :quarter="0"
        :idx="j"
        @drag-start="$emit('drag-start', $event)"
        @remove-course="remove(j)"
      ></card-vue>
    </div>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import MiniCardVue from "./MiniCard.vue";
import CardVue from "./Card.vue";
import { CourseJSON } from "@/fireroad";
import { ClassData } from "@/store/road";
export default Vue.extend({
  components: { MiniCardVue, CardVue },
  props: {
    classes: Array as () => ClassData[],
    placing: String
  },
  data() {
    return { collapse: false };
  },
  computed: {
    unit_count(): string {
      if (!this.$store.state.classes.manifest_tracker) {
        return "Loading Total Unit Count...";
      }
      const sum = this.classes
        .map(id => this.$store.getters["classes/class"](id.name).total_units)
        .reduce((run, next) => run + next, 0);
      return `Units: ${sum}`;
    },
    forbidden(): boolean {
      return this.classes.findIndex(c => c.name === this.placing) !== -1;
    }
  },
  methods: {
    remove(j: number) {
      this.$emit("remove-course", { year: -1, quarter: 0, idx: j });
    },
    toggle_collapse() {
      this.collapse = !this.collapse;
      this.$emit("graph-redraw");
    },
    header_mouse_up() {
      if (!this.placing) {
        this.toggle_collapse();
      } else {
        this.outer_mouse_up();
      }
    },
    outer_mouse_up() {
      this.$emit("drag-end", { year: -1, quarter: 0 });
    }
  }
});
</script>
<style scoped>
.prior-credit-header {
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
  min-height: 2.5em;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5em;
}
.prior-credit-header:hover {
  background-color: hsla(var(--contrast), calc(var(--level) * 3));
}
.spacer {
  flex-grow: 1;
}
.prior-credit-header::after {
  content: "";
  border-right: solid hsl(var(--contrast)) 2px;
  border-top: solid hsl(var(--contrast)) 2px;
  height: 0.5em;
  width: 0.5em;
  transform: rotate(135deg);
  transition: transform 300ms;
}
[collapsed]::after {
  transform: rotate(-45deg);
}
.prior-credit {
  display: flex;
  flex-flow: column nowrap;
}
.prior-credit-classes {
  display: flex;
  flex: 1;
  flex-basis: 150px;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-evenly;
}
.prior-credit-classes[allowed] {
  background-color: #00ff0022;
  cursor: var(--accept);
}
.prior-credit-classes[allowed]:hover {
  background-color: #00ff0044;
}
.prior-credit-classes[forbidden] {
  background-color: #ff000022;
  cursor: var(--accept);
}
.prior-credit-classes[forbidden]:hover {
  background-color: #ff000044;
}
.prior-credit-header > p {
  padding: 0 10px;
}
.collapsed-classes {
  display: flex;
  flex-flow: row wrap;
  padding: 10px;
  max-width: 87.5%;
}
</style>