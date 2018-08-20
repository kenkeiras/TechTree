const COMPLETED_STROKE_STYLE = '#548A00';
const UNDEPENDED = 'UNDEPENDED';

class DependencyGraph {
    constructor(div) {
        this.div = div;
        this.canvas = undefined;
    }

    render(data) {
        const columns = sort_by_dependency_columns(data.steps);
        
        this.canvas = document.createElement("canvas");
        this.div.appendChild(this.canvas);

        const prepared_draw = prepare_draw_columns_in_canvas(columns, this.canvas);
        this.canvas.width = prepared_draw.width;
        this.canvas.height = prepared_draw.height;
        this.canvas.style.width = prepared_draw.width + 'px';
        this.canvas.style.height = prepared_draw.height + 'px';

        prepared_draw.draw();
    }
}

class RowAllocationSlots {

    constructor() {
        this.positions = [];
    }

    get_position_for_element(vanilla_element) {
        // Prepare a copy of the element to insert
        const element = {
            id: vanilla_element.id,
            depended_by: Array.from(vanilla_element.depended_by)
        };

        // Remove element from depended_by
        const depending_on_this = [];
        for (let i = 0; i < this.positions.length; i++) {
            const slot = this.positions[i];

            if ((slot === undefined) || (slot.depended_by === undefined)) {
                continue;
            }

            if (slot.depended_by.indexOf(element.id) !== -1) {
                depending_on_this.push(i);

                // Rebuild the array to undefined's in between
                slot.depended_by = slot.depended_by.filter((v, _i, _a) => {
                    const keep = v !== element.id;
                    return keep;
                });
            }
        }

        // Remove elements which was undepended the step before
        for (const i of depending_on_this) {
            const slot = this.positions[i];
            if (slot.depended_by.length === 0) {
                this.positions[i] = UNDEPENDED;
            }
        }

        // Get any element which only remaining dependence was this
        for (const i of depending_on_this) {
            const slot = this.positions[i];

            if ((slot === UNDEPENDED) || (slot.depended_by.length === 0)) {
                this.positions[i] = element;
                return i;
            }
        }

        // Get any available position
        for (let i = 0; i < this.positions.length; i++) {
            console.log(i, this.positions[i]);
            if (this.positions[i] === undefined) { // Empty position
                this.positions[i] = element;
                return i;
            }
        }

        // Return the last position
        const position = this.positions.length;
        this.positions.push(element);
        return position;
    }

    finish_column() {
        for(let i=0; i < this.positions.length; i++) {
            if (this.positions[i] === UNDEPENDED) {
                this.positions[i] = undefined;
            }
        }
    }
}

function prepare_draw_columns_in_canvas(columns, canvas) {
    const ctx = canvas.getContext("2d");

    const left_margin = 10; // px
    const top_margin = 10; // px
    const inter_column_separation = 20; // px
    let draw_actions = [];
    const slots = new RowAllocationSlots();
    const nodes_map = {};

    let x_off = left_margin;
    let y_off = top_margin;
    let height = 0;
    let column_num = 0;

    for (const column of columns) {

        column_num++;

        const result = draw_column_from(x_off, y_off, column, ctx, slots, nodes_map, column_num);
        draw_actions = draw_actions.concat(result.draw_actions);
        slots.finish_column();

        if (result.height > height) {
            height = result.height;
        }
        x_off += result.width + inter_column_separation;
    }

    return { 
        width: x_off,
         height: height + y_off, 
         draw: () => {
            for (const action of draw_actions) {
                action();
            }
        }
    };
}

