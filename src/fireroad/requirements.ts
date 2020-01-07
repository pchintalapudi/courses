import { URLBuilder } from './base';
import { error } from './debug';
import {
    offline_get_all_requirements,
    offline_update_all_requirements,
    offline_last_requirement_update,
    offline_update_requirement,
    offline_retrieve_from_requirement_file
} from './offline_cache';
export interface RequirementTitles {
    short_title: string;
    medium_title: string;
    title_no_degree: string;
    title: string;
    list_id: string;
}

export interface Requirement {
    req: string;
    title?: string;
}

export interface RequirementGroup {
    connection_type: 'all' | 'any';
    threshold_desc: string;
    reqs: Array<Requirement | RequirementGroup>;
    title: string;
}

export interface Class {
    id: string;
    index: number;
    overrideWarnings: boolean;
    semester: number;
}

export interface RoadJSON {
    coursesOfStudy: string[];
    progressOverrides?: any;
    selectedSubjects: Class[];
}

export function is_requirement(req: Requirement | RequirementGroup): req is Requirement {
    return (req as Requirement).req !== undefined;
}

export interface RequirementsJSON extends RequirementTitles {
    desc?: string;
    reqs: Array<Requirement | RequirementGroup>;
}

export interface ProgressJSON extends RequirementsJSON {
    fulfilled: boolean;
    progress: number;
    max: number;
    percent_fulfilled: number;
    sat_courses: string[];
}

function snake_on_a_kebab(raw: any): any {
    const snake: any = {};
    // tslint:disable-next-line: forin
    for (const key in raw) {
        let value = raw[key];
        if (Array.isArray(value)) {
            value = value.map(snake_on_a_kebab);
        } else if (typeof value === 'object') {
            value = snake_on_a_kebab(value);
        }
        snake[key.replace('-', '_')] = value;
    }
    return snake;
}

export class RequirementsRequester {
    public async all_titles(): Promise<RequirementTitles[]> {
        const promise = window.fetch(URLBuilder.path('requirements').path('list_reqs').build());
        try {
            const response = await promise;
            if (response.ok) {
                const json = await response.json();
                const titles: RequirementTitles[] = [];
                // tslint:disable-next-line: forin
                for (const key in json) {
                    const internal = json[key];
                    titles.push({
                        list_id: key,
                        short_title: internal['short-title'],
                        medium_title: internal['medium-title'],
                        title_no_degree: internal['title-no-degree'],
                        title: internal.title,
                    });
                }
                const builder = URLBuilder.path("requirements").path("get_json");
                if ((await offline_last_requirement_update()).getTime() < Date.now() - 8.64e+7) {
                    Promise.all(titles.map(t => window.fetch(builder.clone().path(t.list_id).build())))
                        .then(async r => offline_update_all_requirements(await Promise.all(
                            r.map(async (resp, idx) => resp.ok ? snake_on_a_kebab({
                                ...await resp.json(),
                                list_id: titles[idx].list_id
                            }) : undefined).filter(resp => resp !== undefined))));
                }
                return titles;
            }
        } catch (err) {
            error(err);
        }
        return offline_get_all_requirements();
    }

    public async requirements(id: string): Promise<RequirementsJSON> {
        return snake_on_a_kebab(await (await window.fetch(
            URLBuilder.path('requirements').path('get_json').path(id).build())).json());
    }

    public async progress(id: string, road: RoadJSON): Promise<ProgressJSON> {
        const promise = window.fetch(URLBuilder.path('requirements').path('progress').path(id).build(),
            { method: "POST", body: JSON.stringify(road) });
        try {
            const response = await promise;
            if (response.ok) {
                const progress = await snake_on_a_kebab(await response.json());
                const update = JSON.parse(JSON.stringify(progress));
                update.list_id = id;
                offline_update_requirement(update);
                return progress;
            }
        } catch (err) { error(err); }
        return offline_retrieve_from_requirement_file(id) as Promise<ProgressJSON>;
    }
}

export function has_requirements(requirements: RequirementTitles): requirements is RequirementsJSON {
    return (requirements as RequirementsJSON).reqs !== undefined;
}

export function has_progress(requirements: RequirementTitles): requirements is ProgressJSON {
    return (requirements as ProgressJSON).progress !== undefined;
}
