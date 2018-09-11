import { GraphNode } from './graph_node';

type Set = {[key: string]: true};

type id = string | number;
export type Layout = LayoutRow[];
export type LayoutRow = LayoutEntry[];
export interface LayoutEntry {
    row_index: number,
    element: GraphNode,
};


type StepTree = StepTreeEntry[];

interface StepTreeEntry {
    step_id: id,
    dependencies: StepTree,
}

export function layout_steps(steps): Layout {
    // Check which steps are being depended by which
    let depended = {};

    for (const step of steps){
        depended[step.id] = { 
            id: step.id,
            dependencies: step.dependencies,
            depended_by: [],
        };
    }

        
    for (const step of steps){
        for (const dependency of step.dependencies) {
            if (depended[dependency] !== undefined) {
                depended[dependency].depended_by.push(step.id);
            }
        }
    }

    depended = clear_loops(depended);

    const undepended = [];
    for (const depId of Object.keys(depended)) {
        const dep = depended[depId];

        if (dep.depended_by.length == 0) {
            undepended.push(dep.id);
        }
    }

    let rows = [undepended];

    // Start building by the undepended, and backtrack until
    // there are no more dependencies
    while (true) {
        const last_row = rows[rows.length - 1];
        let depended_by_last = [];
        for(const element of last_row) {
            if (depended[element] === undefined) {
                continue;
            }

            depended[element].row = rows.length;
            depended_by_last = depended_by_last.concat(depended[element].dependencies);
        }

        if (depended_by_last.length == 0) {
            break;
        }
        rows.push(depended_by_last);
    }

    // Then try to show items as soon as possible by prunning them
    rows = rows.reverse();
    const found = {};
    for (const row_num of rows) {
        for (let i = 0; i < row_num.length; i++) {
            let step_id = row_num[i];
            if (found[step_id] !== true) {
                found[step_id] = true;
            }
            else {
                delete row_num[i];
            }
        }
    }

    const trees = arrange_in_trees(rows, steps, depended);
    const grid = arrange_trees_in_grid(trees);

    return resolve(grid.dump_inverted_transposed(), steps, depended);
}

function arrange_trees_in_grid(trees: StepTree): GridController {
    const grid = new GridController();
    for(const tree of trees) {
        grid.add_tree(tree);
    }

    return grid;
}


class GridController {
    rows: id[][];
    width = 0;
    height = 0;

    constructor() {
        this.rows = [];
    }

    public dump_inverted_transposed(): id[][] {
        const result: id[][] = [];

        for (let i = 0; i < this.width; i++) {
            let x = this.width - (i + 1); // This does the x-inversion
            const row = [];

            for (let y = 0; y < this.height; y++) {
                const orig_row = this.rows[y];
                if (x < orig_row.length) {
                    row.push(orig_row[x]);
                }
                else {
                    row.push(undefined);
                }
            }

            result.push(row);
        }

        console.log(result);
        return result;
    }

    public add_tree(tree: StepTreeEntry) {
        const base_x_offset = 0;
        const base_y_offset = this.height;

        let subtree_x_offset = base_x_offset;
        let subtree_y_offset = base_y_offset;

        // Draw root node
        this.add_element(tree.step_id, subtree_x_offset, subtree_y_offset);
        for (const subtree of tree.dependencies) {
            subtree_y_offset = this.add_subtree(subtree, subtree_x_offset + 1, subtree_y_offset)
            subtree_y_offset += 1;
        }
        // We can ignore compensating for the first here as one space 
        // between top-level trees is nice
    }

    add_subtree(tree: StepTreeEntry, x_offset: number, y_offset: number): number {
        this.add_element(tree.step_id, x_offset, y_offset);
        for (const subtree of tree.dependencies) {
            y_offset = this.add_subtree(subtree, x_offset + 1, y_offset)
            y_offset += 1;
        }

        if (tree.dependencies.length !== 0) {
            y_offset -= 1; // Compensate for the first not really incrementing
        }

        return y_offset;
    }

    add_element(value: id, x: number, y: number) {
        while (y > (this.height - 1)) {
            this.add_row();
        }

        const row = this.rows[y];
        while (x > (row.length - 1)) {
            row.push(undefined);
        }

        // Update width if relevant
        if (row.length > this.width) {
            this.width = row.length;
        }

        if (row[x] !== undefined) {
            throw new Error("Value already present");
        }

        row[x] = value;
    }