function draw_column_from(base_x_off, base_y_off, column, ctx, slots, nodes_map, column_num){
    const box_padding = 3; // px
    const inter_row_separation = 5; // px
    const draw_actions = [];
    const base_end_runway = 5; // px

    let height = 0;
    let width = 0;

    // TODO: do this calculation in a more reliable way
    const measure_height = ctx.measureText('M').width;
    const per_row_height = measure_height + box_padding * 2;
    const dependency_line_padding = 1; // px
    const dependency_line_size = 1; // px

    const dependency_positions = {};
    let dependency_count = 0;
    let line_count = 0;

    for (const element of column) {
        for (const dependency of element.dependencies) {
            if (dependency_positions[dependency] === undefined) {
                dependency_positions[dependency] = dependency_count++;
            }

            line_count++;
        }
    }

    const dependency_line_offset = (line_count * ((dependency_line_padding * 2)
                                                  + dependency_line_size));

    const left_padding = dependency_line_offset;
    const x_off = base_x_off + left_padding;
    const y_off = base_y_off;

    for (const element of column) {
        const measure = ctx.measureText(element.title);

        const row_num = slots.get_position_for_element(element);
        const per_row_width = measure.width + box_padding * 2;
        const row_height = (y_off 
                            + row_num * per_row_height 
                            + (row_num - 1) * inter_row_separation);

        nodes_map[element.id] = {
            right_middle: {
                left: x_off + per_row_width,
                top: row_height + per_row_height / 2
            },
            left_middle: {
                left: x_off,
                top: row_height + per_row_height / 2
            },
            bottom_middle: {
                left: x_off + per_row_width / 2,
                top: row_height + per_row_height
            },
            top_middle: {
                left: x_off + per_row_width / 2,
                top: row_height
            },
            column_num: column_num,

            _debug: element
        };

        for (const dependency of element.dependencies) {
            // Connect two points

            const dependency_index = dependency_positions[dependency];
            const end_runway = base_end_runway + dependency_line_offset
                                               - (dependency_index * ((dependency_line_padding * 2)
                                                                      + 1)); // px

            draw_actions.push(() => {

                const init_column = nodes_map[dependency].column_num;
                const end_column = nodes_map[element.id].column_num;


                if (init_column !== end_column) {
                    const init = nodes_map[dependency].right_middle;
                    const end = nodes_map[element.id].left_middle;

                    ctx.beginPath();
                    ctx.moveTo(init.left, init.top);
                    ctx.lineTo(end.left - end_runway, init.top);
                    ctx.lineTo(end.left - end_runway, end.top);
                    ctx.lineTo(end.left, end.top);
                    ctx.stroke();
                }
                else {
                    const init = nodes_map[dependency].bottom_middle;
                    const end = nodes_map[element.id].top_middle;

                    ctx.beginPath();
                    ctx.moveTo(init.left, init.top);
                    ctx.lineTo(end.left, end.top);
                    ctx.stroke();
                }
            });
        }

        draw_actions.push(() => {
            ctx.beginPath();
            const prev_style = ctx.strokeStyle;
            ctx.rect(x_off, row_height, per_row_width, per_row_height);
            if (element.completed) {
                ctx.strokeStyle = COMPLETED_STROKE_STYLE;
            }
            
            ctx.fillText(element.title,
                         x_off + box_padding,
                         row_height + box_padding + measure_height);

            ctx.stroke();
            ctx.strokeStyle = prev_style;
        });

        if (per_row_width > width) {
            width = per_row_width;
        }
        if (row_height > height) {
            height = row_height;
        }
    }

    return { 
        width: width + left_padding,
        height: height + per_row_height,
        draw_actions: draw_actions
    };
}

function loops_back(graph, element_id, first_step, selector) {
    const seen = {};
    let to_check = [first_step];

    while (to_check.length != 0) {
        const step_id = to_check.shift();

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

function sort_by_dependency_columns(steps) {
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
            depended[dependency].depended_by.push(step.id);
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
            depended_by_last = depended_by_last.concat(depended[element].dependencies);
        }

        if (depended_by_last.length == 0) {
            break;
        }
        rows.push(depended_by_last);
    }

    // Then try to show items as soon as possible by prunning them
    const found = {};
    rows = rows.reverse();
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

    return resolve(rows, steps, depended);
}

function resolve(rows, steps, depended) {
    const steps_by_id = {};
    for(const step of steps) {
        steps_by_id[step.id] = step;
        steps_by_id[step.id].depended_by = depended[step.id].depended_by;
    }

    const resolved = [];
    for(const row_num of rows) {
        const resolved_row = [];
        for (const step_id of row_num) {
            if (step_id !== undefined){
                resolved_row.push(steps_by_id[step_id]);
            }
        }

        resolved.push(resolved_row);
    }

    return resolved;
}

function get_project_graph(project_id, cb) {
    const xhr = new XMLHttpRequest(),
          method = "GET",
          url = "/api/projects/" + project_id + "/dependencies";

    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
        if(xhr.readyState === 4 && xhr.status === 200) {
            cb(JSON.parse(xhr.responseText));
        }
        else if (xhr.readyState === 4) {
            console.error("Request returned code", xhr.status, "text", xhr.responseText);
        }        
    };
    xhr.send();
}

var Graph = undefined;

var DependencyGraphRenderer = { 
    run: function() {
        Graph = new DependencyGraph(document.getElementById("dependency_graph"));

        const project_id = document.location.pathname.split("/")[2];

        get_project_graph(project_id, data => {
            Graph.render(data);
        });
    }
};

module.exports = {
    DependencyGraph,
    DependencyGraphRenderer,
    sort_by_dependency_columns,
};
