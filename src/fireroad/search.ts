export class Trie<V> {
    public count: number = 0;
    public children: Map<string, Trie<V>> = new Map();
    public value?: V = undefined;

    public add(id: string, value: V) {
        if (id.length) {
            if (!this.children.has(id[0])) { this.children.set(id[0], new Trie()); }
            this.children.get(id[0])!.add(id.substring(1), value);
            this.count++;
        } else { this.value = value; }
    }

    public yield() {
        const out: V[] = [];
        this._yield(out);
        return out;
    }

    public autocomplete(id: string) {
        let idx = 0;
        let trie: Trie<V> | undefined = this;
        while (trie && idx < id.length) {
            trie = trie.children.get(id[idx++]);
        }
        return trie ? trie.yield() : [];
    }

    public get_or_set(id: string, val: V) {
        let idx = 0;
        let trie: Trie<V> = this;
        while (idx < id.length) {
            let trial = trie.children.get(id[idx]);
            if (trial === undefined) {
                trie.children.set(id[idx], trial = new Trie());
            }
            idx++;
            trie = trial;
        }
        if (trie.value === undefined) {
            trie.value = val;
            this.count++;
        } else {
            val = trie.value;
        }
        return val;
    }

    public get(id: string) {
        let idx = 0;
        let trie: Trie<V> | undefined = this;
        while (trie && idx < id.length) {
            trie = trie.children.get(id[idx++]);
        }
        return trie && trie.value;
    }

    private _yield(out: V[]) {
        if (this.value) { out.push(this.value); }
        this.children.forEach((t) => t._yield(out));
    }
}
