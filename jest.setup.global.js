/**
 * Minimal Web API polyfills for Jest + Next.js
 * Pure JavaScript, no TypeScript syntax
 */

// Headers polyfill
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          for (const [key, value] of init._headers) {
            this._headers.set(key.toLowerCase(), value);
          }
        } else if (typeof init === 'object') {
          for (const key in init) {
            if (Object.prototype.hasOwnProperty.call(init, key)) {
              this.append(key, init[key]);
            }
          }
        }
      }
    }
    append(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    delete(name) {
      this._headers.delete(name.toLowerCase());
    }
    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    forEach(callback, thisArg) {
      for (const [key, value] of this._headers) {
        callback.call(thisArg, value, key, this);
      }
    }
    get length() {
      return this._headers.size;
    }
    [Symbol.iterator]() {
      return this._headers.entries();
    }
  };
}

// Request polyfill
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      if (typeof input === 'string') {
        this.url = input;
      } else if (input && typeof input === 'object') {
        this.url = input.url || input.href || '';
      } else {
        this.url = String(input);
      }
      this.method = (init.method || 'GET').toUpperCase();
      this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
      this.body = init.body;
    }
    async json() {
      if (typeof this.body === 'string') {
        try {
          return JSON.parse(this.body);
        } catch (e) {
          return {};
        }
      }
      return this.body || {};
    }
    async text() {
      return typeof this.body === 'string' ? this.body : '';
    }
  };
}

// Response polyfill
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.body = body;
      this.status = init.status !== undefined ? init.status : 200;
      this.statusText = init.statusText || 'OK';
      this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
      this.url = init.url || '';
      this.type = init.type || 'basic';
    }
    get ok() {
      return this.status >= 200 && this.status < 300;
    }
    async json() {
      if (typeof this._body === 'string') {
        try {
          return JSON.parse(this._body);
        } catch (e) {
          return {};
        }
      }
      return this._body || {};
    }
    async text() {
      return typeof this._body === 'string' ? this._body : '';
    }
    clone() {
      return new Response(this._body, {
        status: this.status,
        headers: this.headers,
        url: this.url,
        type: this.type,
      });
    }
  };
}

// fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = async function () {
    return new global.Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

// AbortController polyfill (minimal)
if (typeof AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = new AbortSignal();
    }
    abort() {
      this.signal.aborted = true;
      if (typeof this.signal.onabort === 'function') {
        this.signal.onabort();
      }
    }
  };
  global.AbortSignal = class AbortSignal {
    constructor() {
      this.aborted = false;
      this.onabort = null;
    }
    addEventListener(type, listener) {
      if (type === 'abort' && this.aborted && listener) {
        listener();
      }
    }
    removeEventListener() {}
    dispatchEvent(event) {
      if (event.type === 'abort' && typeof this.onabort === 'function') {
        this.onabort();
      }
      return false;
    }
  };
}

// FormData polyfill (basic)
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor(form) {
      this.data = new Map();
      if (form) {
        // Basic support: try to iterate over elements
        if (form && typeof form.elements === 'object' && form.elements) {
          for (const el of form.elements) {
            if (el && el.name) {
              this.data.set(el.name, el.value);
            }
          }
        }
      }
    }
    append(name, value, filename) {
      this.data.set(name, value);
    }
    delete(name) {
      this.data.delete(name);
    }
    get(name) {
      return this.data.get(name) || null;
    }
    getAll(name) {
      const results = [];
      for (const [key, value] of this.data) {
        if (key === name) results.push(value);
      }
      return results;
    }
    has(name) {
      return this.data.has(name);
    }
    set(name, value, filename) {
      this.data.set(name, value);
    }
    forEach(callback, thisArg) {
      for (const [key, value] of this.data) {
        callback.call(thisArg, value, key, this);
      }
    }
    get length() {
      return this.data.size;
    }
    [Symbol.iterator]() {
      return this.data.entries();
    }
  };
}

// URLSearchParams polyfill (basic)
if (typeof URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = new Map();
      if (typeof init === 'string') {
        this.setFromString(init);
      } else if (init instanceof URLSearchParams) {
        for (const [key, value] of init) {
          this.params.set(key, value);
        }
      } else if (typeof init === 'object') {
        for (const key in init) {
          if (Object.prototype.hasOwnProperty.call(init, key)) {
            this.params.set(key, init[key]);
          }
        }
      }
    }
    setFromString(str) {
      if (!str) return;
      const pairs = str.split('&');
      for (const pair of pairs) {
        if (!pair) continue;
        const [rawKey, rawVal] = pair.split('=');
        const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
        const val = decodeURIComponent((rawVal || '').replace(/\+/g, ' '));
        this.params.set(key, val);
      }
    }
    append(key, value) {
      this.params.set(key, value);
    }
    delete(key) {
      this.params.delete(key);
    }
    get(key) {
      return this.params.get(key) || null;
    }
    getAll(key) {
      const values = [];
      for (const [k, v] of this.params) {
        if (k === key) values.push(v);
      }
      return values;
    }
    has(key) {
      return this.params.has(key);
    }
    set(key, value) {
      this.params.set(key, value);
    }
    toString() {
      const parts = [];
      for (const [key, value] of this.params) {
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }
      return parts.join('&');
    }
    forEach(callback, thisArg) {
      for (const [key, value] of this.params) {
        callback.call(thisArg, value, key, this);
      }
    }
    get length() {
      return this.params.size;
    }
    [Symbol.iterator]() {
      return this.params.entries();
    }
  };
}
