export interface Contributor {
    email: string;
    id: number;
}

export function clone_contributor(contributor: Contributor): Contributor {
    return {
        email: contributor.email,
        id: contributor.id
    };
}
