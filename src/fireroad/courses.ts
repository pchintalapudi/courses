import { URLBuilder } from './base';
import { error } from './debug';
import {
    offline_get_all_courses,
    offline_last_course_update,
    offline_update_all_courses,
    offline_update_course,
    offline_retrieve_from_course_file
} from './offline_cache';

export interface CourseJSON {
    subject_id: string;
    title: string;
    total_units: number;
    offered_fall: boolean;
    offered_IAP: boolean;
    offered_spring: boolean;
    offered_summer: boolean;
    public: boolean;

    level?: 'U' | 'G';
    source_semester?: string;
    is_historical?: boolean;
    custom_color?: string;
    creator?: string;
    joint_subjects?: string[];
    equivalent_subjects?: string[];
    meets_with_subjects?: string[];
    quarter_information?: string;
    not_offered_year?: string;
    instructors?: string[];
    communication_requirement?: 'CI-H' | 'CI-HW';
    hass_attribute?: 'HASS-S' | 'HASS-A' | 'HASS-H' | 'HASS';
    gir_attribute?: 'REST' | 'LAB2' | 'LAB' | 'CAL1' | 'CAL2' | 'CHEM' | 'BIOL' | 'PHY1' | 'PHY2';
    parent?: string;
    children?: string[];
}

export interface FullCourseJSON extends CourseJSON {
    lecture_units: number;
    lab_units: number;
    design_units: number;
    preparation_units: number;
    is_variable_units: boolean;
    is_half_class: boolean;
    pdf_option: boolean;
    has_final: boolean;

    description?: string;
    prerequisites?: string;
    corequisites?: string;
    url?: string;
    related_subjects?: string;
    rating?: number;
    enrollment_number?: number;
    in_class_hours?: number;
    out_of_class_hours?: number;
}

export interface CourseFilter {
    type?: 'contains' | 'matches' | 'starts' | 'ends';
    gir?: 'off' | 'any' | 'lab' | 'rest';
    hass?: 'off' | 'any' | 'a' | 's' | 'h';
    ci?: 'off' | 'cih' | 'cihw' | 'not-ci';
    offered?: 'off' | 'fall' | 'iap' | 'spring' | 'summer';
    level?: 'off' | 'undergrad' | 'grad';
}

export class CourseRequester {

    public async all<full = false>(full: boolean):
        Promise<full extends true ? FullCourseJSON[] : CourseJSON[]> {
        const all_promise = window.fetch(URLBuilder.path('courses').path('all').query('full', '' + full).build());
        try {
            const response = await all_promise;
            if (response.ok) {
                if ((await offline_last_course_update()).getTime() < Date.now() - 8.64e+7) {
                    window.fetch(URLBuilder.path('courses').path('all').query('full', 'true').build()).then(async r => {
                        if (r.ok) {
                            offline_update_all_courses(await r.json());
                        }
                    });
                }
                return response.json();
            }
        } catch (err) {
            error(err);
        }
        return offline_get_all_courses() as any;
    }

    public async in_department<full = false>(dept: string, full: boolean):
        Promise<full extends true ? FullCourseJSON[] : CourseJSON[]> {
        return (await window.fetch(
            URLBuilder.path('courses').path('dept').path(dept).query('full', '' + full).build())).json();
    }

    public async load(id: string): Promise<FullCourseJSON> {
        const promise = window.fetch(URLBuilder.path('courses').path('lookup').path(id).build());
        try {
            const response = await promise;
            if (response.ok) {
                const course = await response.json();
                offline_update_course(course);
                return course;
            }
        } catch (err) {
            error(err);
        }
        return offline_retrieve_from_course_file(id);
    }

    public async search<full = false>(query: string, full: boolean, filters: CourseFilter = {}):
        Promise<full extends true ? FullCourseJSON[] : CourseJSON[]> {
        const builder = URLBuilder.path('courses').path('search').path(query).query('full', '' + full);
        if ('type' in filters) { builder.query('type', filters.type); }
        if ('gir' in filters) { builder.query('gir', filters.gir); }
        if ('hass' in filters) { builder.query('hass', filters.hass); }
        if ('ci' in filters) { builder.query('ci', filters.ci); }
        if ('offered' in filters) { builder.query('offered', filters.offered); }
        if ('level' in filters) { builder.query('level', filters.level); }
        return (await window.fetch(builder.build())).json();
    }
}

export function is_full_course(course: CourseJSON): course is FullCourseJSON {
    return (course as FullCourseJSON).lecture_units !== undefined;
}
function range(
    num: number,
    start: number,
    end: number,
    out_start: number,
    out_end: number
) {
    return (
        out_start + ((out_end - out_start) * (num - start)) / (end - start)
    );
}
export function compute_color(course: string) {
    const num = parseInt(course, 10);
    const hue = Number.isNaN(num) ? 30 : Number(range(num, 1, 24, 0, 1065).toFixed(0));
    return hue;
}
