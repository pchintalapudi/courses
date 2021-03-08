import { FullCourseJSON } from './courses';
import { RequirementsJSON } from './requirements';
import localForage from "localforage";

const COURSE_MANIFEST = ".course_manifest";
const COURSE_METADATA = ".course_metadata";

const REQUIREMENT_MANIFEST = ".requirement_manifest";
const REQUIREMENT_METADATA = ".requirement_metadata";

export async function offline_update_all_courses(valid_response: FullCourseJSON[]) {
    for (const response of valid_response) {
        localForage.setItem(response.subject_id, JSON.stringify(response));
    }
    localForage.setItem(COURSE_MANIFEST, JSON.stringify(valid_response.map(f => f.subject_id)));
    localForage.setItem(COURSE_METADATA, new Date().toUTCString());
    course_cache = valid_response;
}


export async function offline_update_all_requirements(valid_response: RequirementsJSON[]) {
    for (const response of valid_response) {
        localForage.setItem(response.list_id, JSON.stringify(response));
    }
    localForage.setItem(REQUIREMENT_MANIFEST, JSON.stringify(valid_response.map(f => f.list_id)));
    localForage.setItem(REQUIREMENT_METADATA, new Date().toUTCString());
    requirement_cache = valid_response;
}

export async function offline_last_course_update(): Promise<Date> {
    const last_up: string = (await localForage.getItem(COURSE_METADATA))!;
    return last_up ? new Date(Date.parse(last_up)) : new Date(0);
}
export async function offline_last_requirement_update(): Promise<Date> {
    const last_up: string = (await localForage.getItem(REQUIREMENT_METADATA))!;
    return last_up ? new Date(Date.parse(last_up)) : new Date(0);
}

export async function offline_update_course(course: FullCourseJSON) {
    localForage.setItem(course.subject_id, JSON.stringify(course));
    const manifest: string[] = JSON.parse(await localForage.getItem(COURSE_MANIFEST) as string);
    if (!manifest.includes(course.subject_id)) {
        manifest.push(course.subject_id);
        localForage.setItem(COURSE_MANIFEST, JSON.stringify(manifest));
    }
}
export async function offline_update_requirement(req: RequirementsJSON) {
    localForage.setItem(req.list_id, JSON.stringify(req));
    const manifest: string[] = JSON.parse(await localForage.getItem(REQUIREMENT_MANIFEST) as string);
    if (!manifest.includes(req.list_id)) {
        manifest.push(req.list_id);
        localForage.setItem(REQUIREMENT_MANIFEST, JSON.stringify(manifest));
    }
}

export async function offline_retrieve_from_course_file(id: string): Promise<FullCourseJSON> {
    return JSON.parse(await localForage.getItem(id) as string);
}
export async function offline_retrieve_from_requirement_file(id: string): Promise<RequirementsJSON> {
    return JSON.parse(await localForage.getItem(id) as string);
}

let course_cache = undefined as FullCourseJSON[] | undefined;
let requirement_cache = undefined as RequirementsJSON[] | undefined;

export async function offline_get_all_courses(): Promise<FullCourseJSON[]> {
    return course_cache || (course_cache =
        await Promise.all((JSON.parse(await localForage.getItem(COURSE_MANIFEST) as string) as string[])
            .map(offline_retrieve_from_course_file)));
}
export async function offline_get_all_requirements(): Promise<RequirementsJSON[]> {
    return requirement_cache || (requirement_cache =
        await Promise.all((JSON.parse(await localForage.getItem(REQUIREMENT_MANIFEST) as string) as string[])
            .map(offline_retrieve_from_requirement_file)));
}

async function clear_indexed_db() {
    localForage.clear();
}

(window as any).clear_indexed_db = clear_indexed_db;
(window as any).localForage = localForage;
