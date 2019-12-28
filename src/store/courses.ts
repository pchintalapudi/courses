import { CourseJSON, server_courses, is_full_course, Trie } from "@/fireroad/";
import { Module } from "vuex";

const classModuleState = {
    manifest: new Map<string, CourseJSON>(),
    loaded: new Set<string>(),
    manifest_updated: 0,
    id_search_trie: new Trie()
};

export const classes: Module<typeof classModuleState, any> = {
    state: classModuleState,
    mutations: {
        _load({ loaded }, dept_or_id: string) {
            loaded.add(dept_or_id);
        },
        _set_course(state, course: CourseJSON) {
            state.manifest.set(course.subject_id, course);
            state.manifest_updated += 1;
        },
        _bulk_load(state, manifest: Map<string, CourseJSON>) {
            state.manifest = manifest;
            state.manifest_updated = 1;
            manifest.forEach((v, k) => state.id_search_trie.add(k, v));
        }
    },
    actions: {
        async init({ commit }) {
            const all_courses = await server_courses.all(false);
            const course_map = new Map<string, CourseJSON>(all_courses.map((c) => [c.subject_id, c]));
            commit("_bulk_load", course_map);
        },
        async load({ state, commit, dispatch }, id: string) {
            const course = state.manifest.get(id);
            if ((!course || !is_full_course(course)) && !state.loaded.has(id)) {
                commit('_load', id);
                dispatch('_delay_manifest_load', await server_courses.load(id));
            }
        },
        _delay_manifest_load({ state, commit, dispatch }, course: CourseJSON) {
            if (!state.manifest_updated) {
                window.setTimeout(() => dispatch("_delay_manifest_load"), 1000);
            } else {
                commit('_set_course', course);
            }
        }
    },
    namespaced: true,
};
