<template>
  <article class="info-card">
    <span class="head" @dblclick="$emit('toggle-max')" :style="`--bg-color:${computeColor(id)}`">
      <h3>
        <button v-if="idx > 0" class="prev" @click="$emit('prev-course')">
          <div></div>
        </button>
        {{id}}
        <button v-if="idx < length-1" class="next" @click="$emit('next-course')">
          <div></div>
        </button>
      </h3>
      <close-button-vue @button-click="$emit('close-info')" :close="true"></close-button-vue>
    </span>
    <div class="body">
      <h4 :loading="!!course" class="title">{{course ? course.title : "Loading Course Title..."}}</h4>
      <div class="details">
        <div class="grid">
          <h6>Units</h6>
          <p>{{unit_text}}</p>
          <template v-if="course.gir_attribute">
            <h6>Fulfills:</h6>
            <p>GIR:{{course.gir_attribute}}</p>
          </template>
          <template v-if="course.hass_attribute">
            <h6>HASS:</h6>
            <p>{{course.hass_attribute + (course.communication_requirement ? ', ' + course.communication_requirement : '')}}</p>
          </template>
          <h6>Offered</h6>
          <p>{{course ? offered.join() : "Loading Course Offerings..."}}</p>
          <h6>{{course && course.instructors ? course.instructors.length === 1 ? "Instructor" : "Instructors" : "Instructor(s)"}}</h6>
          <p>{{course ? course.instructors ? course.instructors.join() : "Unknown" : "Loading Instructor(s)..."}}</p>
          <h6>Average Enrollment</h6>
          <p>{{is_full ? `${full_course.enrollment_number === undefined ? '---' : full_course.enrollment_number} students` : "Loading Past Enrollment..."}}</p>
          <h6>Average Rating</h6>
          <p>{{is_full ? `${full_course.rating === undefined ? '---' : full_course.rating}/7.0` : "Loading Course Ratings..."}}</p>
          <h6>Hours</h6>
          <p>{{hourText}}</p>
        </div>
        <h5>Description</h5>
        <div
          class="description"
        >{{is_full ? full_course.description === undefined ? 'No description available' : full_course.description : 'Loading Course Description...'}}</div>
      </div>
      <template v-if="is_full && full_course.prerequisites">
        <h5>Prerequisites{{is_full && full_course.prerequisites ? `: ${prereq_text}` : ""}}</h5>
        <div class="prereqs">
          <article
            v-for="prereq in prerequisites"
            :key="prereq"
            :style="`--bg-color:${computeColor(prereq)}`"
            :title="title(prereq, false)"
            @click="navigate(prereq)"
          >
            <h6>{{prereq}}</h6>
            <p>{{title(prereq)}}</p>
          </article>
        </div>
      </template>
      <template v-if="is_full && full_course.corequisites">
        <h5>Corequisites{{is_full && full_course.corequisites ? `: ${coreq_text}` : ""}}</h5>
        <div class="coreqs">
          <article
            v-for="coreq in corequisites"
            :key="coreq"
            :style="`--bg-color:${computeColor(coreq)}`"
            @click="navigate(coreq)"
          >
            <h6>{{coreq}}</h6>
            <p>{{title(coreq)}}</p>
          </article>
        </div>
      </template>
    </div>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import CloseButtonVue from "@/components/utils/ActionButton.vue";
