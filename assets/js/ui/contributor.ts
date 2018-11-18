export interface Contributor {
    username: string;
    id: number;
}

export function clone_contributor(contributor: Contributor): Contributor {
    return {
        username: contributor.username,
        id: contributor.id
    };
}
