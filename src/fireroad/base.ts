// tslint:disable:variable-name
const BASE_DOMAIN = 'fireroad-dev.mit.edu';

// tslint:disable-next-line: class-name
class _URLBuilder {

    private _protocol: string = 'https';
    private _port: number = 443;
    private _path: string[] = [];
    private _query: Array<[string, string]> = [];
    private _fragment: string = '';

    constructor(private readonly _domain: string) { }

    public protocol(protocol: string) {
        this._protocol = protocol;
        return this;
    }

    public port(port: number) {
        this._port = port;
        return this;
    }

    public path(path: string) {
        this._path.push(path);
        return this;
    }

    public query(query: string, value: string = '') {
        this._query.push([query, value]);
        return this;
    }

    public anchor(fragment: string) {
        this._fragment = fragment;
        return this;
    }

    public build() {
        const final = [this._protocol, '://', this._domain, ':', this._port, '/', this._path.join('/'), '/'];
        if (this._query.length) {
            final.push('?', this._query.map((qv) => qv.join('=')).join('&'));
        }
        if (this._fragment) {
            final.push('#', this._fragment);
        }
        return final.join('');
    }
}

// tslint:disable-next-line: max-classes-per-file
export class URLBuilder {
    public static domain: string = BASE_DOMAIN;

    public static protocol(protocol: string) {
        return URLBuilder.init().protocol(protocol);
    }

    public static port(port: number) {
        return URLBuilder.init().port(port);
    }

    public static path(path: string) {
        return URLBuilder.init().path(path);
    }

    public static query(query: string, value: string = '') {
        return URLBuilder.init().query(query, value);
    }

    public static anchor(fragment: string) {
        return URLBuilder.init().anchor(fragment);
    }

    public static build() {
        return URLBuilder.init().build();
    }

    private static init() {
        return new _URLBuilder(URLBuilder.domain);
    }
}
