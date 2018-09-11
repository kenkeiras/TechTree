import { GraphNode } from './graph_node';

type id = string | number;
export type Layout = LayoutRow[];
export type LayoutRow = LayoutEntry[];
export interface LayoutEntry {
    row_index: number,
    element: GraphNode,
};

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

    const dependend_by = JSON.parse(JSON.stringify(depended));
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

    // Reconsider last line, move it to the earlier possible line
    let moves = [];
    let index = 0;
    const last_row = rows[rows.length - 1];
    for (const step_id of last_row) {

        // Keep in mind that the rows are for the forwards
        // column ordering (now going backwards)
        let latestDepenedency = undefined;
        for (const dep_id of depended[step_id].dependencies){
            const row_pos = rows.length - depended[dep_id].row;
            if (latestDepenedency === undefined || latestDepenedency < row_pos) {
                latestDepenedency = row_pos;
            }
        }

        if ((latestDepenedency !== undefined)  
            && ((latestDepenedency + 1) < (rows.length - 1))){
            
            moves.push({from: index, to: latestDepenedency + 1});
        } 
        index++;
    }

    // Do the movements backwards not alter the to-be-moved parts
    moves = moves.reverse();
    for(const move of moves) {
        const element = last_row[move.from];
        delete last_row[move.from];
        rows[move.to].push(element);
    }

    // Remove deleted entries
    rows[rows.length - 1] = last_row.filter((v,i,a) => { return v !== undefined; });

    return resolve(rows, steps, depended);
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

                row_index++;
            }
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