    private add_row() {
        this.rows.push([]);
        this.height++;
    }
}


function arrange_in_trees(rows, steps, depended): StepTree{
    // Start from the last row and backtrack entries
    // found on several trees are just kept on the first one
    // @TODO Better manage entries found on several trees

    // Also keep in mind that with the current implementation
    // dependencies which are not present on the following
    // level won't be accounted for.
    // @TODO This should be corrected when we fix the previous todo.

    // First we'll just build the trees with duplicated entries
    // and later remove the unnecessary values.
    const top_level_trees: StepTree = [];
    const backwards: any[] = Array.from(rows).reverse();

    const top_row = backwards.shift();

    for (const element of top_row) {
        top_level_trees.push(build_tree(element, backwards, depended));
    }

    remove_duplicates_across_trees(top_level_trees);

    return top_level_trees;
}

function remove_duplicates_across_trees(trees: StepTree) {
    const found_nodes: Set = {};

    for (const tree of trees) {
        remove_duplicates_on_tree(tree, found_nodes);
    }
}

function remove_duplicates_on_tree(entry: StepTreeEntry, found_nodes: Set) {
    for (let i = 0; i < entry.dependencies.length; i++) {
        const dependency = entry.dependencies[i];

        if (found_nodes[dependency.step_id] !== undefined) {
            delete entry.dependencies[i];
        }
        else {
            found_nodes[dependency.step_id] = true;
            remove_duplicates_on_tree(dependency, found_nodes);
        }
    }

    entry.dependencies = entry.dependencies.filter((v) => v !== undefined);
}

function build_tree(element: id, next_rows, depended): StepTreeEntry {

    const dependencies = build_tree_dependencies(element, next_rows, depended);

    return {
        step_id: element,
        dependencies: dependencies,
    };
}

function build_tree_dependencies(element: id, next_rows, depended): StepTree {
    if (next_rows.length == 0) {
        return [];
    }

    const dependencies: number[] = depended[element].dependencies;
    const dependency_tree: StepTree = [];
    const next_row = next_rows[0];
    const following_rows = next_rows.slice(1);
    
    for (const next_row_element of next_row) {
        if (dependencies.indexOf(next_row_element) !== -1) {
            dependency_tree.push(build_tree(next_row_element, following_rows, depended));
        }
    }

    return dependency_tree;
}


function clear_loops(graph) {
    const cleaned_graph = {};

    for (const id of Object.keys(graph)) {
        const e = cleaned_graph[id] = {
            id: id,
            depended_by: [],
            dependencies: []
        };

        for (let i = 0; i < graph[id].dependencies.length; i++) {
            const dep = graph[id].dependencies[i];

            if (!loops_back(graph, id, dep, e => e.dependencies)) {
                e.dependencies.push(dep);
            }
        }

        for (let i = 0; i < graph[id].depended_by.length; i++) {
            const dep = graph[id].depended_by[i];

            if (!loops_back(graph, id, dep, e => e.depended_by)) {
                e.depended_by.push(dep);
            }
        }
    }

    return cleaned_graph;
}


function resolve(rows, steps, depended): Layout {
    const steps_by_id = {};
    for(const step of steps) {
        steps_by_id[step.id] = step;
        steps_by_id[step.id].depended_by = depended[step.id].depended_by;
    }

    const resolved: Layout = [];
    for(const row_num of rows) {
        const resolved_row: LayoutRow = [];

        let row_index = 0;
        for (const step_id of row_num) {
            if (step_id !== undefined){

                const item: LayoutEntry = {
                    element: steps_by_id[step_id],
                    row_index: row_index,
                };

                resolved_row.push(item);

            }
            row_index++;
        }

        resolved.push(resolved_row);
    }

    return resolved;
}



function loops_back(graph, element_id: id, first_step: id, selector: Function): boolean {
    const seen = {};
    let to_check = [first_step];

    while (to_check.length != 0) {
        const step_id = to_check.shift();
        if (graph[step_id] === undefined) {
            continue;
        }

        if (seen[step_id] === true) {
            continue;
        }
        else {
            seen[step_id] = true;
        }

        const next_step = selector(graph[step_id]);

        if (next_step.indexOf(+element_id) !== -1) {
            
            return true;
        }

        to_check = to_check.concat(next_step);
    }

    return false;
}
