const OverridenKeys = ["Escape"];

function remove_at(arr: any[], index: number): any[] {
    const replica = Array.from(arr);

    // Cut the array at the index
    const separated = replica.splice(index);

    // Remove the element at the index
    separated.shift();

    return replica.concat(separated);
}

class HotkeyManager {
    table: {[key: string]: Function[]};

    constructor() {
        this.table = {}
    }

    public add_key(key: string, callback: Function) {
        if (this.table[key] === undefined) {
            this.table[key] = [];
        }
        this.table[key].push(callback);
    }

    public pop_key(key: string, callback_to_remove: Function): boolean {
        const funcs = this.table[key];
        if (funcs === undefined) {
            return false;
        }

        for (let i = funcs.length - 1; i >= 0; i--){
            const func = funcs[i];

            if (func === callback_to_remove) {
                this.table[key] = remove_at(funcs, i);
                return true;
            }
        }

        return false;
    }

    initialize() {
        window.onkeypress = this.capture.bind(this);
    }

    capture(ev: KeyboardEvent) {
        console.log(document.activeElement);
        if ((document.activeElement !== document.body) && (OverridenKeys.indexOf(ev.key) === -1)) {
            return;
        }

        const key = ev.key;
        const funcs = this.table[key]
        if ((funcs === undefined) || (funcs.length === 0)) {
            return;
        }

        ev.preventDefault();
        funcs[funcs.length - 1]();
    };
}

const key_manager = new HotkeyManager();
key_manager.initialize();

export function set_key(key: string, callback: Function) {
    key_manager.add_key(key, callback);
}

export function pop_key(key: string, callback_to_remove: Function): boolean {
    return key_manager.pop_key(key, callback_to_remove);
}