import { RequirementTitles, ProgressJSON, server_requirements, Trie } from '@/fireroad';
import { Module } from 'vuex';
import { RoadJSON } from '../fireroad/requirements';

export class Requirements {

    public loading = false;

    public constructor(public reqs: RequirementTitles) { }
}

const requirementState = {
    manifest: new Map<string, Requirements>(),
    title_search_trie: new Trie<Set<Requirements>>(),
    manifest_tracker: 0
};

const ignore_set = new Set(["by", "of", "in", "as", "the", "and"]);

export const requirements: Module<typeof requirementState, any> = {
    state: requirementState,
    getters: {
        autocomplete({ title_search_trie }) {
            return (word: string) => title_search_trie.autocomplete(word);
        }
    },
    mutations: {
        _set_titles(state, titles: RequirementTitles[]) {
            const reqs = titles.map(t => new Requirements(t));
            state.manifest_tracker = 1;
            reqs.forEach(r => state.manifest.set(r.reqs.list_id, r));
            for (const req of reqs) {
                for (const word of req.reqs.title.replace(/\(|\)|,/g, "")
                    .toLowerCase().split(" ").filter(s => !ignore_set.has(s))) {
                    state.title_search_trie.get_or_set(word, new Set<Requirements>()).add(req);
                }
                state.title_search_trie.get_or_set(req.reqs.short_title.toLowerCase(),
                    new Set<Requirements>()).add(req);
            }
        },
        _update(state, progresses: ProgressJSON[]) {
            for (const progress of progresses) {
                const req = state.manifest.get(progress.list_id)!;
                req.reqs = progress;
                req.loading = false;
            }
            state.manifest_tracker++;
        },
        _load({ manifest }, id: string) {
            manifest.get(id)!.loading = true;
        }
    },
    actions: {
        async init({ commit }) {
            const titles = await server_requirements.all_titles();
            (window as any).titles = titles;
            commit("_set_titles", titles);
        },
        async progress({ commit, dispatch }, { reqs, courses }: { reqs: string[], courses: RoadJSON }) {
            // commit("_load", reqs);
            const progress = Promise.all(reqs.map((req) => server_requirements.progress(req, courses)
                .then((p) => {
                    p.list_id = req;
                    return p;
                })));
            dispatch("_delay_progress_input", await progress);
        },
        async _delay_progress_input({ state, commit, dispatch }, progresses: ProgressJSON[]) {
            if (state.manifest_tracker) {
                commit("_update", progresses);
            } else {
                dispatch("_delay_progress_input", progresses);
            }
        }
    },
    namespaced: true
};
