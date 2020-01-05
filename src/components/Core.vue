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
            <p class="road-title" v-if="editing!==idx">
              <b>{{name}}</b>
              <button class="delete-road" @click.stop="remove_road(idx)">&times;</button>
            </p>
            <input
              type="text"
              name="road-editor"
              id="road-editor"
              v-model="editingText"
              @keydown.enter="finish_editing"
              @blur="finish_editing"
              @click.stop
              v-else
            />
          </span>
          <i v-if="viewing===-1">Create a new road! ---></i>
        </span>
        <button class="new-road" @click="newRoad">+</button>
      </nav>
      <div v-if="viewing!==-1" style="overflow:auto;">
        <article class="road-display">
          <svg id="graph" v-show="graph_mode" />
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
      </div>
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
import {
  CourseJSON,
  RequirementTitles,
  RoadJSON,
  Class,
  is_full_course,
  FullCourseJSON
} from "@/fireroad";
import { Quarter } from "@/store/road";
import { graph_untrack, graph_track } from "@/dom/graph";
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
  async mounted() {
    const listener = () => {
      this.graph_detrack(-1, 0);
      this.graph_retrack(-1, 0);
    };
    window.addEventListener("resize", listener);
    this.$once("hook:beforeDestroy", () =>
      window.removeEventListener("resize", listener)
    );
    await this.$store.dispatch("roads/load");
    this.courses.forEach(course =>
      this.$store.dispatch("classes/load", course)
    );
    listener();
  },
  data() {
    return {
      editing: -1,
      editingText: "Untitled",
      inspecting: "",
      inspection_history: [] as string[],
      maximize_info: false,
      graph_mode: true,
      retracks: new Map<string, number>()
    };
  },
  watch: {
    editingText(next) {
      if (this.editing > -1) {
        this.$store.dispatch("roads/update_name", {
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
    finish_editing() {
      this.editing = -1;
      this.$store.dispatch("roads/save");
    },
    newRoad(input: any) {
      if (this.editing !== -1) {
        this.$store.dispatch("save");
      }
      this.editing = this.$store.state.roads.course_roads.length;
      this.editingText = "Untitled";
      this.graph_detrack(-1, 0);
      this.$store.dispatch("roads/new_road", this.editingText);
      this.$nextTick(() => this.$nextTick(() => this.graph_retrack(-1, 0)));
    },
    view(idx: number) {
      if (idx !== this.viewing) {
        this.graph_detrack(-1, 0);
        this.$store.dispatch("roads/view", idx);
        this.$nextTick(() => this.graph_retrack(-1, 0));
        if (this.editing !== -1) {
          this.$store.dispatch("save");
        }
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
        this.graph_detrack(idx, i);
        this.$store.dispatch("roads/add_course", {
          year: idx,
          quarter: i,
          course: this.inspecting
        });
        this.close_info();
        this.update_progresses();
        this.$nextTick(() => this.graph_retrack(idx, i));
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
      this.graph_detrack(year, quarter);
      this.$store.dispatch("roads/remove_course", { year, quarter, idx });
      this.update_progresses();
      this.$nextTick(() => this.graph_retrack(year, quarter));
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
      this.$store.dispatch("roads/add_requirement", req);
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
    },
    graph_tracks(year: number, quarter: number) {
      const tracks = [] as Array<[number, number]>;
      if (year === -1) {
        tracks.push([-1, 0]);
      } else {
        while (quarter < 4) {
          tracks.push([year, quarter++]);
        }
      }
      this.years
        .slice(++year)
        .forEach((_, y) =>
          tracks.push(
            [y + year, 0],
            [y + year, 1],
            [y + year, 2],
            [y + year, 3]
          )
        );
      return tracks;
    },
    graph_detrack(year: number, quarter: number) {
      if (this.viewing > -1) {
        this.graph_tracks(year, quarter).forEach(tup => {
          const str = `${tup[0]} ${tup[1]}`;
          window.clearTimeout(this.retracks.get(str));
          this.retracks.set(str, 0);
          graph_untrack(
            tup[0],
            tup[1],
            tup[0] === -1 ? this.prior_credit : this.years[tup[0]][tup[1]]
          );
        });
      }
    },
    graph_retrack(year: number, quarter: number) {
      if (this.viewing > -1) {
        this.graph_tracks(year, quarter).forEach(tup => {
          const str = `${tup[0]} ${tup[1]}`;
          if (!this.retracks.get(str)) {
            this._graph_retrack(...tup);
          }
        });
      }
    },
    _graph_retrack(year: number, quarter: number) {
      const courses = (year === -1
        ? this.prior_credit
        : this.years[year][quarter]
      ).map(course_id =>
        this.$store.state.classes.manifest_updated
          ? this.$store.state.classes.manifest.get(course_id)
          : undefined
      );
      const fail = courses.reduce(
        (old, next) => old || !next || !is_full_course(next),
        false
      );
      const str = `${year} ${quarter}`;
      if (fail) {
        this.retracks.set(
          str,
          window.setTimeout(() => this._graph_retrack(year, quarter), 1000)
        );
      } else {
        graph_track(year, quarter, courses as FullCourseJSON[]);
        this.retracks.set(str, 0);
      }
    },
    remove_road(idx: number) {
      this.graph_detrack(-1, 0);
      this.$store.dispatch("roads/delete_road", idx);
      this.$nextTick(() => this.graph_retrack(-1, 0));
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
  position: relative;
}
.road-display > * {
  z-index: 1;
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
#graph {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.delete-road {
  opacity: 0;
  font-size: 1.25em;
  height: 1.5em;
  width: 1.5em;
  border-radius: 50%;
  color: white;
  background-color: transparent;
  transition: background-color 150ms, opacity 150ms;
  border: none;
  margin-left: 1em;
  cursor: pointer;
}
.road-title:hover > .delete-road {
  opacity: 1;
}
.delete-road:hover {
  background-color: #ffffff18;
}
.delete-road:active {
  background-color: hsla(0deg, 75%, 50%, 20%);
}
</style>