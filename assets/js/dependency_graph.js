const COMPLETED_STROKE_STYLE = '#548A00';
const UNDEPENDED = 'UNDEPENDED';
const SvgNS = "http://www.w3.org/2000/svg";

class DependencyGraph {
    constructor(div) {
        this.div = div;
        this.canvas = undefined;
    }

    render(data) {
        const columns = sort_by_dependency_columns(data.steps);
        
        this.canvas = document.createElementNS(SvgNS, "svg");
        this.canvas.setAttribute("id", "techtree-graph");
        
        this.div.appendChild(this.canvas);

        const prepared_draw = prepare_draw_columns_in_canvas(columns, this.canvas, to_graph(data.steps));
        this.canvas.style.width = prepared_draw.width + 'px';
        this.canvas.style.height = prepared_draw.height + 'px';
        this.div.style.width = prepared_draw.width + 'px';
        this.div.style.height = prepared_draw.height + 'px';

        const center_canvas = () => {
            this.canvas.style.left = Math.max(
                0,
                (window.outerWidth - prepared_draw.width) / 2) + 'px';
        }

        window.on_resize = center_canvas();
        center_canvas();


        prepared_draw.draw();
    }
}

function to_graph(base) {
    const result = {};
    for (const step of base) {
        result[step.id] = step;
    }

    return result;
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

function prepare_draw_columns_in_canvas(columns, canvas, graph) {
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

        const result = draw_column_from(x_off, y_off, column, canvas, slots, nodes_map, column_num, graph);
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

let textCorrection = undefined;

function add_node(canvas, element, left, top, graph) {
    const x_padding = 2; // px
    const y_padding = 2; // px

    let strike_color = 'black';
    if (element.completed) {
        strike_color = COMPLETED_STROKE_STYLE;
    }

    const node = document.createElementNS(SvgNS, 'a');
    const rect = document.createElementNS(SvgNS, 'rect');
    const textBox = document.createElementNS(SvgNS, 'text');

    // node.setAttributeNS(null, 'href', element.location);

    canvas.appendChild(node);

    node.appendChild(rect);

    node.appendChild(textBox);

    textBox.setAttribute('class', 'actionable');
    textBox.setAttributeNS(null,'stroke',"none");
    textBox.textContent = element.title;
    textBox.setAttributeNS(null,'textlength', '100%');
    textBox.style.fontWeight = "bold";
    textBox.setAttributeNS(null, 'fill', 'black');

    // First time we draw this we have to calculate the correction
    // to apply over the text position. This translates from whatever
    // the text element considers as .X/.Y properties to the coordinates
    // of it's left-top corner relative to the SVG element.
    // Looks like text .X/.Y positions the baseline?

    if (textCorrection === undefined) {
        textBox.setAttributeNS(null,'x', 0);
        textBox.setAttributeNS(null,'y', 0);

        textCorrection = { 
            X: -(textBox.getClientRects()[0].left - canvas.getClientRects()[0].left),
            Y: -(textBox.getClientRects()[0].top - canvas.getClientRects()[0].top)
        }
    }

    textBox.setAttributeNS(null,'x', x_padding + left + textCorrection.X);
    textBox.setAttributeNS(null,'y', y_padding + top + textCorrection.Y);

    rect.setAttributeNS(null,'x', left);
    rect.setAttributeNS(null,'y', top);
    rect.setAttributeNS(null,'stroke-width','1');
    rect.setAttributeNS(null,'width', textBox.getClientRects()[0].width + x_padding * 2);
    rect.setAttributeNS(null,'height', textBox.getClientRects()[0].height + y_padding * 2);

    const onHover = () => {
        textBox.setAttributeNS(null, 'fill', 'white');
        rect.setAttributeNS(null, 'fill', strike_color);
    };

    const onRestore = () => {
        rect.setAttributeNS(null,'stroke',strike_color);
        rect.setAttributeNS(null, 'fill', 'none');
        textBox.setAttributeNS(null, 'fill', strike_color);
    };

    onRestore();

    node.onmouseenter = onHover;
    node.onmouseleave = onRestore;
    node.onclick = () => {
        popup_element(element, graph);
    };

    return {
        width: rect.getClientRects()[0].width,
        height: rect.getClientRects()[0].height,
        node_list: [node]
    }
}

function build_fast_element_form(element, base, graph) {
    const titleBar = document.createElement('h1');
    const title = document.createElement('span');
    title.innerText = element.title;

    const backButton = document.createElement('a');
    backButton.innerText = '←';
    backButton.onclick = () => {
        base.close();
    };

    titleBar.appendChild(backButton);
    titleBar.appendChild(title);

    base.appendChild(titleBar);

    const body = document.createElement('div');
    body.setAttribute('class', 'body');
    base.appendChild(body);

    if (element.description !== null) {
        const description = document.createElement('span');
        description.setAttribute('class', 'description')
        description.innerText = element.description;
        body.appendChild(description);
    }
    else {
        const addDescriptionButton = document.createElement('span');
        addDescriptionButton.setAttribute('class', 'description actionable-suggestion');
        addDescriptionButton.innerText = 'Add a description...';
        body.appendChild(addDescriptionButton);
    }

    const completedRow = document.createElement('div');
    const completedLabel = document.createElement('label');
    const state = document.createElement('span');
    const toggleButton = document.createElement('button');

    completedLabel.innerText = 'State:';
    completedRow.appendChild(completedLabel);
    completedRow.appendChild(state);
    completedRow.appendChild(toggleButton);

    body.appendChild(completedRow);

    state.setAttribute('class', 'value');
    toggleButton.setAttribute('class', 'action-button');

    let completedClass = '';

    if (element.completed) {
        state.innerText = 'COMPLETE';
        completedClass = 'completed';
        toggleButton.innerText = 'Mark To-Do';
    }
    else {
        state.innerHTML = 'TO-DO';
        toggleButton.innerText = 'Mark Completed';
    }

    completedRow.setAttribute('class', 'completion ' + completedClass);

    if (element.dependencies.length > 0) {
        const dependenciesSection = document.createElement('div');
        const dependenciesLabel = document.createElement('h2');
        dependenciesLabel.innerText = 'Dependencies';
        dependenciesSection.appendChild(dependenciesLabel);

        const dependencies = document.createElement('ul');
        for(const dep of element.dependencies) {
            const dependency = document.createElement('li');
            dependency.innerText = graph[dep].title;

            dependencies.appendChild(dependency);
        }

        dependenciesSection.appendChild(dependencies);
        body.appendChild(dependenciesSection);
    }

    const addDependencyButton = document.createElement('button');
    addDependencyButton.setAttribute('class', 'action-button');
    addDependencyButton.innerText = 'Add dependency';
    body.appendChild(addDependencyButton);

    const removeStepButton = document.createElement('button');
    removeStepButton.setAttribute('class', 'action-button dangerous');
    removeStepButton.innerText = 'Remove step';
    body.appendChild(removeStepButton);
}

function build_popup(element, graph){ 
    const overlay = document.createElement("div");
    overlay.setAttribute('class', 'overlay');    
    const popup = document.createElement("div");
    popup.setAttribute('class', 'popup');

    popup.close = () => {
        document.body.removeChild(overlay);
    }

    overlay.onclick = popup.close;
    popup.onclick = (ev) => {
        ev.stopPropagation();
    }

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    overlay.style.height = document.body.offsetHeight + 'px';
    overlay.style.width = document.body.offsetWidth + 'px';

    build_fast_element_form(element, popup, graph);

    return popup;
}

function popup_element(element, graph) {
    const popup = build_popup(element, graph);

    window.scrollTo({
        top: popup.top,
        left: popup.left,
        behavior: "smooth"
    });
}

function calculate_per_row_height(svg) {
    if (svg.per_row_height === undefined) {
        const test = add_node(svg, {title: "test", completed: false}, 0, 0, {});
        for (const node of test.node_list){
            svg.removeChild(node);
        }
    
        svg.per_row_height = test.height;
    }

    return svg.per_row_height;
}

function draw_column_from(base_x_off, base_y_off,
                          column, svg,
                          slots, nodes_map,
                          column_num, graph){
    const box_padding = 3; // px
    const inter_row_separation = 5; // px
    const draw_actions = [];
    const base_end_runway = 5; // px

    let height = 0;
    let width = 0;

    const per_row_height = calculate_per_row_height(svg);
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
        const row_num = slots.get_position_for_element(element);

        const row_height = (y_off 
                            + row_num * per_row_height
                            + (row_num - 1) * inter_row_separation);

        const measure = add_node(svg, element, x_off, row_height, graph);

        const per_row_width = measure.width;

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

            const init_column = nodes_map[dependency].column_num;
            const end_column = nodes_map[element.id].column_num;

            draw_actions.push(() => {
                const path_element = document.createElementNS(SvgNS, 'path');
                let curve;

                if (init_column !== end_column) {
                    const init = nodes_map[dependency].right_middle;
                    const end = nodes_map[element.id].left_middle;


                    curve = [
                        "M", init.left, ",", init.top,
                        " C", end.left - end_runway, ",", init.top,
                        " ", end.left - end_runway, ",", end.top,
                        " ", end.left, ",", end.top
                    ].join("");

                }
                else {
                    const init = nodes_map[dependency].bottom_middle;
                    const end = nodes_map[element.id].top_middle;

                    curve = [
                        "M", init.left, ",", init.top,
                        " C", end.left, ",", end.top
                    ].join("");
                }

                path_element.setAttributeNS(null, "d", curve);
                path_element.setAttributeNS(null, 'fill', 'none');
                path_element.setAttributeNS(null, 'stroke', 'black');
                path_element.setAttributeNS(null, 'stroke-width', '1');
                svg.appendChild(path_element);
            });
        }

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
    function process(project_id, stepsResult) {
        for (const step of stepsResult.steps){
            step.location = "/projects/" + project_id + "/steps/" + step.id;
        }
    }
    
    const xhr = new XMLHttpRequest(),
          method = "GET",
          url = "/api/projects/" + project_id + "/dependencies";

    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
        if(xhr.readyState === 4 && xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            process(project_id, result);
            cb(result);
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
