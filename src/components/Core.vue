<template>
  <main>
    <aside class="requirements">
      <requirement-search-vue :disable="viewing===-1" @load-requirement="add_requirement"></requirement-search-vue>
      <section class="reqs" v-if="viewing!==-1">
        <requirement-tree-vue
          v-for="req in requirements"
          :key="`Requirement ${req}`"
          :requirements="req"
        ></requirement-tree-vue>
      </section>
      <section v-else>
        <i>Add some requirements!</i>
      </section>
    </aside>
    <div class="gutter"></div>
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
        <prior-credit-vue
          :classes="prior_credit"
          :placing="inspecting"
          @load-course="inspect"
          @place-course="place(-1, 0)"
          @remove-course="remove_course"
        ></prior-credit-vue>
        <year-vue
          v-for="(year, idx) in years"
          :key="`year ${idx}`"
          :year="year"
          :idx="idx"
          :placing="inspecting"
          :allowed="allowed"
          @load-course="inspect"
          @place-course="place(idx, $event)"
          @remove-course="remove_course"
        ></year-vue>
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
      :idx="inspect_index"
      :length="inspection_history.length"
      @close-info="inspecting=''"
      @toggle-max="toggle_max"
      @push-course="push_course"
      @next-course="next_course"
      @prev-course="prev_course"
    ></info-vue>
  </main>
</template>
<script lang="ts">
import Vue from "vue";
import PriorCreditVue from "./road/PriorCredit.vue";
import YearVue from "./road/Year.vue";
import SearchVue from "./road/Search.vue";
import InfoVue from "./road/Info.vue";
import RequirementSearchVue from "./requirements/RequirementSearch.vue";
import RequirementTreeVue from "./requirements/RequirementTree.vue";
import { CourseJSON, RequirementTitles, RoadJSON, Class } from "@/fireroad";
import { Quarter } from "@/store/road";
export default Vue.extend({
  created() {
    this.$store.dispatch("classes/init");
    this.$store.dispatch("requirements/init");
  },
  components: {
    PriorCreditVue,
    YearVue,
    SearchVue,
    InfoVue,
    RequirementSearchVue,
    RequirementTreeVue
  },
  data() {
    return {
      editing: -1,
      editingText: "Untitled",
      inspecting: "",
      inspection_history: [] as string[],
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
    years(): string[][][] {
      return this.$store.state.roads.course_roads[this.viewing][1].years;
    },
    prior_credit(): string[] {
      return this.$store.state.roads.course_roads[this.viewing][1].prior_credit;
    },
    inspect_course(): CourseJSON | undefined {
      return this.$store.state.classes.manifest_updated
        ? this.$store.state.classes.manifest.get(this.inspecting)!
        : undefined;
    },
    inspect_index(): number {
      return this.inspection_history.indexOf(this.inspecting);
    },
    allowed(): [boolean, boolean, boolean, boolean] | undefined {
      return this.inspect_course
        ? [
            this.inspect_course.offered_fall,
            this.inspect_course.offered_IAP,
            this.inspect_course.offered_spring,
            this.inspect_course.offered_summer
          ]
        : undefined;
    },
    requirements(): string[] {
      return this.$store.state.roads.course_roads[this.viewing][1].requirements;
    },
    courses(): string[] {
      return this.years
        .flatMap(s => s.flatMap(a => a))
        .concat(this.prior_credit);
    },
    road_json(): RoadJSON {
      const priors = this.prior_credit.map((s, i) =>
        this.make_class(s, 0, -1, i)
      );
      const classes = priors.concat(
        this.years.flatMap((arr, i) =>
          arr.flatMap((s, j) => s.map((id, k) => this.make_class(id, i, j, k)))
        )
      );
      return { coursesOfStudy: this.requirements, selectedSubjects: classes };
    }
  },
  methods: {
    newRoad(input: any) {
      this.editing = this.$store.state.roads.course_roads.length;
      this.editingText = "Untitled";
      this.$store.commit("roads/new_road", this.editingText);
    },
    view(idx: number) {
      if (idx !== this.viewing) {
        this.$store.commit("roads/view", idx);
        this.editing = -1;
      }
    },
    edit(idx: number) {
      this.editing = idx;
      this.editingText = this.$store.state.roads.course_roads[idx][0];
    },
    inspect(course: string) {
      this.$store.dispatch("classes/load", course);
      this.maximize_info = !!this.inspecting && this.maximize_info;
      this.inspecting = course;
      this.inspection_history.splice(0, this.inspection_history.length, course);
    },
    close_info() {
      this.inspecting = "";
      this.maximize_info = false;
    },
    toggle_max() {
      this.maximize_info = !this.maximize_info;
    },
    place(idx: number, i: number) {
      if (this.inspecting) {
        this.$store.commit("roads/add_course", {
          year: idx,
          quarter: i,
          course: this.inspecting
        });
        this.close_info();
        this.update_progresses();
      }
    },
    remove_course({
      year,
      quarter,
      idx
    }: {
      year: number;
      quarter: 0 | 1 | 2 | 3;
      idx: number;
    }) {
      this.$store.commit("roads/remove_course", { year, quarter, idx });
      this.update_progresses();
    },
    push_course(course: string) {
      this.inspection_history.splice(
        this.inspect_index + 1,
        this.inspection_history.length,
        course
      );
      this.inspecting = course;
      this.$store.dispatch("classes/load", course);
    },
    next_course() {
      this.inspecting = this.inspection_history[
        Math.min(this.inspect_index + 1, this.inspection_history.length - 1)
      ];
    },
    prev_course() {
      this.inspecting = this.inspection_history[
        Math.max(0, this.inspect_index - 1)
      ];
    },
    add_requirement(req: string) {
      this.$store.dispatch("requirements/progress", {
        reqs: [req],
        courses: this.road_json
      });
      this.$store.commit("roads/add_requirement", req);
    },
    update_progresses() {
      this.$store.dispatch("requirements/progress", {
        reqs: this.requirements,
        courses: this.road_json
      });
    },
    tracker(req: string): number {
      return this.$store.state.requirements.manifest.get(req)!.tracker;
    },
    make_class(id: string, year: number, quarter: number, idx: number): Class {
      const course: CourseJSON = this.$store.state.classes.manifest.get(id)!;
      return {
        id,
        index: year * 4 + 1 + quarter + idx,
        overrideWarnings: false,
        semester: year * 4 + 1 + quarter,
        title: course.title,
        units: course.total_units
      };
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
.gutter {
  background-color: #ffffff04;
  flex: 0.01;
}
.requirements {
  flex: 0.25;
  display: flex;
  flex-flow: column nowrap;
  max-width: 25vw;
}
.requirements + * + * {
  flex: 0.74;
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
  background-color: #ffffff04;
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
  border-radius: 50%;
  background-color: transparent;
  transition: background-color, 150ms;
  color: white;
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
  overflow: auto;
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
  border: solid #ffffff18 1px;
  background-color: #ffffff10;
  color: white;
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
.reqs {
  overflow: auto;
}
</style>