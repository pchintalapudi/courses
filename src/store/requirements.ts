import { RequirementTitles, server_requirements, Trie } from '@/fireroad';
import { Module } from 'vuex';

export class Requirements {

    public loading = false;

    public constructor(public reqs: RequirementTitles) { }
}

const requirementState = {
    manifest: new Map<string, Requirements>(),
    title_search_trie: new Trie<Set<Requirements>>()
};

const ignore_set = new Set(["by", "of", "in", "as", "the", "and"]);

export const requirements: Module<typeof requirementState, any> = {
    state: requirementState,
    mutations: {
        _set_titles(state, titles: RequirementTitles[]) {
            const reqs = titles.map(t => new Requirements(t));
            reqs.forEach(r => state.manifest.set(r.reqs.list_id, r));
            for (const req of reqs) {
                for (const word of req.reqs.title.replace(/\(|\)|,/g, "")
                    .toLowerCase().split(" ").filter(s => !ignore_set.has(s))) {
                    state.title_search_trie.get_or_set(word, new Set<Requirements>()).add(req);
                }
                state.title_search_trie.get_or_set(req.reqs.short_title,
                    new Set<Requirements>()).add(req);
            }
        }
    },
    actions: {
        async init({ commit }) {
            const titles = await server_requirements.all_titles();
            (window as any).titles = titles;
            commit("_set_titles", titles);
        }
    },
    namespaced: true
};
