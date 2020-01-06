<template>
  <main>
    <aside class="requirements">
      <requirement-search-vue :disable="viewing===-1" @load-requirement="add_requirement"></requirement-search-vue>
      <section class="reqs" v-if="viewing!==-1">
        <requirement-tree-vue
          v-for="(req, idx) in requirements"
          :key="`Requirement ${req}`"
          :requirements="req"
          @remove-requirement="remove_req(idx)"
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
              <action-button-vue @click.stop="remove_road(idx)" :close="true"></action-button-vue>
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
        <action-button-vue @click="new_road"></action-button-vue>
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
            @graph-redraw="graph_redraw"
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
            @graph-redraw="graph_redraw"
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
import ActionButtonVue from "./utils/ActionButton.vue";
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
    RequirementTreeVue,
    ActionButtonVue
  },
  async mounted() {
    const listener = () => this.graph_redraw();
    window.addEventListener("resize", listener);
    this.$once("hook:beforeDestroy", () =>
      window.removeEventListener("resize", listener)
    );
    await this.$store.dispatch("roads/load");
    this.courses.forEach(course =>
      this.$store.dispatch("classes/load", course)
    );
    this.update_progresses();
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
      cycling: new Set<string>(),
      cycle: 0,
      progress_update: 0
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
    new_road(input: any) {
      this.graph_redraw();
      if (this.editing !== -1) {
        this.$store.dispatch("save");
      }
      this.editing = this.$store.state.roads.course_roads.length;
      this.editingText = "Untitled";
      this.$store.dispatch("roads/new_road", this.editingText);
    },
    remove_road(idx: number) {
      this.graph_redraw();
      this.$store.dispatch("roads/delete_road", idx);
    },
    view(idx: number) {
      if (idx !== this.viewing) {
        this.graph_redraw();
        this.$store.dispatch("roads/view", idx);
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
        this.graph_redraw({ year: idx, quarter: i });
        this.$store.dispatch("roads/add_course", {
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
      this.graph_redraw({ year, quarter });
      this.$store.dispatch("roads/remove_course", { year, quarter, idx });
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
      this.$store.dispatch("roads/add_requirement", req);
    },
    remove_req(idx: number) {
      this.$store.dispatch("roads/remove_requirement", idx);
    },
    update_progresses() {
      if (!this.progress_update) {
        if (!this.$store.state.classes.manifest_updated) {
          this.progress_update = window.setTimeout(() => {
            this.progress_update = 0;
            this.update_progresses();
          }, 1000);
        } else {
          this.$store.dispatch("requirements/progress", {
            reqs: this.requirements,
            courses: this.road_json
          });
          this.progress_update = 0;
        }
      }
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
        semester: year * 4 + 1 + quarter
      };
    },
    graph_redraw(
      { year, quarter }: { year: number; quarter: number } = {
        year: -1,
        quarter: 0
      }
    ) {
      this.graph_detrack(year, quarter);
      this.$nextTick(() => this.graph_retrack(year, quarter));
    },
    graph_courses(year: number, quarter: number) {
      const courses = [] as Array<{
        year: number;
        quarter: number;
        idx: number;
        course: string;
      }>;
      if (year === -1) {
        courses.push(
          ...this.prior_credit.map((course, idx) => ({
            year: -1,
            quarter: 0,
            idx,
            course
          }))
        );
      } else {
        courses.push(
          ...this.years[year].slice(quarter).flatMap((c, q) =>
            c.map((course, idx) => ({
              year,
              quarter: quarter + q,
              idx,
              course
            }))
          )
        );
      }
      courses.push(
        ...this.years.slice(++year).flatMap((yc, y) =>
          yc.flatMap((qc, q) =>
            qc.map((course, idx) => ({
              year: year + y,
              quarter: q,
              idx,
              course
            }))
          )
        )
      );
      return courses;
    },
    graph_detrack(year: number, quarter: number) {
      const courses = this.graph_courses(year, quarter).forEach(c => {
        const id = JSON.stringify(c);
        if (!this.cycling.delete(id)) {
          graph_untrack(c.year, c.quarter, c.idx);
        }
      });
    },
    graph_retrack(year: number, quarter: number) {
      const courses = this.graph_courses(year, quarter);
      if (!this.cycling.size) {
        this.cycle = window.setTimeout(() => this._cycle_retrack(), 0);
      }
      courses.forEach(course => this.cycling.add(JSON.stringify(course)));
    },
    _cycle_retrack() {
      const draw = [] as Array<
        [{ year: number; quarter: number; idx: number }, FullCourseJSON, string]
      >;
      const MAX_DRAW_PER_FRAME = 20;
      this.cycling.forEach(id => {
        if (draw.length < MAX_DRAW_PER_FRAME) {
          const course: {
            year: number;
            quarter: number;
            idx: number;
            course: string;
          } = JSON.parse(id);
          const c = this.$store.state.classes.manifest.get(course.course);
          if (c && is_full_course(c)) {
            draw.push([course, c, id]);
          }
        }
      });
      draw.forEach(tup => {
        this.cycling.delete(tup[2]);
        graph_track(tup[0].year, tup[0].quarter, tup[0].idx, tup[1]);
      });
      if (this.cycling.size) {
        window.setTimeout(
          () => this._cycle_retrack(),
          draw.length === MAX_DRAW_PER_FRAME ? 0 : 500
        );
      }
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
  --button-visible: 0;
}
.road-title:hover {
  --button-visible: 1;
}
.road-title[selected] {
  background-color: #0088ff44;
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
  flex: 1;
}
#graph {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>