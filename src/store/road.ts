import { Module } from 'vuex';

export enum Quarter { FALL, IAP, SPRING, SUMMER }

function make_year(): never[][] {
    return [[], [], [], []];
}

// tslint:disable-next-line: max-classes-per-file
export class Road {
    public years = [make_year(), make_year(), make_year(), make_year()] as string[][][];
    public prior_credit: string[] = [];
    public requirements: string[] = [];
    public unsat = [make_year(), make_year(), make_year(), make_year()] as string[][][];
    public force_sat = [make_year(), make_year(), make_year(), make_year()] as boolean[][][];
}

const road_state = {
    course_roads: [] as Array<[string, Road]>,
    viewing: -1,
    undo_stack: [] as Array<{ undo: () => void, redo: () => void }>,
    idx: -1
};

const SAVE_FILE = ".roads";

export const roads: Module<typeof road_state, any> = {
    state: road_state,
    mutations: {
        _new_road(state, name: string) {
            state.viewing = state.course_roads.length;
            state.course_roads.push([name, new Road()]);
        },
        _splice_road(state, { road, idx }: { name: string, road: Road, idx: number }) {
            state.viewing = idx;
            state.course_roads.splice(idx, 0, [name, road]);
        },
        _view(state, road: number) {
            state.viewing = Math.max(Math.min(road, state.course_roads.length - 1), state.course_roads.length ? 0 : -1);
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
        _splice_year({ course_roads, viewing }, { idx, year }: { idx: number, year: string[][] }) {
            course_roads[viewing][1].years.splice(idx, 0, year);
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
            if (year !== -1) {
                course_roads[viewing][1].unsat[year][quarter].push("");
            }
        },
        _splice_course({ course_roads, viewing },
            { year, quarter, idx, unsat, course }:
                { year: number, quarter: number, idx: number, unsat: string, course: string }) {
            if (year === -1) {
                course_roads[viewing][1].prior_credit.splice(idx, 0, course);
            } else {
                course_roads[viewing][1].years[year][quarter].splice(idx, 0, course);
                course_roads[viewing][1].unsat[year][quarter].splice(idx, 0, unsat);
            }
        },
        _remove_course({ course_roads, viewing },
            { year, quarter, idx }: { year: number, quarter: number, idx: number }) {
            if (year !== -1) {
                course_roads[viewing][1].years[year][quarter].splice(idx, 1);
                course_roads[viewing][1].unsat[year][quarter].splice(idx, 1);
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
        _splice_requirement({ course_roads, viewing }, { idx, requirement }: { idx: number, requirement: string }) {
            course_roads[viewing][1].requirements.splice(idx, 0, requirement);
        },
        _remove_requirement({ course_roads, viewing }, idx: number) {
            course_roads[viewing][1].requirements.splice(idx, 1);
        },
        _load(state, new_state: typeof state) {
            state.course_roads = new_state.course_roads;
            state.course_roads.map(arr => arr[1]).forEach(road => {
                if (!road.unsat) {
                    road.unsat = [make_year(), make_year(), make_year(), make_year()];
                    for (let i = 0; i < road.years.length; i++) {
                        for (let j = 0; j < road.years[i].length; j++) {
                            for (const _ of road.years[i][j]) {
                                road.unsat[i][j].push("");
                            }
                        }
                    }
                }
                if (!road.force_sat) {
                    road.force_sat = [make_year(), make_year(), make_year(), make_year()];
                    for (let i = 0; i < road.years.length; i++) {
                        for (let j = 0; j < road.years[i].length; j++) {
                            for (const _ of road.years[i][j]) {
                                road.force_sat[i][j].push(false);
                            }
                        }
                    }
                }
            });
            state.viewing = new_state.viewing;
        },
        _set_stack(state, new_stack: typeof state.undo_stack) {
            state.undo_stack = new_stack;
        },
        _set_idx(state, idx: number) {
            state.idx = idx;
        },
        _log(state, action: { undo: () => void, redo: () => void }) {
            if (state.idx++ > -1) {
                state.undo_stack.splice(state.idx, state.undo_stack.length, action);
            } else {
                state.undo_stack.push(action);
            }
        },
        _undo(state) {
            if (state.idx > -1) {
                state.undo_stack[state.idx--].undo();
            }
        },
        _redo(state) {
            if (state.idx < state.undo_stack.length - 1) {
                state.undo_stack[++state.idx].redo();
            }
        },
        _update_unsat({ course_roads, viewing }, { year, quarter, unsat }:
            { year: number, quarter: number, idx: number, unsat: string[] }) {
            course_roads[viewing][1].unsat[year].splice(quarter, 1, unsat);
        },
        _specific_unsat({ course_roads, viewing },
            { year, quarter, idx, unsat }:
                { year: number, quarter: number, idx: number, unsat: string }) {
            course_roads[viewing][1].unsat[year][quarter].splice(idx, 1, unsat);
        },
        _force_sat({ course_roads, viewing },
            { year, quarter, idx, force }:
                { year: number, quarter: number, idx: number, force: boolean }) {
            course_roads[viewing][1].force_sat[year][quarter].splice(idx, 1, force);
        }
    },
    actions: {
        new_road({ state, commit, dispatch }, name: string) {
            const idx = state.course_roads[state.viewing].length;
            commit("_new_road", name);
            commit("_log", {
                redo: () => { commit("_new_road", name); dispatch("save"); },
                undo: () => { commit("_delete_road", idx); dispatch("save"); }
            });
            dispatch("save");
        },
        view({ state, commit, dispatch }, idx: number) {
            const prior = state.viewing;
            commit("_view", idx);
            commit("_log", {
                undo: () => { commit("_view", prior); dispatch("save"); },
                redo: () => { commit("_view", idx); dispatch("save"); }
            });
            dispatch("save");
        },
        update_name({ state, commit, dispatch }, pack: { road: number, name: string }) {
            const old_name = state.course_roads[pack.road][0];
            commit("_update_name", pack);
            commit("_log", {
                undo: () => { commit("_update_name", { road: pack.road, name: old_name }); dispatch("save"); },
                redo: () => { commit("_update_name", pack); dispatch("save"); }
            });
        },
        delete_road({ state, commit, dispatch }, idx: number) {
            const val = state.course_roads[idx];
            commit("_delete_road", idx);
            commit("_log", {
                undo: () => { commit("_splice_road", { name: val[0], road: val[1], idx }); dispatch("save"); },
                redo: () => { commit("_delete_road", idx); dispatch("save"); }
            });
            dispatch("save");
        },
        add_course({ state, commit, dispatch },
            pack: { year: number, quarter: number, course: string }) {
            const idx = pack.year === -1 ? state.course_roads[state.viewing][1].prior_credit.length
                : state.course_roads[state.viewing][1].years[pack.year][pack.quarter].length;
            let unsat = "";
            commit("_add_course", pack);
            commit("_log", {
                redo: () => {
                    commit("_add_course", pack);
                    dispatch("save");
                    commit("_specific_unsat", { year: pack.year, quarter: pack.quarter, idx, unsat });
                },
                undo: () => {
                    unsat = state.course_roads[state.viewing][1].unsat[pack.year][pack.quarter][idx];
                    commit("_remove_course", { year: pack.year, quarter: pack.quarter, idx });
                    dispatch("save");
                }
            });
            dispatch("save");
        },
        remove_course({ state, commit, dispatch }, pack: { year: number, quarter: number, idx: number }) {
            const course = pack.year === -1 ? state.course_roads[state.viewing][1].prior_credit[pack.idx]
                : state.course_roads[state.viewing][1].years[pack.year][pack.quarter][pack.idx];
            (pack as any).unsat = state.course_roads[state.viewing][1].unsat[pack.year][pack.quarter][pack.idx];
            commit("_remove_course", pack);
            commit("_log", {
                undo: () => { commit("_splice_course", { ...pack, course }); dispatch("save"); },
                redo: () => { commit("_remove_course", pack); dispatch("save"); }
            });
            dispatch("save");
        },
        add_requirement({ state, commit, dispatch }, requirement: string) {
            const idx = state.course_roads[state.viewing][1].requirements.length;
            commit("_add_requirement", requirement);
            commit("_log", {
                undo: () => { commit("_remove_requirement", idx); dispatch("save"); },
                redo: () => { commit("_add_requirement", requirement); dispatch("save"); }
            });
            dispatch("save");
        },
        remove_requirement({ state, commit, dispatch }, idx: number) {
            const requirement = state.course_roads[state.viewing][1].requirements[idx];
            commit("_remove_requirement", idx);
            commit("_log", {
                undo: () => { commit("_splice_requirement", { idx, requirement }); dispatch("save"); },
                redo: () => { commit("_remove_requirement", idx); dispatch("save"); }
            });
            dispatch("save");
        },
        save({ state, commit }) {
            const stack = state.undo_stack;
            const idx = state.idx;
            commit("_set_stack", []);
            commit("_set_idx", -1);
            const saved = JSON.stringify(state);
            commit("_set_stack", stack);
            commit("_set_idx", idx);
            localStorage.setItem(SAVE_FILE, saved);
        },
        load({ commit }) {
            const loaded = localStorage.getItem(SAVE_FILE);
            if (loaded) {
                commit("_load", JSON.parse(loaded));
                commit("_set_stack", []);
            }
        },
        undo({ commit }) { commit("_undo"); },
        redo({ commit }) { commit("_redo"); },
        update_unsat({ commit, dispatch }, pack: { year: number, quarter: number, unsat: boolean[] }) {
            commit("_update_unsat", pack);
            dispatch("save");
        },
        force_sat({ commit, dispatch }, pack: { year: number, quarter: number, idx: number, force: boolean }) {
            commit("_force_sat", pack);
            dispatch("save");
            commit("_log", {
                undo: () => {
                    commit("_force_sat", { year: pack.year, quarter: pack.quarter, idx: pack.idx, force: !pack.force });
                    dispatch("save");
                },
                redo: () => {
                    commit("_force_sat", pack);
                    dispatch("save");
                }
            });
        }
    },
    namespaced: true,
};
