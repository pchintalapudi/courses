import { CourseJSON, server_courses, is_full_course, Trie } from "@/fireroad/";
import { Module } from "vuex";

const classModuleState = {
    manifest: new Map<string, CourseJSON>(),
    loaded: new Set<string>(),
    manifest_updated: 0,
    id_search_trie: new Trie(),
    access_log: new Map<string, Set<string>>()
};

// After n classes are loaded, we assume the whole department is of interest to the student
// So on the n+1th load we also load the whole department's full course registry
// We therefore set this constant as 5 because why not
const _LOAD_WHOLE_DEPT = 5;

export const classes: Module<typeof classModuleState, any> = {
    state: classModuleState,
    mutations: {
        _load({ loaded }, dept_or_id: string) {
            loaded.add(dept_or_id);
        },
        _access({ access_log }, id: string) {
            const dept = id.substring(0, id.indexOf("."));
            if (!access_log.has(dept)) { access_log.set(dept, new Set<string>()); }
            access_log.get(dept)!.add(id);
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
            const dept = id.substring(0, id.indexOf("."));
            const access_log = state.access_log.get(dept);
            if (access_log && !access_log.has(id) && access_log.size === _LOAD_WHOLE_DEPT) {
                server_courses.in_department<true>(dept, true).then((courses) => dispatch("_delay_dept_load", courses));
            }
            commit('_access', id);
            const course = state.manifest.get(id);
            if ((!course || !is_full_course(course)) && !state.loaded.has(id)) {
                commit('_load', id);
                dispatch('_delay_manifest_load', await server_courses.load(id));
            }
        },
        _delay_manifest_load({ state, commit, dispatch }, course: CourseJSON) {
            if (!state.manifest_updated) {
                window.setTimeout(() => dispatch("_delay_manifest_load", course), 1000);
            } else {
                commit('_set_course', course);
            }
        },
        _delay_dept_load({ state, commit, dispatch }, courses: CourseJSON[]) {
            if (!state.manifest_updated) {
                window.setTimeout(() => dispatch("_delay_dept_load", courses), 1000);
            } else {
                courses.forEach((c) => commit("_set_course", c));
            }
        }
    },
    namespaced: true,
};
