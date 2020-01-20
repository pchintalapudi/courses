<template>
  <div class="search-bar" @focusin="view_results=true" @focusout="view_results=false">
    <label>
      Search for a course
      <input
        type="text"
        name="course-search"
        id="course-search"
        v-model="search_text"
        @keydown="key"
      />
    </label>
    <div>
      HASS
      <span>
        <button :on="filter.hass === 'any'" @click="toggle('hass', 'any')">Any</button>
        <button :on="filter.hass === 'h'" @click="toggle('hass', 'h')">H</button>
        <button :on="filter.hass === 'a'" @click="toggle('hass', 'a')">A</button>
        <button :on="filter.hass === 's'" @click="toggle('hass', 's')">S</button>
      </span>
    </div>
    <div>
      CI
      <span>
        <button :on="filter.ci === 'not-ci'" @click="toggle('ci', 'not-ci')">Not</button>
        <button :on="filter.ci === 'cih'" @click="toggle('ci', 'cih')">H</button>
        <button :on="filter.ci === 'cihw'" @click="toggle('ci', 'cihw')">HW</button>
      </span>
    </div>
    <div>
      Offered
      <span>
        <button :on="filter.offered === 'fall'" @click="toggle('offered', 'fall')">Fall</button>
        <button :on="filter.offered === 'iap'" @click="toggle('offered', 'iap')">IAP</button>
        <button :on="filter.offered === 'spring'" @click="toggle('offered', 'spring')">Spring</button>
        <button :on="filter.offered === 'summer'" @click="toggle('offered', 'summer')">Summer</button>
      </span>
    </div>
    <div>
      GIR
      <span>
        <button :on="filter.gir === 'any'" @click="toggle('gir', 'any')">Any</button>
        <button :on="filter.gir === 'lab'" @click="toggle('gir', 'lab')">Lab</button>
        <button :on="filter.gir === 'rest'" @click="toggle('gir', 'rest')">REST</button>
      </span>
    </div>
    <section class="results" v-if="(force_view || view_results) && search_results.length" @mouseenter="force_view=true" @mouseleave="force_view=false">
      <button
        v-for="result in search_results"
        :key="result.subject_id"
        class="search-result"
        @click="show(result)"
      >
        <b>{{result.subject_id}}</b>
        <p>{{result.title}}</p>
      </button>
    </section>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { CourseJSON } from "@/fireroad";
import { CourseFilter } from "@/fireroad/courses";
export default Vue.extend({
  data() {
    return {
      search_text: "",
      view_results: false,
      timeout: 0,
      filter: {
        gir: undefined,
        hass: undefined,
        ci: undefined,
        offered: undefined
      } as CourseFilter,
      force_view: false
    };
  },
  computed: {
    trimmed(): string {
      return this.search_text.trim();
    },
    search_results(): CourseJSON[] {
      return this.trimmed
        ? this.$store.getters["classes/autocomplete"](
            this.trimmed.toUpperCase(),
            this.filter
          )
        : [];
    }
  },
  methods: {
    show(result: CourseJSON) {
      this.$emit("load-course", result.subject_id);
      this.view_results = false;
    },
    key(key: KeyboardEvent) {
      if (key.key === "Enter") {
        if (
          this.search_results.length === 1 ||
          (this.timeout && this.search_results.length)
        ) {
          this.show(this.search_results[0]);
        } else {
          this.timeout = window.setTimeout(() => (this.timeout = 0), 500);
        }
      } else {
        window.clearTimeout(this.timeout);
        this.timeout = 0;
      }
    },
    toggle(attr: string, value: string) {
      const filter = this.filter as any;
      filter[attr] = filter[attr] === value ? undefined : value;
    }
  }
});
</script>
<style scoped>
#course-search {
  border: solid hsla(var(--contrast), calc(var(--level) * 4)) 1px;
  transition: background-color 1s, border-color 1s, color 1s;
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
  color: hsl(var(--contrast));
  border-radius: 5px;
  padding: 5px;
  margin: 5px;
  width: 200px;
}
.search-bar {
  position: relative;
  display: flex;
  flex-flow: row nowrap;
}
.search-bar > div {
  display: flex;
  flex-flow: column wrap;
  text-align: center;
  padding: 5px;
  border-left: dashed hsla(var(--contrast), calc(var(--level) * 4)) 1px;
  border-right: dashed hsla(var(--contrast), calc(var(--level) * 4)) 1px;
}
.search-bar > div > span {
  display: flex;
  flex-flow: row wrap;
}
button {
  min-width: 44px;
  min-height: 44px;
  background-color: hsla(var(--contrast), calc(var(--level) * 0));
  border: solid hsla(var(--contrast), calc(var(--level) * 2)) 2px;
  color: hsl(var(--contrast));
  cursor: pointer;
  transition: background-color 300ms;
  padding: 5px;
}
button[on] {
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
}
button:hover {
  background-color: hsla(var(--contrast), calc(var(--level) * 3));
}
button:active {
  background-color: hsla(var(--contrast), calc(var(--level) * 4));
}
.results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  overflow: auto;
  max-height: 50vh;
  transition: background-color 1s;
  background-color: hsl(var(--background));
  border: solid hsla(var(--contrast), calc(var(--level) * 4)) 2px;
  z-index: 3;
}
.search-result {
  padding: 5px;
  overflow: hidden;
  background-color: transparent;
  color: hsla(var(--contrast), calc(var(--level) * 15));
  cursor: pointer;
  border: none;
  display: flex;
  width: 100%;
}
.search-result:hover {
  color: hsla(var(--contrast), calc(var(--level) * 17.5));
  background-color: hsla(var(--contrast), calc(var(--level) * 1));
}
.search-result:active {
  color: hsla(var(--contrast), calc(var(--level) * 20));
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
}
.search-result > * {
  padding: 5px;
}
</style>