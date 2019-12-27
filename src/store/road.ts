import { FullCourseJSON, RequirementsJSON } from "@/fireroad";
import { Module } from 'vuex';

export enum Quarter { FALL, IAP, SPRING, SUMMER }

function make_year(): string[][] {
    return [[], [], [], []];
}

// tslint:disable-next-line: max-classes-per-file
export class Road {
    public years = [make_year(), make_year(), make_year(), make_year()];
    public requirements: string[] = [];
}

const road_state = {
    course_roads: [] as Road[],
    viewing: -1,
};

export const roads: Module<typeof road_state, any> = {
    state: road_state,
    mutations: {
        new_road(state) {
            state.viewing = state.course_roads.length;
            state.course_roads.push(new Road());
        },
        add_year({ course_roads, viewing }) {
            course_roads[viewing].years.push(make_year());
        },
        remove_year({ course_roads, viewing }, year: number) {
            course_roads[viewing].years.splice(year, 1);
        },
        add_course({ course_roads, viewing },
            { year, quarter, course }: { year: number, quarter: Quarter, course: string }) {
            course_roads[viewing].years[year][quarter].push(course);
        },
        remove_course({ course_roads, viewing },
            { year, quarter, idx }: { year: number, quarter: Quarter, idx: number }) {
            course_roads[viewing].years[year][quarter].splice(idx, 1);
        },
        view(state, road: number) {
            state.viewing = road;
        }
    },
    namespaced: true,
};
