<template>
  <main :dragging="dragging">
    <aside class="requirements">
      <requirement-search-vue :disable="!road" @load-requirement="add_requirement"></requirement-search-vue>
      <section class="reqs" v-if="road">
        <requirement-tree-vue
          v-for="(req, idx) in requirements"
          :key="`Requirement ${req.name}`"
          :requirements="req"
          :idx="idx"
          @remove-requirement="remove_req(idx)"
          @req-override="override"
        ></requirement-tree-vue>
      </section>
      <section v-else>
        <i>Add some requirements!</i>
      </section>
    </aside>
    <div class="gutter"></div>
    <section>
      <span class="header">
        <search-vue class="search" @load-course="inspect"></search-vue>
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
      <div v-if="road" style="overflow:auto;">
        <article class="road-display">
          <svg id="graph" v-show="graph_mode" />
          <prior-credit-vue
            :classes="prior_credit"
            :placing="inspecting"
            @remove-course="remove_course"
            @graph-redraw="graph_redraw"
            @drag-start="drag_start"
            @drag-move="drag_move"
            @drag-end="drag_end"
          ></prior-credit-vue>
          <year-vue
            v-for="(year, idx) in years"
            :key="`year ${idx}`"
            :year="year"
            :idx="idx"
            :placing="inspecting"
            :allowed="allowed"
            @remove-course="remove_course"
            @graph-redraw="graph_redraw"
            @force-sat="toggle_sat($event)"
            @drag-start="drag_start"
            @drag-move="drag_move"
            @drag-end="drag_end"
          ></year-vue>
        </article>
      </div>
      <article v-else class="no-roads">
        <i>Let's get started!</i>
      </article>
    </section>
    <transition name="fade">
      <info-vue
        v-if="!dragging && inspecting"
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
    </transition>
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
import { Quarter, Road, ClassData, RequirementData } from "@/store/road";
import { graph_untrack, graph_track } from "@/dom/graph";
import { proper_requisite_parse } from "@/fireroad/demystify";
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
    await this.$store.dispatch("roads/load");
    const redrawer = () => this.graph_redraw();
    window.addEventListener("resize", redrawer);
    if (this.road) {
      this.graph_redraw();
      this.load_classes();
      this.update_progresses();
      this.compute_sat();
    }
    const undo = (ev: KeyboardEvent) => {
      if (
        ev.key === "z" &&
        (ev.ctrlKey || ev.metaKey) &&
        !ev.altKey &&
        !ev.shiftKey
      ) {
        this.$store.dispatch("roads/undo");
        this.graph_redraw();
        this.update_progresses();
      }
    };
    const redo = (ev: KeyboardEvent) => {
      if (
        (((ev.key === "Z" || ev.key === "z") && ev.shiftKey) ||
          (ev.key === "y" && !ev.shiftKey)) &&
        (ev.ctrlKey || ev.metaKey) &&
        !ev.altKey
      ) {
        this.$store.dispatch("roads/redo");
        this.graph_redraw();
        this.update_progresses();
      }
    };
    const dark_mode_toggle = (ev: KeyboardEvent) => {
      if (
        (ev.metaKey || ev.ctrlKey) &&
        ev.shiftKey &&
        (ev.key === "d" || ev.key === "D") &&
        !ev.altKey
      ) {
        this.toggle_mode();
        ev.preventDefault();
      }
    };
    window.addEventListener("keydown", undo);
    window.addEventListener("keydown", redo);
    window.addEventListener("keydown", dark_mode_toggle);
    this.$once("hook:beforeDestroy", () => {
      window.removeEventListener("resize", redrawer);
      window.removeEventListener("keydown", undo);
      window.removeEventListener("keydown", redo);
      window.removeEventListener("keydown", dark_mode_toggle);
    });
  },
  data() {
    return {
      editing: -1,
      editing_text: "Untitled",
      inspecting: "",
      inspection_history: [] as string[],
      maximize_info: false,
      graph_mode: true,
      cycling: new Set<string>(),
      cycle: 0,
      progress_update: 0,
      curvy: true,
      sat_update: 0,
      dragging: undefined as
        | undefined
        | { year: number; quarter: 0 | 1 | 2 | 3; idx: number; name: string },
      tainted: false
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
    viewing(): number {
      return this.$store.state.roads.viewing;
    },
    road_names(): string[] {
      return this.$store.state.roads.course_roads.map(
        (road: Road) => road.name
      );
    },
    road(): Road | undefined {
      return this.$store.getters["roads/road"];
    },
    years(): ClassData[][][] {
      return this.road!.years;
    },
    prior_credit(): ClassData[] {
      return this.road!.prior_credit;
    },
    inspect_course(): CourseJSON | undefined {
      return this.$store.getters["classes/class"](this.inspecting);
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
    requirements(): RequirementData[] {
      return this.road!.requirements;
    },
    courses(): ClassData[] {
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
      return {
        coursesOfStudy: this.requirements.map(r => r.name),
        progressOverrides: this.overrides,
        selectedSubjects: classes
      };
    },
    overrides(): any {
      return this.road!.requirements.flatMap(data => data.overrides).reduce(
        (old, obj) => Object.assign(old, obj),
        {}
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
        this.compute_sat();
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
      const removed_course =
        year === -1
          ? this.road!.prior_credit[idx].name
          : this.road!.years[year][quarter][idx].name;
      this.graph_redraw({ year, quarter });
      this.$store.dispatch("roads/remove_course", { year, quarter, idx });
      this.inspect(removed_course);
      this.update_progresses();
      this.compute_sat();
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
        progressOverrides: this.overrides,
        courses: this.road_json
      });
      this.$store.dispatch("roads/add_requirement", req);
    },
    remove_req(idx: number) {
      this.$store.dispatch("roads/remove_requirement", idx);
    },
    override(obj: any) {
      const idx = obj.idx;
      this.$store.dispatch("roads/toggle_override", obj);
      this.$store.dispatch("requirements/progress", {
        reqs: [this.requirements[idx].name],
        progressOverrides: this.overrides,
        courses: this.road_json
      });
    },
    update_progresses() {
      if (!this.progress_update) {
        if (!this.$store.state.classes.manifest_tracker) {
          this.progress_update = window.setTimeout(() => {
            this.progress_update = 0;
            this.update_progresses();
          }, 1000);
        } else {
          this.$store.dispatch("requirements/progress", {
            reqs: this.requirements.map(r => r.name),
            progressOverrides: this.overrides,
            courses: this.road_json
          });
          this.progress_update = 0;
        }
      }
    },
    load_classes() {
      if (this.road) {
        this.courses.forEach(course =>
          this.$store.dispatch("classes/load", course.name)
        );
      }
    },
    make_class(
      id: ClassData,
      year: number,
      quarter: number,
      idx: number
    ): Class {
      return {
        id: id.name,
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
      if (this.road) {
        this.graph_detrack(year, quarter);
      }
      this.$nextTick(() => this.road && this.graph_retrack(year, quarter));
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
            course: course.name
          }))
        );
      } else {
        courses.push(
          ...this.years[year].slice(quarter).flatMap((c, q) =>
            c.map((course, idx) => ({
              year,
              quarter: quarter + q,
              idx,
              course: course.name
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
              course: course.name
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
          const c = this.$store.getters["classes/class"](course.course);
          if (c && is_full_course(c)) {
            draw.push([course, c, id]);
          }
        }
      });
      draw.forEach(tup => {
        this.cycling.delete(tup[2]);
        graph_track(
          tup[0].year,
          tup[0].quarter,
          tup[0].idx,
          tup[1],
          this.curvy
        );
      });
      if (this.cycling.size) {
        window.setTimeout(
          () => this._cycle_retrack(),
          draw.length === MAX_DRAW_PER_FRAME ? 0 : 500
        );
      }
    },
    toggle_curvy() {
      this.curvy = !this.curvy;
      this.graph_redraw();
    },
    compute_sat() {
      if (!this.sat_update) {
        this.sat_update = window.setTimeout(() => this._sat_recompute(), 0);
      }
    },
    _sat_recompute() {
      const course_set = new Set<string>();
      for (const course of this.prior_credit) {
        course_set.add(course.name);
        const full_course = this.$store.getters["classes/class"](
          course.name
        ) as FullCourseJSON;
        if (!full_course || !is_full_course(full_course)) {
          this.sat_update = window.setTimeout(
            () => this._sat_recompute(),
            1000
          );
          return;
        }
        if (full_course.equivalent_subjects) {
          full_course.equivalent_subjects.forEach(c => course_set.add(c));
        }
        if (full_course.joint_subjects) {
          full_course.joint_subjects.forEach(c => course_set.add(c));
        }
      }
      for (let i = 0; i < this.years.length; i++) {
        for (let j = 0; j < this.years[i].length; j++) {
          const unsat = [] as string[];
          for (const course of this.years[i][j]) {
            const full_course = this.$store.getters["classes/class"](
              course.name
            ) as FullCourseJSON;
            if (!full_course || !is_full_course(full_course)) {
              this.sat_update = window.setTimeout(
                () => this._sat_recompute(),
                1000
              );
              return;
            }
            if (full_course.prerequisites) {
              const fail_prereqs = proper_requisite_parse(
                full_course.prerequisites
              ).unsatisfied(course_set);
              unsat.push(fail_prereqs && `Prerequisites: ${fail_prereqs}`);
            } else {
              unsat.push("");
            }
          }
          for (const course of this.years[i][j]) {
            course_set.add(course.name);
          }
          for (let k = 0; k < this.years[i][j].length; k++) {
            const full_course = this.$store.getters["classes/class"](
              this.years[i][j][k].name
            ) as FullCourseJSON;
            if (full_course.corequisites) {
              const fail_coreq = proper_requisite_parse(
                full_course.corequisites
              ).unsatisfied(course_set);
              unsat[k] = unsat[k]
                ? fail_coreq
                  ? `${unsat[k]}\nCorequisites:${fail_coreq}`
                  : unsat[k]
                : fail_coreq;
            }
          }
          this.$store.dispatch("roads/update_unsat", {
            year: i,
            quarter: j,
            unsat
          });
        }
      }
      this.sat_update = 0;
    },
    toggle_sat(pack: { year: number; quarter: number; idx: number }) {
      (pack as any).force = !this.road!.years[pack.year][pack.quarter][pack.idx]
        .force_sat;
      this.$store.dispatch("roads/force_sat", pack);
    },
    toggle_mode() {
      this.$store.dispatch("roads/toggle_mode");
    },
    drag_start(pack: {
      year: number;
      quarter: 0 | 1 | 2 | 3;
      idx: number;
      name: string;
    }) {
      if (this.tainted) {
        this.place(this.dragging!.year, this.dragging!.quarter);
      }
      this.dragging = pack;
      this.inspect(pack.name);
      this.tainted = false;
    },
    drag_move(pack: { year: number; quarter: number }) {
      if (!this.tainted && this.dragging) {
        this.tainted =
          this.dragging.year !== pack.year ||
          this.dragging.quarter !== pack.quarter;
        if (this.tainted) {
          this.remove_course(this.dragging);
        }
      }
    },
    drag_end(pack: { year: number; quarter: 0 | 1 | 2 | 3 }) {
      if (this.inspecting && (!this.dragging || this.tainted)) {
        this.place(pack.year, pack.quarter);
      }
      if (this.dragging && !this.tainted) {
        this.inspect(this.dragging.name);
      }
      this.dragging = undefined;
      this.tainted = false;
    }
  }
});
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
main {
  display: flex;
  flex-flow: row nowrap;
  flex: 1;
  --accept: pointer;
}
[dragging] {
  user-select: none;
  cursor: grabbing;
  --accept: grabbing;
}
.gutter {
  background-color: hsla(var(--contrast), var(--level));
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
input {
  border: solid hsla(var(--contrast), calc(var(--level) * 4)) 1px;
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
  color: hsl(var(--contrast));
  border-radius: 5px;
  padding: 5px;
  margin: 5px;
  width: 80%;
}
.info {
  position: fixed;
  width: 30vw;
  height: 40vh;
  right: 0;
  bottom: 0;
  transition: width 500ms, height 500ms;
  user-select: none;
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