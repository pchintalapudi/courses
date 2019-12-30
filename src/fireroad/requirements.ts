import { URLBuilder } from './base';
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
        const json = await (await window.fetch(URLBuilder.path('requirements').path('list_reqs').build())).json();
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
        return titles;
    }

    public async requirements(id: string): Promise<RequirementsJSON> {
        return snake_on_a_kebab(await (await window.fetch(
            URLBuilder.path('requirements').path('get_json').path(id).build())).json());
    }

    public async progress(id: string, courses: string[]): Promise<ProgressJSON> {
        return snake_on_a_kebab(await (await window.fetch(
            URLBuilder.path('requirements').path('progress').path(id).path(courses.join(",")).build())).json());
    }
}

export function has_requirements(requirements: RequirementTitles): requirements is RequirementsJSON {
    return (requirements as RequirementsJSON).reqs !== undefined;
}

export function has_progress(requirements: RequirementTitles): requirements is ProgressJSON {
    return (requirements as ProgressJSON).progress !== undefined;
}
