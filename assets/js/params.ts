type dictionary = {[key: string]: string};

export function search_to_dict(search: string): dictionary {
    if (search == undefined) {
        return {};
    }

    if (search.startsWith('?')) {
        search = search.substring(1);
    }

    const chunks = search.split('&');
    const dict = {};
    for(const chunk of chunks) {
        const parts = chunk.split('=');
        const key = parts.shift();
        const value = parts.join('=');

        if (key.length > 0) {
            dict[key] = value;
        }
    }

    return dict;
}

export function dict_to_search(dict: dictionary): string {
    return '?' + Object.keys(dict).map((k) => {
        return k + '=' + dict[k];
    }).join('&');
}

export function set_param(search: string, key: string, value: string): string {
    const search_dict = search_to_dict(search);
    search_dict[key] = value;

    return dict_to_search(search_dict);
}