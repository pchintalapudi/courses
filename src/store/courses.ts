import { CourseJSON, server_courses, is_full_course, Trie } from "@/fireroad/";
import { Module } from "vuex";
import { CourseFilter } from '@/fireroad/courses';

const classModuleState = {
    manifest: new Map<string, CourseJSON>(),
    loaded: new Set<string>(),
    manifest_tracker: 0,
    id_search_trie: new Trie<CourseJSON>(),
    title_search_trie: new Trie<Set<CourseJSON>>(),
    access_log: new Map<string, Set<string>>()
};

// After n classes are loaded, we assume the whole department is of interest to the student
// So on the n+1th load we also load the whole department's full course registry
// We therefore set this constant because why not
const _LOAD_WHOLE_DEPT = 3;
const ignore_set = new Set(["by", "of", "in", "as", "the", "and"]);

export const classes: Module<typeof classModuleState, any> = {
    state: classModuleState,
    getters: {
        class({ manifest, manifest_tracker }) {
            return (id: string) => manifest_tracker ? manifest.get(id) : undefined;
        },
        autocomplete({ id_search_trie, title_search_trie }) {
            return (word: string, filter: CourseFilter) => {
                const ids = id_search_trie.autocomplete(word);
                const titles = word.toLowerCase().split(" ").filter(w => !ignore_set.has(w))
                    .flatMap(w => title_search_trie.autocomplete(w).flatMap(s => Array.from(s)));
                const title_map = new Map<CourseJSON, number>();
                for (const course of ids) {
                    if (!title_map.has(course)) {
                        title_map.set(course, 1);
                    } else {
                        title_map.set(course, title_map.get(course)! + 1);
                    }
                }
                for (const course of titles) {
                    if (!title_map.has(course)) {
                        title_map.set(course, 1);
                    } else {
                        title_map.set(course, title_map.get(course)! + 1);
                    }
                }
                const out = Array.from(title_map).sort((a, b) =>
                    a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0
                ).map(tup => tup[0]);
                const filters = [] as Array<(c: CourseJSON) => boolean>;
                if (filter.ci) {
                    let func = (c: CourseJSON) => !c.communication_requirement;
                    switch (filter.ci) {
                        case "cih":
                            func = (c: CourseJSON) => !!c.communication_requirement;
                            break;
                        case "cihw":
                            func = (c: CourseJSON) => c.communication_requirement === "CI-HW";
                            break;
                    }
                    filters.push(func);
                }
                if (filter.gir) {
                    let func = (c: CourseJSON) => !!c.gir_attribute;
                    switch (filter.gir) {
                        case "lab":
                            func = (c: CourseJSON) => !!c.gir_attribute && c.gir_attribute.includes("LAB");
                            break;
                        case "rest":
                            func = (c: CourseJSON) => !!c.gir_attribute && c.gir_attribute.includes("REST");
                            break;
                    }
                    filters.push(func);
                }
                if (filter.hass) {
                    let func = (c: CourseJSON) => !!c.hass_attribute;
                    switch (filter.hass) {
                        case "h":
                            func = (c: CourseJSON) => !!c.hass_attribute && c.hass_attribute.includes("HASS-H");
                            break;
                        case "a":
                            func = (c: CourseJSON) => !!c.hass_attribute && c.hass_attribute.includes("HASS-A");
                            break;
                        case "s":
                            func = (c: CourseJSON) => !!c.hass_attribute && c.hass_attribute.includes("HASS-S");
                            break;
                    }
                    filters.push(func);
                }
                if (filter.offered) {
                    switch (filter.offered) {
                        case "fall":
                            filters.push(c => c.offered_fall);
                            break;
                        case "iap":
                            filters.push(c => c.offered_IAP);
                            break;
                        case "spring":
                            filters.push(c => c.offered_spring);
                            break;
                        case "summer":
                            filters.push(c => c.offered_summer);
                            break;
                    }
                }
                return out.filter(c => filters.map(f => f(c)).reduce((b1, b2) => b1 && b2, true));
            };
        }
    },
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
            state.manifest_tracker += 1;
        },
        _bulk_load(state, manifest: Map<string, CourseJSON>) {
            state.manifest = manifest;
            state.manifest_tracker = 1;
            manifest.forEach((v, k) => {
                state.id_search_trie.add(k, v);
                v.title.split(" ").forEach(word => {
                    state.title_search_trie.get_or_set(word.toLowerCase(), new Set<CourseJSON>()).add(v);
                });
            });
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
            if (!state.manifest_tracker) {
                window.setTimeout(() => dispatch("_delay_manifest_load", course), 1000);
            } else {
                commit('_set_course', course);
            }
        },
        _delay_dept_load({ state, commit, dispatch }, courses: CourseJSON[]) {
            if (!state.manifest_tracker) {
                window.setTimeout(() => dispatch("_delay_dept_load", courses), 1000);
            } else {
                courses.forEach((c) => commit("_set_course", c));
            }
        }
    },
    namespaced: true,
};
