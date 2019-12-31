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
    viewing: -1,
};

export const roads: Module<typeof road_state, any> = {
    state: road_state,
    mutations: {
        new_road(state, name: string) {
            state.viewing = state.course_roads.length;
            state.course_roads.push([name, new Road()]);
        },
        add_year({ course_roads, viewing }) {
            course_roads[viewing][1].years.push(make_year());
        },
        remove_year({ course_roads, viewing }, year: number) {
            course_roads[viewing][1].years.splice(year, 1);
        },
        add_course({ course_roads, viewing },
            { year, quarter, course }: { year: number, quarter: number, course: string }) {
            if (year !== -1) {
                course_roads[viewing][1].years[year][quarter].push(course);
            } else {
                course_roads[viewing][1].prior_credit.push(course);
            }
        },
        remove_course({ course_roads, viewing },
            { year, quarter, idx }: { year: number, quarter: number, idx: number }) {
            if (year !== -1) {
                course_roads[viewing][1].years[year][quarter].splice(idx, 1);
            } else {
                course_roads[viewing][1].prior_credit.splice(idx, 1);
            }
        },
        view(state, road: number) {
            state.viewing = road;
        },
        update_name({ course_roads }, { road, name }: { road: number, name: string }) {
            course_roads[road].splice(0, 1, name);
        },
        add_requirement({ course_roads, viewing }, requirement: string) {
            course_roads[viewing][1].requirements.push(requirement);
        },
        remove_requirement({ course_roads, viewing }, idx: number) {
            course_roads[viewing][1].requirements.splice(idx, 1);
        }
    },
    namespaced: true,
};
