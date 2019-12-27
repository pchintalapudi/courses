import { CourseJSON, FullCourseJSON, server_courses, is_full_course } from "@/fireroad/";
import { Module } from "vuex";

const classModuleState = {
    manifest: new Map<string, CourseJSON>(),
    loaded: new Set<string>(),
    manifest_updated: 1,
};

export const classes: Module<typeof classModuleState, any> = {
    state: classModuleState,
    mutations: {
        _load({ loaded }, dept: string) {
            loaded.add(dept);
        },
        _set_course(state, { id, course }: { id: string, course: CourseJSON }) {
            state.manifest.set(id, course);
            state.manifest_updated += 1;
        },
    },
    actions: {
        async full({ state, dispatch }, id: string) {
            const course = state.manifest.get(id);
            if (!course || !is_full_course(course)) { dispatch('_load_into_manifest', id); }
        },
        async partial({ state, dispatch }, id: string) {
            if (!state.manifest.has(id)) { dispatch('_load_into_manifest', id); }
        },
        async _load_into_manifest({ state, commit }, id: string) {
            const single_promise = server_courses.load(id);
            const dept = id.substring(0, id.indexOf("."));
            const department_promise = state.loaded.has(dept) ?
                new Promise<CourseJSON[]>([] as any) : server_courses.in_department(dept, false);
            commit('_load', dept);
            department_promise.then((courses) => courses.forEach((course) => {
                if (!state.manifest.has(course.subject_id)) {
                    commit('_set_course', { id: course.subject_id, course });
                }
            }));
            commit('_set_course', { id, course: await single_promise });
        },
    },
    namespaced: true,
};
