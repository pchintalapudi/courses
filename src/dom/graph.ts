import { FullCourseJSON } from '@/fireroad';
import { requisite_parser, de_gir, is_gir } from '@/fireroad/demystify';

const xmlns = "http://www.w3.org/2000/svg";

// Map of class to classes w/ this class as prereq
const reverse_prereqs = new Map<string, Set<string>>();
// Map of class to classes w/ this class as coereq
const reverse_coreqs = new Map<string, Set<string>>();
// Doubly-mapped map of id -> id -> svg
const drawn_lines = new Map<string, Map<string, SVGPathElement>>();

const draw_queue = [] as SVGPathElement[];
const remove_queue = new Set<SVGPathElement>();

function do_draw() {
    const svg = document.getElementById("graph") as any as SVGSVGElement;
    draw_queue.forEach(path => {
        if (!remove_queue.has(path)) {
            svg.appendChild(path);
        } else {
            remove_queue.delete(path);
        }
    });
    remove_queue.forEach(path => path.remove());
    draw_queue.length = 0;
    remove_queue.clear();
}

function queue_mod() {
    if (!draw_queue.length && !remove_queue.size) {
        window.requestAnimationFrame(() => do_draw());
    }
}

function get_all_targets(course_id: string) {
    return is_gir(course_id) ?
        de_gir(course_id).flatMap(r => Array.from(document.getElementsByClassName(r))) :
        Array.from(document.getElementsByClassName(course_id));
}

interface IDJSON {
    year: number;
    quarter: number;
    idx: number;
}

function cmp_id(first: IDJSON, second: IDJSON) {
    return first.year < second.year ? -1 : second.year < first.year ? 1 :
        first.quarter < second.quarter ? -1 : second.quarter < first.quarter ? 1 :
            first.idx < second.idx ? -1 : second.idx < first.idx ? 1 : 0;
}

function get_lowest_target(course_id: string, ignore?: Element) {
    const targets = get_all_targets(course_id);
    let min = undefined as undefined | Element;
    let min_json = undefined as undefined | IDJSON;
    for (const target of targets) {
        if (ignore !== target) {
            const json = JSON.parse(target.id);
            if (!min_json || cmp_id(min_json, json) > 0) {
                min = target;
                min_json = json;
            }
        }
    }
    return min;
}

function draw(from_element: HTMLElement, to_element: HTMLElement, prereq: boolean) {
    const path = document.createElementNS(xmlns, "path");
    path.classList.add(prereq ? "p-req" : "c-req");
    const start_point = [from_element.offsetLeft + from_element.offsetWidth / 2,
    from_element.offsetTop + from_element.offsetHeight / 2];
    const end_point = [to_element.offsetLeft + to_element.offsetWidth / 2,
    to_element.offsetTop + to_element.offsetHeight / 2];
    path.setAttribute("d", `M ${start_point[0]} ${start_point[1]} L ${end_point[0]} ${end_point[1]}`);
    queue_mod();
    draw_queue.push(path);
    return path;
}

function update_drawn_map(from_id: string, to_id: string, path: SVGPathElement) {
    let map = drawn_lines.get(to_id);
    if (!map) { drawn_lines.set(to_id, map = new Map()); }
    let old = map.get(from_id);
    if (old) {
        queue_mod();
        remove_queue.add(old);
    }
    map.set(from_id, path);
    map = drawn_lines.get(from_id);
    if (!map) { drawn_lines.set(from_id, map = new Map()); }
    old = map.get(from_id);
    if (old) {
        queue_mod();
        remove_queue.add(old);
    }
    map.set(to_id, path);
}

function connect_forwards(course_id: string, element_id: IDJSON, find_id: string, prereq: boolean) {
    const from_element = get_lowest_target(find_id);
    if (from_element) {
        const str_id = JSON.stringify(element_id);
        const to_element = document.getElementById(str_id)!;
        const path = draw(from_element as HTMLElement, to_element, prereq);
        update_drawn_map(from_element.id, str_id, path);
        const rmap = prereq ? reverse_prereqs : reverse_coreqs;
        const finds = is_gir(find_id) ? de_gir(find_id) : [find_id];
        const courses = is_gir(course_id) ? de_gir(course_id) : [course_id];
        finds.forEach(f => {
            let set = rmap.get(f);
            if (!set) { rmap.set(f, set = new Set()); }
            courses.forEach(c => set!.add(c));
        });
    }
}

function connect_backwards(course_id: string, element_id: IDJSON, prereq: boolean) {
    const str_id = JSON.stringify(element_id);
    const from_element = document.getElementById(str_id)!;
    const old_from_element = get_lowest_target(course_id, from_element);
    if (old_from_element) {
        do_untrack(old_from_element.id);
    }
    Array.from((prereq ? reverse_prereqs : reverse_coreqs).get(course_id) || [])
        .flatMap(find_id => get_all_targets(find_id) as HTMLElement[]).forEach(to_element =>
            update_drawn_map(str_id, to_element.id, draw(from_element, to_element, prereq))
        );
}

export function graph_track(year: number, quarter: number, idx: number, c: FullCourseJSON) {
    const json = { year, quarter, idx };
    if (c.prerequisites) {
        requisite_parser(c.prerequisites)
            .forEach(req => connect_forwards(c.subject_id, json, req, true));
    }
    if (c.corequisites) {
        requisite_parser(c.corequisites)
            .forEach(req => connect_forwards(c.subject_id, json, req, false));
    }
    connect_backwards(c.subject_id, json, true);
    connect_backwards(c.subject_id, json, false);
}

export function graph_untrack(year: number, quarter: number, idx: number) {
    const id = JSON.stringify({ year, quarter, idx });
    do_untrack(id);
}

function do_untrack(id: string) {
    const map = drawn_lines.get(id);
    if (map) {
        map.forEach((path, other_id) => {
            queue_mod();
            remove_queue.add(path);
            drawn_lines.get(other_id)!.delete(id);
        });
        drawn_lines.delete(id);
    }
}
