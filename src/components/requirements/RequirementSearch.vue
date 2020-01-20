<template>
  <div class="search-bar" @click="view_results=false">
    <label>
        Search for a requirement
      <input
        type="text"
        name="req-search"
        id="req-search"
        v-model="search_text"
        @click.stop="view_results=true"
        @keydown="key"
        :disabled="disable"
      />
    </label>
    <section class="results" v-if="view_results && search_results.length">
      <button
        v-for="result in search_results"
        :key="result.reqs.list_id"
        class="search-result"
        @click="show(result)"
      >
        <b>{{result.reqs.medium_title}}</b>
        <p>{{result.reqs.title_no_degree}}</p>
      </button>
    </section>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { RequirementTitles } from "@/fireroad";
import { Requirements } from "@/store/requirements";
export default Vue.extend({
  props: { disable: Boolean },
  data() {
    return {
      search_text: "",
      view_results: false,
      ignore_set: new Set(["by", "of", "in", "as", "the", "and"]),
      timeout: 0
    };
  },
  computed: {
    trimmed(): string {
      return this.search_text.trim();
    },
    search_results(): Requirements[] {
      if (!this.trimmed) {
        return [];
      }
      const words = this.trimmed
        .replace(/\(|\)|,/g, "")
        .toLowerCase()
        .split(" ")
        .filter(s => !this.ignore_set.has(s));
      const sets: Array<Array<Set<Requirements>>> = words.map(w =>
        this.$store.getters["requirements/autocomplete"](w)
      );
      const set = new Set(sets.flatMap(a => a.flatMap(s => Array.from(s))));
      return Array.from(set);
    }
  },
  methods: {
    show(result: Requirements) {
      this.$emit("load-requirement", result.reqs.list_id);
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
    }
  }
});
</script>
<style scoped>
#req-search {
  border: solid hsla(var(--contrast), calc(var(--level) * 4)) 1px;
  transition: background-color 1s, border-color 1s, color 1s;
  background-color: hsla(var(--contrast), calc(var(--level) * 2));
  color: hsl(var(--contrast));
  border-radius: 5px;
  padding: 5px;
  margin: 5px;
}
#req-search:disabled {
  background-color: hsla(var(--contrast), calc(var(--level)));
  border-color: hsla(var(--contrast), calc(var(--level) * 2));
  cursor: not-allowed;
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
  transition: background-color 1s;
  background-color: hsl(var(--background));
  border: solid hsla(var(--contrast), calc(var(--level) * 4)) 2px;
  z-index: 1;
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