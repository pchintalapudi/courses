<template>
  <div class="search-bar" @click="view_results=false">
    <input
      type="text"
      name="course-search"
      id="course-search"
      v-model="search_text"
      @click.stop="view_results=true"
      @keydown.enter="enter"
    />
    <section class="results" v-if="view_results">
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
    return { search_text: "", view_results: false };
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
    enter() {
        if (this.search_results.length === 1) {
            this.show(this.search_results[0]);
        }
    }
  }
});
</script>
<style scoped>
#course-search {
  border: solid #e0e0e0 1px;
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
  border: solid #dddddd 2px;
  z-index: 1;
}
.search-result {
  padding: 5px;
  overflow: hidden;
  background-color: white;
  cursor: pointer;
  border: none;
  display: flex;
  width: 100%;
}
.search-result:hover {
  background-color: #eeeeee;
}
.search-result:active {
  background-color: #dddddd;
}
.search-result > * {
  padding: 5px;
}
</style>