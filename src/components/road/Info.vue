<template>
  <article class="info-card">
    <span
      class="head"
      @dblclick="$emit('toggle-max')"
      :style="`--bg-color:${computeColor(id)}`"
    >
      <h3>{{id}}</h3>
      <button @click="$emit('close-info')">&times;</button>
    </span>
    <div class="body">
      <h4 :loading="!!course" class="title">{{course ? course.title : "Loading Course Title..."}}</h4>
      <div class="details">
        <div class="grid">
          <h6>Units</h6>
          <p>{{unit_text}}</p>
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
import { CourseJSON, is_full_course, FullCourseJSON } from "@/fireroad";
import { Quarter } from "@/store/road";
import { is_gir, requisite_parser } from "@/fireroad/demystify";
export default Vue.extend({
  props: { id: String },
  computed: {
    course(): CourseJSON | undefined {
      return (
        this.$store.state.classes.manifest_updated &&
        this.$store.state.classes.manifest.get(this.id)
      );
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
      return requisite_parser(this.full_course.prerequisites!);
    },
    corequisites(): string[] {
      return requisite_parser(this.full_course.corequisites!);
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
        .replace("''permission of instructor''", "Permission of Instructor")
        .replace(/, /g, " and ")
        .replace(/\//g, " or ");
    },
    title(id: string): string {
      return !this.$store.state.classes.manifest_updated
        ? "Loading Course Title..."
        : is_gir(id)
        ? ""
        : this.truncate_name(this.$store.state.classes.manifest.get(id)!.title);
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
    range(
      num: number,
      start: number,
      end: number,
      out_start: number,
      out_end: number
    ) {
      return (
        out_start + ((out_end - out_start) * (num - start)) / (end - start)
      );
    },
    computeColor(course: string) {
      const num = parseInt(course, 10);
      if (Number.isNaN(num)) {
        return "30deg"; // "hsl(30deg, 75%, 50%)";
      }
      const hue = Number(
        this.range(num, 1, 24, 120, 280).toFixed(0)
      ).toString();
      return hue + "deg"; // `hsl(${hue}deg, 75%, 50%)`;
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
  background-color: hsl(var(--bg-color), 75%, 50%);
}
.head > h3 {
  display: flex;
  align-items: center;
  padding: 5px;
}
.head > button {
  font-size: 1.5em;
  border: none;
  border-radius: 50%;
  background-color: transparent;
  height: 1.5em;
  width: 1.5em;
  margin: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background-color 150ms;
}
.head > button:hover {
  background-color: #00000022;
}
.head > button:active {
  background-color: #ff000044;
}
.info-card {
  display: flex;
  flex-flow: column nowrap;
  background-color: white;
  border: solid #dddddd 2px;
  border-radius: 2px;
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
  box-shadow: 5px 5px 5px #00000044;
  padding: 10px;
  margin: 0 7.5px;
  min-width: 150px;
  text-align: center;
  cursor: pointer;
  transition: background-color 150ms;
  background-color: hsl(var(--bg-color), 75%, 50%);
}

.prereqs>:hover, .coreqs>:hover {
    background-color: hsl(var(--bg-color), 75%, 40%);
}
.prereqs>:active, .coreqs>:active {
    background-color: hsl(var(--bg-color), 75%, 30%);
}
</style>