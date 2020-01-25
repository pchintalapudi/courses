<template>
  <section>
    <span class="header">
      <search-vue class="search" @load-course="$emit('load-course', $event)"></search-vue>
    </span>
    <nav class="roads">
      <span class="road-list">
        <template v-if="road">
          <span
            v-for="(name, idx) in road_names"
            :key="idx"
            class="road-title"
            :selected="road.name===name"
            @click="view(idx)"
            @dblclick="edit(idx)"
          >
            <p class="road-title" v-if="editing!==idx">
              <b>{{name}}</b>
              <action-button-vue @button-click="remove_road(idx)" :close="true"></action-button-vue>
            </p>
            <input
              type="text"
              name="road-editor"
              id="road-editor"
              v-model="editing_text"
              @keydown.enter="finish_editing"
              @blur="finish_editing"
              @click.stop
              v-else
            />
          </span>
        </template>
        <i v-else>Create a new road! ---></i>
      </span>
      <action-button-vue @button-click="new_road" :close="false"></action-button-vue>
    </nav>
  </section>
</template>
<script lang="ts">
import Vue from "vue";
import SearchVue from "../road/Search.vue";
import ActionButtonVue from "../utils/ActionButton.vue";
import { Road } from "@/store/road";
export default Vue.extend({
  components: { ActionButtonVue, SearchVue },
  props: { viewing: Number, road: Object as () => Road | undefined },
  data() {
    return {
      editing: -1,
      editing_text: "Untitled"
    };
  },
  watch: {
    editing_text(next) {
      if (this.editing > -1) {
        this.$store.dispatch("roads/update_name", {
          road: this.editing,
          name: this.editing_text
        });
      }
    }
  },
  computed: {
    road_names(): string[] {
      return this.$store.state.roads.course_roads.map(
        (road: Road) => road.name
      );
    }
  },
  methods: {
    finish_editing() {
      this.editing = -1;
      this.$store.dispatch("roads/save");
    },
    new_road(input: any) {
      this.graph_redraw();
      if (this.editing !== -1) {
        this.$store.dispatch("roads/save");
      }
      this.editing = this.$store.state.roads.course_roads.length;
      this.editing_text = "Untitled";
      this.$store.dispatch("roads/new_road", this.editing_text);
      this.compute_sat();
    },
    remove_road(idx: number) {
      this.graph_redraw();
      this.$store.dispatch("roads/delete_road", idx);
      this.compute_sat();
    },
    view(idx: number) {
      if (idx !== this.viewing) {
        this.graph_redraw();
        this.$store.dispatch("roads/view", idx);
        if (this.editing !== -1) {
          this.$store.dispatch("roads/save");
        }
        this.editing = -1;
        this.load_classes();
        this.update_progresses();
        this.compute_sat();
      }
    },
    edit(idx: number) {
      this.editing = idx;
      this.editing_text = this.$store.state.roads.course_roads[idx].name;
    },
    graph_redraw() {
      this.$emit("graph-redraw");
    },
    load_classes() {
      this.$emit("load-classes");
    },
    update_progresses() {
      this.$emit("update-progresses");
    },
    compute_sat() {
      this.$emit("compute-sat");
    }
  }
});
</script>
<style scoped>
.header {
  display: flex;
  flex-flow: row nowrap;
  padding: 0 10px;
}
.roads {
  display: flex;
  flex-flow: row nowrap;
  background-color: hsla(var(--contrast), var(--level));
}
.road-list {
  display: flex;
  flex-flow: row wrap;
  flex: 1;
  overflow: auto;
}
.road-title {
  flex-basis: 150px;
  flex-grow: 0;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  --button-visible: 0;
  padding: 5px;
}
.road-title:hover {
  --button-visible: 1;
}
.road-title[selected] {
  background-color: hsla(var(--contrast), calc(var(--level) * 4));
}
</style>