import { Module } from 'vuex';

export enum Quarter { FALL, IAP, SPRING, SUMMER }

function make_year(): string[][] {
    return [[], [], [], []];
}

// tslint:disable-next-line: max-classes-per-file
export class Road {
    public years = [make_year(), make_year(), make_year(), make_year()];
    public prior_credit: string[] = [];
    public requirements: string[] = [];
}

const road_state = {
    course_roads: [] as Array<[string, Road]>,
    viewing: -1
};

const SAVE_FILE = ".roads";

export const roads: Module<typeof road_state, any> = {
    state: road_state,
    mutations: {
        _new_road(state, name: string) {
            state.viewing = state.course_roads.length;
            state.course_roads.push([name, new Road()]);
        },
        _view(state, road: number) {
            state.viewing = road;
        },
        _update_name({ course_roads }, { road, name }: { road: number, name: string }) {
            course_roads[road].splice(0, 1, name);
        },
        _delete_road(state, idx: number) {
            if (state.viewing === idx) {
                if (idx === 0) {
                    state.viewing = state.course_roads.length > 1 ? 0 : -1;
                } else if (state.viewing === state.course_roads.length - 1) {
                    state.viewing--;
                }
            }
            state.course_roads.splice(idx, 1);
        },
        _add_year({ course_roads, viewing }) {
            course_roads[viewing][1].years.push(make_year());
        },
        _remove_year({ course_roads, viewing }, year: number) {
            course_roads[viewing][1].years.splice(year, 1);
        },
        _add_course({ course_roads, viewing },
            { year, quarter, course }: { year: number, quarter: number, course: string }) {
            const arr = year === -1 ? course_roads[viewing][1].prior_credit
                : course_roads[viewing][1].years[year][quarter];
            const cmp_nums = [parseInt(course, 10) || Number.POSITIVE_INFINITY,
            parseInt(course.substring(course.indexOf(".") + 1), 10) || Number.POSITIVE_INFINITY];
            for (let i = 0; i < arr.length; i++) {
                const next = [parseInt(arr[i], 10) || Number.POSITIVE_INFINITY,
                parseInt(arr[i].substring(arr[i].indexOf(".") + 1), 10) || Number.POSITIVE_INFINITY];
                if (cmp_nums[0] < next[0] || cmp_nums[0] === next[0] && cmp_nums[1] < next[1]) {
                    arr.splice(i, 0, course);
                    return;
                }
            }
            arr.push(course);
        },
        _remove_course({ course_roads, viewing },
            { year, quarter, idx }: { year: number, quarter: number, idx: number }) {
            if (year !== -1) {
                course_roads[viewing][1].years[year][quarter].splice(idx, 1);
            } else {
                course_roads[viewing][1].prior_credit.splice(idx, 1);
            }
        },
        _add_requirement({ course_roads, viewing }, requirement: string) {
            const arr = course_roads[viewing][1].requirements;
            if (!arr.includes(requirement)) {
                arr.push(requirement);
            }
        },
        _remove_requirement({ course_roads, viewing }, idx: number) {
            course_roads[viewing][1].requirements.splice(idx, 1);
        },
        _load(state, new_state: typeof state) {
            state.course_roads = new_state.course_roads;
            state.viewing = new_state.viewing;
        }
    },
    actions: {
        new_road({ commit, dispatch }, name: string) {
            commit("_new_road", name);
            dispatch("save");
        },
        view({ commit }, idx: number) {
            commit("_view", idx);
        },
        update_name({ commit }, pack: { road: number, name: string }) {
            commit("_update_name", pack);
        },
        delete_road({ commit, dispatch }, idx: number) {
            commit("_delete_road", idx);
            dispatch("save");
        },
        add_year({ commit, dispatch }) {
            commit("_add_year");
            dispatch("save");
        },
        remove_year({ commit, dispatch }, idx: number) {
            commit("_remove_year", idx);
            dispatch("save");
        },
        add_course({ commit, dispatch },
            pack: { year: number, quarter: number, course: string }) {
            commit("_add_course", pack);
            dispatch("save");
        },
        remove_course({ commit, dispatch }, pack: { year: number, quarter: number, idx: number }) {
            commit("_remove_course", pack);
            dispatch("save");
        },
        add_requirement({ commit, dispatch }, requirement: string) {
            commit("_add_requirement", requirement);
            dispatch("save");
        },
        remove_requirement({ commit, dispatch }, idx: number) {
            commit("_remove_requirement", idx);
            dispatch("save");
        },
        save({ state }) {
            const saved = JSON.stringify(state);
            localStorage.setItem(SAVE_FILE, saved);
        },
        load({ commit }) {
            const loaded = localStorage.getItem(SAVE_FILE);
            if (loaded) {
                commit("_load", JSON.parse(loaded));
            }
        }
    },
    namespaced: true,
};
