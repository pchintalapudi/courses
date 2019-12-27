import SplayTree from "splaytree";
import { CourseJSON, FullCourseJSON, server_courses, is_full_course } from "@/fireroad/";

class ClassCache {
    private manifest = new Map<string, CourseJSON>();
    private loaded = new Set<string>();

    public async full(id: string) {
        const course = this.manifest.get(id);
        if (!course) {
            return this.load_into_manifest(id);
        } else if (!is_full_course(course)) {
            return this.load_into_manifest(id);
        }
        return course as FullCourseJSON;
    }

    public async partial(id: string) {
        return this.manifest.get(id) || this.load_into_manifest(id);
    }

    private async load_into_manifest(id: string) {
        const single_promise = server_courses.load(id);
        const dept = id.substring(0, id.indexOf("."));
        const department_promise =
            this.loaded.has(dept) ? new Promise<CourseJSON[]>([] as any) : server_courses.in_department(dept, false);
        this.loaded.add(dept);
        const full_course = await single_promise;
        department_promise.then((courses) => courses.forEach((course) => {
            if (!this.manifest.has(course.subject_id)) { this.manifest.set(course.subject_id, course); }
        }));
        this.manifest.set(id, await single_promise);
        return full_course;
    }
}

export const classCache = new ClassCache();
