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

export function requisite_parser(requisites: string) {
    const building = [];
    const built: string[] = [];
    for (const char of requisites) {
        if (!punctuation.has(char)) {
            building.push(char);
        } else {
            const word = building.join("").trim();
            if (word && word !== "permission" && word !== "of" && word !== "instructor") {
                built.push(word);
            }
            building.length = 0;
        }
    }
    const w = building.join("").trim();
    if (w && w !== "permission" && w !== "of" && w !== "instructor") {
        built.push(w);
    }
    return built;
}

function is_gir(id: string) {
    return id.indexOf("GIR") !== -1;
}

export { is_gir, de_gir };
