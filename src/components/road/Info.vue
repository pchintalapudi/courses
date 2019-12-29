<template>
  <article class="info-card">
    <span class="head" @dblclick="$emit('toggle-max')">
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
    </div>
  </article>
</template>
<script lang="ts">
import Vue from "vue";
import { CourseJSON, is_full_course, FullCourseJSON } from "@/fireroad";
import { Quarter } from "@/store/road";
export default Vue.extend({
  props: { id: String },
  computed: {
    course(): CourseJSON | undefined {
      return this.$store.state.classes.manifest_updated && this.$store.state.classes.manifest.get(this.id);
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
              ? Number((this.full_course.in_class_hours +
                this.full_course.out_of_class_hours).toFixed(2))
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
h5, h6 {
    font-size: 1rem;
}
.grid > * {
    padding: 2px;
}
.head {
    display: flex;
    background-color: #0088ffbb;
    color: white;
    align-items: center;
    justify-content: space-between;
}
.head>h3 {
    display: flex;
    align-items: center;
    padding: 5px;
}
.head>button {
    font-size: 1.5em;
    border:none;
    border-radius: 50%;
    background-color: transparent;
    height: 1.5em;
    width:1.5em;
    margin: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: background-color 150ms;
}
.head>button:hover {
    background-color: #00000022;
}
.head>button:active {
    background-color: #ff000044;
}
.info-card {
    display: flex;
    flex-flow: column nowrap;
    background-color: white;
    border: solid #dddddd 2px;
    border-radius: 2px;
}
h4, h5 {
    padding-left: 10px;
    padding-top:10px;
}
h5+* {
    padding: 10px;
}
.body {
    overflow: auto;
}
</style>