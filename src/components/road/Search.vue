<template>
  <div class="search-bar" @click="view_results=false">
    <input
      type="text"
      name="course-search"
      id="course-search"
      v-model="search_text"
      @click.stop="view_results=true"
      @keydown="key"
    />
    <section class="results" v-if="view_results && search_results.length">
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
export default Vue.extend({
  data() {
    return { search_text: "", view_results: false, timeout: 0 };
  },
  computed: {
    trimmed(): string {
      return this.search_text.trim();
    },
    search_results(): CourseJSON[] {
      return this.trimmed
        ? this.$store.state.classes.id_search_trie.autocomplete(
            this.trimmed.toUpperCase()
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
        if (this.search_results.length === 1 || this.timeout) {
          this.show(this.search_results[0]);
        } else {
          this.timeout = window.setTimeout(() => (this.timeout = 0), 500);
        }
      } else {
        window.clearTimeout(this.timeout);
        this.timeout = 0;
      }
    }
  }
});
</script>
<style scoped>
#course-search {
  border: solid #ffffff18 1px;
  background-color: #ffffff10;
  color: white;
  border-radius: 5px;
  padding: 5px;
  margin: 5px;
  width: 200px;
}
.search-bar {
  position: relative;
}
.results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  overflow: auto;
  max-height: 50vh;
  background-color: #202020;
  border: solid #ffffff20 2px;
  z-index: 1;
}
.search-result {
  padding: 5px;
  overflow: hidden;
  background-color: transparent;
  color: hsl(0, 0%, 80%);
  cursor: pointer;
  border: none;
  display: flex;
  width: 100%;
}
.search-result:hover {
  background-color: #ffffff20;
}
.search-result:active {
  background-color: #ffffff28;
}
.search-result > * {
  padding: 5px;
}
</style>