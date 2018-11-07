import { Contributor, clone_contributor } from "./contributor";

type store_link = (new_data: Contributor[]) => void;

export class ContributorStore {
    contributors: { [key: string]: Contributor };
    callbacks: store_link[];

    constructor(contributors: Contributor[]) {
        this.contributors = this.build_contributor_map(contributors);
        this.callbacks = [];
    }

    public link_set(link: store_link) {
        this.callbacks.push(link);
        link(this.list_contributors());
    }

    public add_contributor(contributor: Contributor) {
        this.contributors[contributor.id] = clone_contributor(contributor);
        this.trigger_change();
    }

    public remove_contributor(contributor: Contributor) {
        delete this.contributors[contributor.id];
        this.trigger_change();
    }

    public list_contributors(): Contributor[] {
        const result = [];
        for (const id of Object.keys(this.contributors)) {
            result.push(clone_contributor(this.contributors[id]));
        }

        return result;
    }

    private trigger_change() {
        for (const listener of this.callbacks) {
            listener(this.list_contributors());
        }
    }

    private build_contributor_map(
        contributors: Contributor[]
    ): { [key: string]: Contributor } {
        const map = {};
        for (const contributor of contributors) {
            map[contributor.id] = clone_contributor(contributor);
        }

        return map;
    }
}
