<template>
  <main>
    <aside class="requirements">
      <!--TODO Requirements-->
    </aside>
    <section>
      <span class="header">
        <span class="auth">TODO Auth Stuff</span>
        <search-vue class="search" @load-course="inspect"></search-vue>
      </span>
      <nav class="roads">
        <span class="road-list">
          <span
            v-for="(name, idx) in roadNames"
            :key="idx"
            class="road-title"
            :selected="viewing===idx"
            @click="view(idx)"
            @dblclick="edit(idx)"
          >
            <p v-if="editing!==idx">{{name}}</p>
            <input
              type="text"
              name="road-editor"
              id="road-editor"
              v-model="editingText"
              @keydown.enter="editing=-1"
              @blur="editing=-1"
              @click.stop
              v-else
            />
          </span>
          <i v-if="viewing===-1">Create a new road! ---></i>
        </span>
        <button class="new-road" @click="newRoad">+</button>
      </nav>
      <article v-if="viewing!==-1" class="road-display">
        <year-vue v-for="(year, idx) in years" :key="`year ${idx}`" :year="year" :idx="idx"></year-vue>
      </article>
      <article v-else class="no-roads">
        <i>Let's get started!</i>
      </article>
    </section>
    <info-vue
      v-if="inspecting"
      class="info"
      :id="inspecting"
      :max="maximize_info"
      @close-info="inspecting=''"
      @toggle-max="toggle_max"
    ></info-vue>
  </main>
</template>
<script lang="ts">
import Vue from "vue";
import YearVue from "./road/Year.vue";
import SearchVue from "./road/Search.vue";
import InfoVue from "./road/Info.vue";
export default Vue.extend({
  created() {
    this.$store.dispatch("classes/init");
  },
  components: { YearVue, SearchVue, InfoVue },
  data() {
    return {
      editing: -1,
      editingText: "Untitled",
      inspecting: "",
      maximize_info: false
    };
  },
  watch: {
    editingText(next) {
      if (this.editing > -1) {
        this.$store.commit("roads/update_name", {
          road: this.editing,
          name: this.editingText
        });
      }
    }
  },
  computed: {
    viewing(): number {
      return this.$store.state.roads.viewing;
    },
    viewableRoad(): boolean {
      return this.viewing > -1;
    },
    roadNames(): string[] {
      return this.$store.state.roads.course_roads.map(
        (tup: [string, any]) => tup[0]
      );
    },
    years(): string[][] {
      return this.$store.state.roads.course_roads[this.viewing][1].years;
    }
  },
  methods: {
    newRoad(input: any) {
      this.editing = this.$store.state.roads.course_roads.length;
      this.editingText = "Untitled";
      this.$store.commit("roads/new_road", this.editingText);
      this.$nextTick(() => (input.target as any).focus());
    },
    view(idx: number) {
      if (idx !== this.viewing) {
        this.$store.state.roads.viewing = idx;
        this.editing = -1;
      }
    },
    edit(idx: number) {
      this.editing = idx;
      this.editingText = this.$store.state.roads.course_roads[idx][0];
    },
    inspect(course: string) {
      this.$store.dispatch("classes/load", course);
      this.inspecting = course;
    },
    close_info() {
      this.inspecting = "";
      this.maximize_info = false;
    },
    toggle_max() {
      this.maximize_info = !this.maximize_info;
    }
  }
});
</script>
<style scoped>
main {
  display: flex;
  flex-flow: row nowrap;
  flex: 1;
}
.requirements {
  flex: 0.25;
  display: flex;
  flex-flow: column nowrap;
  background-color: #dddddd;
}
.requirements + * {
  flex: 0.75;
  display: flex;
  flex-flow: column nowrap;
}
.header {
  display: flex;
  flex-flow: row nowrap;
}
.roads {
  display: flex;
  flex-flow: row nowrap;
}
.road-list {
  display: flex;
  flex-flow: row wrap;
  flex: 1;
  background-color: #eeeeee;
  overflow: auto;
}
.road-title {
  flex-basis: 150px;
  flex-grow: 0;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.road-title[selected] {
  background-color: #0088ff44;
}
.new-road {
  font-size: 2em;
  height: 1.5em;
  width: 1.5em;
  border: none;
  cursor: pointer;
}
.new-road:hover {
  background-color: #0088ff44;
}
.new-road:active {
  background-color: #0088ff88;
}
.road-display,
.no-roads {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
}
.no-roads {
  justify-content: center;
  align-items: center;
}
i {
  display: flex;
  align-items: center;
  padding: 10px;
}
.auth {
  flex: 1;
}
input {
  border: solid #dddddd 1px;
  border-radius: 5px;
  padding: 5px;
  margin: 5px;
  width: 80%;
}
.search {
  width: 500px;
}
.info {
  position: fixed;
  width: 30vw;
  height: 40vh;
  right: 0;
  bottom: 0;
}
.info[max] {
  width: 75vw;
  height: 100vh;
}
</style>