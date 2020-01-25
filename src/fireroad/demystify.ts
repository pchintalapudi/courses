function de_gir(id: string) {
    switch (id) {
        case "GIR:CAL2":
            return ["18.02", "18.022", "18.02A", "CC.1802", "ES.1802", "ES.182A"];
        case "GIR:CAL1":
            return ["18.01", "18.01A", "ES.1801", "ES.181A"];
        case "GIR:PHY1":
            return ["8.01", "8.011", "8.012", "8.01L", "CC.801", "CC.8012", "ES.801", "ES.8012"];
        case "GIR:PHY2":
            return ["8.02", "8.021", "8.022", "CC.802", "CC.8022", "ES.802", "ES.8022"];
        case "GIR:CHEM":
            return ["3.091", "5.111", "5.112", "CC.5111", "ES.5111", "ES.5112"];
        case "GIR:BIOL":
            return ["7.012", "7.013", "7.014", "7.015", "7.016", "ES.7012", "ES.7013"];
    }
    return [id];
}

const punctuation = new Set<string>(["(", ")", " ", ",", "/", "'", '"']);
const cache = new Map<string, string[]>();

export function requisite_parser(requisites: string) {
    if (cache.has(requisites)) {
        return cache.get(requisites)!;
    }
    const building = [];
    const built: string[] = [];
    for (const char of requisites) {
        if (!punctuation.has(char)) {
            building.push(char);
        } else {
            const word = building.join("").trim();
            if (word && word !== "permission" && word !== "of" && word !== "instructor" && word.toLowerCase() !== "coreq:") {
                built.push(word);
            }
            building.length = 0;
        }
    }
    const w = building.join("").trim();
    if (w && w !== "permission" && w !== "of" && w !== "instructor") {
        built.push(w);
    }
    const out = Array.from(new Set(built));
    cache.set(requisites, out);
    return out;
}

class ReqCombo {
    public constructor(public or: boolean, public reqs: Array<string | ReqCombo>) { }

    public unsatisfied(courses: Set<string>) {
        if (this.or) {
            const failed = [] as string[];
            for (const req of this.reqs) {
                if (typeof req === "string") {
                    const possible = de_gir(req);
                    for (const course of possible) {
                        if (courses.has(course)) {
                            return "";
                        }
                    }
                    failed.push(req);
                } else {
                    const end = req.unsatisfied(courses);
                    if (!end) {
                        return "";
                    } else {
                        failed.push(end);
                    }
                }
            }
            return failed.length === 1 ? failed[0] : `(${failed.join(" or ")})`;
        } else {
            const failed = [] as string[];
            for (const req of this.reqs) {
                if (typeof req === "string") {
                    const possible = de_gir(req);
                    let sat = false;
                    for (const course of possible) {
                        // tslint:disable-next-line: no-conditional-assignment
                        if (sat = courses.has(course)) {
                            break;
                        }
                    }
                    if (!sat) {
                        failed.push(req);
                    }
                } else {
                    const end = req.unsatisfied(courses);
                    if (end) {
                        failed.push(end);
                    }
                }
            }
            return failed.length ? failed.length === 1 ? failed[0] : `(${failed.join(" and ")})` : "";
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
class ReqHeader {
    public constructor(public req: string | ReqCombo) { }

    public unsatisfied(courses: Set<string>) {
        if (typeof this.req === "string") {
            const possible = de_gir(this.req);
            for (const course of possible) {
                if (courses.has(course)) {
                    return "";
                }
            }
            return this.req;
        } else {
            return this.req.unsatisfied(courses);
        }
    }
}

export function proper_requisite_parse(requisites: string): ReqHeader {
    return new ReqHeader(_proper_requisite_parse(requisites, 0)[0]);
}

function _proper_requisite_parse(requisites: string, idx: number): [string | ReqCombo, number] {
    const building = [] as string[];
    const built = [] as Array<string | ReqCombo>;
    let split = "";
    for (; idx < requisites.length; idx++) {
        const char = requisites[idx];
        if (char === ",") {
            built.push(building.join(""));
            building.length = 0;
            split = char;
            idx++;
        } else if (char === "/") {
            built.push(building.join(""));
            building.length = 0;
            split = char;
        } else if (char === "(") {
            const build = _proper_requisite_parse(requisites, idx + 1);
            idx = build[1];
            built.push(build[0]);
        } else if (char === ")") {
            break;
        } else {
            building.push(char);
        }
    }
    built.push(building.join(""));
    const final = built.filter(s => s);
    return [split ? new ReqCombo(split === "/", final) : final[0], idx];
}

(window as any).reqparse = proper_requisite_parse;

function is_gir(id: string) {
    return id.indexOf("GIR") !== -1;
}

export { is_gir, de_gir };