import {
  CourseJSON,
  is_full_course,
  FullCourseJSON,
  compute_color
} from "@/fireroad";
import { Quarter } from "@/store/road";
import { is_gir, requisite_parser, de_gir } from "@/fireroad/demystify";
export default Vue.extend({
  components: { CloseButtonVue },
  props: { id: String, idx: Number, length: Number },
  computed: {
    course(): CourseJSON | undefined {
      return this.$store.getters["classes/class"](this.id);
    },
    full_course(): FullCourseJSON {
      return this.course as FullCourseJSON;
    },
    is_full(): boolean {
      return !!this.course && is_full_course(this.course);
    },
    unit_text(): string {
      return this.is_full
        ? `${this.full_course.total_units} Units : ${
            this.full_course.lecture_units
          }-${this.full_course.lab_units}-${this.full_course.total_units -
            this.full_course.lecture_units -
            this.full_course.lab_units}`
        : this.course
        ? `${this.full_course.total_units} Units`
        : "Loading Unit Count...";
    },
    offered(): string[] {
      const out: string[] = [];
      if (this.course!.offered_fall) {
        out.push("Fall");
      }
      if (this.course!.offered_IAP) {
        out.push("IAP");
      }
      if (this.course!.offered_spring) {
        out.push("Spring");
      }
      if (this.course!.offered_summer) {
        out.push("Summer");
      }
      return out;
    },
    hourText(): string {
      return this.is_full
        ? `${
            this.full_course.in_class_hours !== undefined &&
            this.full_course.out_of_class_hours !== undefined
              ? Number(
                  (
                    this.full_course.in_class_hours +
                    this.full_course.out_of_class_hours
                  ).toFixed(2)
                )
              : "---"
          } total; ${
            this.full_course.in_class_hours !== undefined
              ? this.full_course.in_class_hours
              : "---"
          } in class; ${
            this.full_course.out_of_class_hours !== undefined
              ? this.full_course.out_of_class_hours
              : "---"
          } out of class`
        : "Loading Course Hours...";
    },
    prerequisites(): string[] {
      return requisite_parser(this.full_course.prerequisites!).filter(s => s.indexOf(".") !== -1 || s.includes("GIR"));
    },
    corequisites(): string[] {
      return requisite_parser(this.full_course.corequisites!).filter(s => s.indexOf(".") !== -1 || s.includes("GIR"));
    },
    prereq_text(): string {
      return this.req_text(this.full_course.prerequisites!);
    },
    coreq_text(): string {
      return this.req_text(this.full_course.corequisites!);
    }
  },
  methods: {
    req_text(init: string) {
      return init
        .trim()
        .replace(/, /g, " and ")
        .replace(/\//g, " or ");
    },
    title(id: string, truncate = true): string {
      return !this.$store.state.classes.manifest_tracker
        ? "Loading Course Title..."
        : is_gir(id)
        ? ""
        : truncate
        ? this.truncate_name(this.$store.getters["classes/class"](id)!.title)
        : this.course!.title;
    },
    truncate_name(name: string, chars = 20): string {
      if (name.length < chars) {
        return name;
      }
      const fragments = name.split(" ");
      let length = 0;
      let i = 0;
      for (; i < fragments.length && length < chars; i++) {
        length += fragments[i].length;
      }
      return fragments.slice(0, Math.max(i, 2)).join(" ") + " ...";
    },
    navigate(req: string) {
      if (is_gir(req)) {
        req = de_gir(req)[0];
      }
      this.$emit("push-course", req);
    },
    computeColor(id: string) {
      return compute_color(id);
    }
  }
});
</script>
<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 5px 20px;
}
h5,
h6 {
  font-size: 1rem;
}
.grid > * {
  padding: 2px;
}
.head {
  display: flex;
  color: white;
  align-items: center;
  justify-content: space-between;
  background-color: hsl(var(--bg-color), var(--saturate), 50%);
  transition: background-color 500ms;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}
.head > h3 {
  display: flex;
  align-items: center;
  padding: 5px;
}
.head button {
  font-size: 1.5em;
  margin: 10px;
}
.head > h3 > button {
  border: none;
  border-radius: 50%;
  background-color: transparent;
  height: 1.5em;
  width: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background-color 150ms;
}
.head > h3 > button:hover {
  background-color: #00000022;
}
.head > h3 > button:active {
  background-color: #00000044;
}
.info-card {
  display: flex;
  flex-flow: column nowrap;
  transition: background-color 1s;
  background-color: hsl(var(--background));
  border-radius: 5px;
  box-shadow: 0px 0px 7.5px black;
  z-index: 3;
}
h4,
h5 {
  padding-left: 10px;
  padding-top: 10px;
}
h5 + * {
  padding: 10px;
}
.body {
  overflow: auto;
  padding: 10px;
}
.prereqs,
.coreqs {
  display: flex;
  overflow: auto;
}
.prereqs > *,
.coreqs > * {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-flow: column nowrap;
  color: white;
  border-radius: 5px;
  padding: 10px;
  margin: 0 7.5px;
  min-width: 150px;
  text-align: center;
  cursor: pointer;
  transition: background-color 150ms;
  background-color: hsl(var(--bg-color), var(--saturate), 50%);
}

.prereqs > :hover,
.coreqs > :hover {
  background-color: hsl(var(--bg-color), var(--saturate), 40%);
}
.prereqs > :active,
.coreqs > :active {
  background-color: hsl(var(--bg-color), var(--saturate), 30%);
}

.prev > div,
.next > div {
  border-top: solid white 2px;
  border-left: solid white 2px;

  transform: rotate(var(--deg));
  flex: 1;
  --margin: 75%;
  height: calc(100% - var(--margin));
}
.prev > div {
  --deg: 315deg;
  margin: 0 calc(var(--margin) / 2);
}
.next > div {
  --deg: 135deg;
  margin: 0 calc(var(--margin) / 2);
}
</style>