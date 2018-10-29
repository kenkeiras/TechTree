import * as Api from '../api';
import * as params from '../params';
import {ElementState} from './element';
import { layout_steps, Layout, LayoutRow, LayoutEntry } from './layout';

// Offset between the line following the user and the cursor
const PERSONAL_AREA_SPACE = 3;

const SvgNS = "http://www.w3.org/2000/svg";
const TECHTREE_CANVAS_ID = "techtree-graph";

export class DependencyGraph {
    div: HTMLDivElement;
    canvas: SVGElement;

    constructor(div) {
        this.div = div;
        this.canvas = undefined;
    }

    render(data) {
        const grid = layout_steps(data.steps);
        
        this.canvas = document.createElementNS(SvgNS, "svg");
        this.canvas.setAttribute("id", TECHTREE_CANVAS_ID);
        
        this.div.appendChild(this.canvas);

        const prepared_draw = prepare_draw_grid_in_canvas(grid, this.canvas, to_graph(data.steps));
        this.canvas.style.width = prepared_draw.width + 'px';
        this.canvas.style.height = prepared_draw.height + 'px';
        this.div.style.width = prepared_draw.width + 'px';
        this.div.style.height = prepared_draw.height + 'px';

        const center_canvas = () => {
            this.canvas.style.left = (Math.max(
                0,
                (window.innerWidth - prepared_draw.width) / 2)
            + 'px');
        }

        window.onresize = center_canvas;
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


function prepare_draw_grid_in_canvas(grid: Layout, canvas, graph) {
    const left_margin = 10; // px
    const top_margin = 10; // px
    const inter_column_separation = 20; // px
    let draw_actions = [];
    const nodes_map = {};

    let x_off = left_margin;
    let y_off = top_margin;
    let height = 0;
    let column_num = 0;

    for (const column of grid) {

        column_num++;

        const result = draw_column_from(x_off, y_off, column, canvas, nodes_map, column_num, graph);
        draw_actions = draw_actions.concat(result.draw_actions);

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

interface Point {
    x: number,
    y: number,
};

function draw_path(path: SVGPathElement, from: Point, to: Point, runway: number){
    const curve = [
        "M", from.x, ",", from.y,
        " C", from.x + runway, ",", from.y,
        " ", to.x - runway, ",", to.y,
        " ", to.x, ",", to.y,
    ].join("");

    path.setAttributeNS(null, "d", curve);
    path.setAttributeNS(null, 'fill', 'none');
    path.setAttributeNS(null, 'stroke', 'black');
    path.setAttributeNS(null, 'stroke-width', '1');
}

function logged(f: Function) {
    try {
        return f();
    }
    catch(e) {
        console.error(e);
    }
}

function on_user_clicks_dependency_node(
        origin: SVGCircleElement,
        canvas,
        cb: (element_id: number) => void,
        runway: number=0) {

    const origin_side = origin.getAttribute('connector_side');
    const origin_element_id = origin.getAttribute('element_id');

    let no_need_to_follow = false;

    // If previous follower exists
    const previous_follower = canvas.getElementById('user_follower_path');
    if (previous_follower !== null){
        // If the sides are different (so they can be connected)
        const previous_side = previous_follower.getAttribute('connector_side');
        const previous_element_id = previous_follower.getAttribute('element_id');
        if ((previous_side !== null) && (previous_side !== origin_side)) {

            // If the element id are not the same
            if ((previous_element_id !== null) && (previous_element_id !== origin_element_id)) {
                // Establish the connection
                no_need_to_follow = true;
                cb(previous_element_id);
            }
        }

        previous_follower.parentElement.removeChild(previous_follower);
    }

    if (no_need_to_follow) {
        return;
    }

    const from = {
        x: parseInt(origin.getAttributeNS(null, 'cx') + ""),
        y: parseInt(origin.getAttributeNS(null, 'cy') + ""),
    };

    const follower_path = document.createElementNS(SvgNS, 'path');
    follower_path.setAttribute('id', 'user_follower_path');
    follower_path.setAttribute('connector_side', origin_side);
    follower_path.setAttribute('element_id', origin_element_id);
    canvas.appendChild(follower_path);

    let personal_area_sign = 1;
    if (runway != 0){
        personal_area_sign = runway / Math.abs(runway);
    }

    const personal_area = PERSONAL_AREA_SPACE * personal_area_sign;

    window.onmousemove = (ev) => {
        draw_path(follower_path, from, 
            {x: ev.layerX - personal_area, y: ev.layerY}, runway)
    };
}

function add_node(canvas, element, left, top, graph) {
    const x_padding = 2; // px
    const y_padding = 2; // px

    let node_class = '';
    let state: ElementState = element.state;

    switch (state) {
        case 'to_do':
            node_class = 'state-to-do';
            break;
        case 'completed':
            node_class = 'state-completed';
            break;
        case 'work_in_progress':
            node_class = 'state-work-in-progress';
            break;
        case 'archived':
            node_class = 'state-archived';
            break;
    }

    const node = document.createElementNS(SvgNS, 'a');
    const rect = document.createElementNS(SvgNS, 'rect');
    const textBox = document.createElementNS(SvgNS, 'text');
    const use_as_dependency_node = document.createElementNS(SvgNS, 'circle');
    const add_dependency_node = document.createElementNS(SvgNS, 'circle');

    node.setAttribute('class', 'step-node ' + node_class);

    node.appendChild(rect);
    node.appendChild(textBox);

    // Use-as/add dependency nodes are outside the main node
    //  so as the callbacks don't interfere
    canvas.appendChild(use_as_dependency_node);
    canvas.appendChild(add_dependency_node);
    canvas.appendChild(node);

    textBox.setAttribute('class', 'actionable');
    textBox.textContent = element.title;
    textBox.setAttributeNS(null,'textlength', '100%');

    // First time we draw this we have to calculate the correction
    // to apply over the text position. This translates from whatever
    // the text element considers as .X/.Y properties to the coordinates
    // of it's left-top corner relative to the SVG element.
    // Looks like text .X/.Y positions the baseline?

    if (textCorrection === undefined) {
        textBox.setAttributeNS(null, 'x', "0");
        textBox.setAttributeNS(null, 'y', "0");

        textCorrection = { 
            X: -(textBox.getClientRects()[0].left - canvas.getClientRects()[0].left),
            Y: -(textBox.getClientRects()[0].top - canvas.getClientRects()[0].top)
        }
    }

    textBox.setAttributeNS(null,'x', x_padding + left + textCorrection.X);
    textBox.setAttributeNS(null,'y', y_padding + top + textCorrection.Y);

    const box_width = (textBox.getClientRects()[0].width + x_padding * 2);
    const box_height = (textBox.getClientRects()[0].height + y_padding * 2);

    rect.setAttributeNS(null,'x', left);
    rect.setAttributeNS(null,'y', top);
    rect.setAttributeNS(null,'stroke-width','1');
    rect.setAttributeNS(null,'width', box_width + "");
    rect.setAttributeNS(null,'height', box_height + "");

    use_as_dependency_node.setAttribute('connector_side', 'right');
    use_as_dependency_node.setAttribute('element_id', element.id);
    use_as_dependency_node.setAttributeNS(null, 'cx', left + box_width);
    use_as_dependency_node.setAttributeNS(null, 'cy', top + box_height / 2);
    use_as_dependency_node.setAttributeNS(null, 'r', box_height / 2.5 + "");
    use_as_dependency_node.setAttribute('class', 'use-as-dependency-node ' + node_class);

    add_dependency_node.setAttribute('connector_side', 'left');
    add_dependency_node.setAttribute('element_id', element.id);
    add_dependency_node.setAttributeNS(null, 'cx', left);
    add_dependency_node.setAttributeNS(null, 'cy', top + box_height / 2);
    add_dependency_node.setAttributeNS(null, 'r', box_height / 2.5 + "");
    add_dependency_node.setAttribute('class', 'add-dependency-node ' + node_class);


    node.onclick = () => {
        popup_element(element, graph);
    };

    const on_dependencies_updated = () => {
        // Refresh
        document.location = document.location;
    };

    (add_dependency_node as any).onclick = () => on_user_clicks_dependency_node(
        add_dependency_node, // from
        canvas,
        (previous_element_id) => {
            Api.add_dependency(
                element.project_id,
                element.id,
                previous_element_id,
                on_dependencies_updated);
        },
        -box_height, // runway
    );

    (use_as_dependency_node as any).onclick = () => on_user_clicks_dependency_node(
        use_as_dependency_node, // from
        canvas,
        (previous_element_id) => {
            Api.add_dependency(
                element.project_id,
                previous_element_id,
                element.id,
                on_dependencies_updated);
        },
        +box_height, // runway
    );

    return {
        width: rect.getClientRects()[0].width,
        height: rect.getClientRects()[0].height,
        node_list: [node, use_as_dependency_node, add_dependency_node]
    }
}

function sort_steps_by_name(steps) {
    steps.sort((a, b) => {
        const name_a = a.name.toUpperCase(); // ignore upper and lowercase
        const name_b = b.name.toUpperCase(); // ignore upper and lowercase

        if (name_a < name_b) {
          return -1;
        }

        if (name_a > name_b) {
          return 1;
        }

        // names must be equal
        return 0;
      }
    );
}

function createDependencyAdder(project_id, step_id, section, on_updated) {
    Api.get_available_dependencies_for_step(project_id, step_id, (success, result) => {
        const selector = document.createElement('select');

        sort_steps_by_name(result.steps);
        
        for(const step of result.steps) {
            const option = document.createElement('option');
            option.value = step.id;
            option.innerText = step.name;

            selector.appendChild(option);
        }

        section.appendChild(selector);

        const submitButton = document.createElement('button');
        submitButton.innerText = 'Add';
        submitButton.onclick = () => {
            Api.add_dependency(project_id, step_id, selector.value, () => {
                section.removeChild(selector);
                section.removeChild(submitButton);
                on_updated();
            });
        }

        section.appendChild(submitButton);
    });
}

function add_cross(element, size?) {
    if (size === undefined){
        size = 15;
    }
    const style = "stroke:rgb(255,255,255);stroke-width:2";

    const canvas = document.createElementNS(SvgNS, "svg");
    
    const leftTop = document.createElementNS(SvgNS, 'line');
    const leftBottom = document.createElementNS(SvgNS, 'line');

    leftTop.setAttributeNS(null, 'x1', '0');
    leftTop.setAttributeNS(null, 'y1', '0');
    leftTop.setAttributeNS(null, 'x2', size);
    leftTop.setAttributeNS(null, 'y2', size);
    leftTop.setAttributeNS(null, 'style', style);

    leftBottom.setAttributeNS(null, 'x1', '0');
    leftBottom.setAttributeNS(null, 'y1', size);
    leftBottom.setAttributeNS(null, 'x2', size);
    leftBottom.setAttributeNS(null, 'y2', '0');
    leftBottom.setAttributeNS(null, 'style', style);

    canvas.appendChild(leftTop);
    canvas.appendChild(leftBottom);

    element.appendChild(canvas);
}


function make_editable_title(title: HTMLElement, element, on_change: Function) {
    title.setAttribute('contentEditable', 'true');
    title.setAttribute('spellcheck', 'false');

    let real_value = title.innerText;
    title.setAttribute("class", "ready");

    // Block line jumps on project names
    title.onkeypress = (ev: KeyboardEvent) => {
        const key = ev.key;
        if (key == 'Enter') {
            ev.preventDefault();
            title.blur();
        }
    };

    title.onblur = (ev: FocusEvent) => {
        const new_value = title.innerText.trim();
        if (new_value === real_value) {
            return;
        }

        title.setAttribute("class", "loading");
        Api.set_element_name(element.project_id, element.id, new_value, (success) => {
            title.setAttribute("class", "ready");
            if (success) {
                real_value = new_value;
                on_change();
            }
            else {
                title.innerText = real_value;
            }
        });
    }
}


function make_editable_description(description: HTMLTextAreaElement, element, on_change: Function) {
    let real_value = description.value;
    description.classList.add("ready");

    const update_row_count = () => {
        let rows_num = description.value.split("\n").length;
        // We could avoid doing the comparation. It's just a feeling
        // that writing to the DOM if not needed is not good.
        if (rows_num != description.rows) {
            description.rows = rows_num;
        }
    };

    update_row_count();

    // Block line jumps on project names
    description.onkeypress = (ev: KeyboardEvent) => {
        const key = ev.key;
        if (key == 'Enter' && ev.altKey) {
            ev.preventDefault();
            description.blur();
        }
    };

    description.onchange = update_row_count;
    description.onkeyup = update_row_count;

    description.onblur = (ev: FocusEvent) => {
        const new_value = description.value.trim();
        if (new_value === real_value) {
            return;
        }

        description.value = new_value; // Set trimmed value
        update_row_count();

        description.classList.remove("ready");
        description.classList.add("loading");
        Api.set_element_description(element.project_id, element.id, new_value, (success) => {
            description.classList.remove("loading");
            description.classList.add("ready");

            if (success) {
                real_value = new_value;
                on_change();
            }
            else {
                description.value = real_value;
            }
        });
    }
}

function build_state_select(element) : HTMLSelectElement{
    let state: ElementState = element.state;

    const select = document.createElement('select');

    // Build the different options
    const todo_option = document.createElement('option');
    todo_option.innerText = 'To do';
    todo_option.value = 'to_do';

    const wip_option = document.createElement('option');
    wip_option.innerText = 'Work in progress';
    wip_option.value = 'work_in_progress';

    const completed_option = document.createElement('option');
    completed_option.innerText = 'Completed';
    completed_option.value = 'completed';

    const archived_option = document.createElement('option');
    archived_option.innerText = 'Archived';
    archived_option.value = 'archived';
    
    // Add them in the appropriate order
    select.appendChild(todo_option);
    select.appendChild(wip_option);
    select.appendChild(completed_option);
    select.appendChild(archived_option);

    // Set the current one
    const selected = {
        "to_do": todo_option,
        "work_in_progress": wip_option,
        "completed": completed_option,
        "archived": archived_option,
    }[state];

    selected.setAttribute('selected', 'selected');

    return select;
}


function build_fast_element_form(element, base, graph) {
    const titleBar = document.createElement('h1');
    const title = document.createElement('span');
    title.innerText = element.title;
    let has_changed = false;

    make_editable_title(title, element, () => { has_changed = true });

    const backButton = document.createElement('a');
    backButton.setAttribute('class', 'navigation');
    backButton.innerText = '←';
    backButton.onclick = () => {
        base.close();
    };

    const focusButton = document.createElement('a');
    focusButton.setAttribute('class', 'navigation secondary');
    focusButton.innerText = '[focus]';

    const new_search = params.set_param(document.location.search, 'from', element.id);
    const focus_location = document.location.origin + document.location.pathname + new_search;
    focusButton.href = focus_location;

    titleBar.appendChild(backButton);
    titleBar.appendChild(title);
    titleBar.appendChild(focusButton);

    base.appendChild(titleBar);

    const body = document.createElement('div');
    body.setAttribute('class', 'body');
    base.appendChild(body);

    const description = document.createElement('textarea');
    description.setAttribute('class', 'description actionable');
    description.placeholder = 'Add a description...';

    if (element.description !== null) {
        description.value = element.description;
    }

    make_editable_description(description, element, () => { has_changed = true });
    body.appendChild(description);

    const stateRow = document.createElement('div');
    const stateLabel = document.createElement('label');
    const stateSelect = build_state_select(element);

    stateLabel.innerText = 'State:';
    stateRow.appendChild(stateLabel);
    stateRow.appendChild(stateSelect);

    body.appendChild(stateRow);

    let completedClass = '';

    stateSelect.onchange = () => {
        stateSelect.classList.remove('loaded');
        stateSelect.classList.remove('failed');
        stateSelect.classList.add('loading');
        has_changed = true;
        Api.set_step_state(element.project_id,
                           element.id,
                           stateSelect.value,
                           (success) => {
                               if (success) {
                                   stateSelect.classList.remove('loading');
                                   stateSelect.classList.add('loaded');
                               }
                               else {
                                   /// @TODO: Reset the original value
                                   stateSelect.classList.remove('loading');
                                   stateSelect.classList.add('failed');
                                }
                            });
    }

    if (element.dependencies.length > 0) {
        const dependenciesSection = document.createElement('div');
        const dependenciesLabel = document.createElement('h2');
        dependenciesLabel.innerText = 'Dependencies';
        dependenciesSection.appendChild(dependenciesLabel);

        const dependencies = document.createElement('ul');
        for(const dep of element.dependencies) {
            const dependency = document.createElement('li');
            dependencies.appendChild(dependency);

            const removeDependencyButton = document.createElement('button');
            removeDependencyButton.setAttribute('class', 'list-index dangerous');
            add_cross(removeDependencyButton);
            dependency.appendChild(removeDependencyButton);
            removeDependencyButton.onclick = () => {
                Api.remove_dependency(element.project_id, element.id, dep, () => {
                    dependencies.removeChild(dependency);
                    has_changed = true;
                });
            };

            const dependencyName = document.createElement('span');
            dependencyName.innerText = graph[dep].title;
            dependency.appendChild(dependencyName);

        }

        dependenciesSection.appendChild(dependencies);
        body.appendChild(dependenciesSection);
    }

    const addDependencySection = document.createElement('div');
    addDependencySection.setAttribute('class', 'adder-section');

    body.appendChild(addDependencySection);

    const addDependencyButton = document.createElement('button');
    addDependencyButton.setAttribute('class', 'action-button');
    addDependencyButton.innerText = 'Add dependency';
    addDependencyButton.onclick = () => {
        addDependencyButton.disabled = true;
        createDependencyAdder(element.project_id, 
                              element.id,
                              addDependencySection,
                              () => {
                                  addDependencyButton.disabled = false;
                                  has_changed = true;
                              });
    };
    body.appendChild(addDependencyButton);

    const removeStepButton = document.createElement('button');
    removeStepButton.setAttribute('class', 'action-button dangerous');
    removeStepButton.innerText = 'Remove step';

    removeStepButton.onclick = () => {
        confirm_dangerous_action("Remove step “" + element.title + "”",
                                 element.title, () => {
            Api.remove_step(element.project_id, element.id, (success) => {
                has_changed = true;
                base.close();
            });
        });
    }
    body.appendChild(removeStepButton);

    return () => { return has_changed };
}

function confirm_dangerous_action(action_description, type_information, callback) {
    const overlay = document.createElement("div");
    overlay.setAttribute('class', 'overlay');    
    const popup = document.createElement("div");
    popup.setAttribute('class', 'popup small');

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    overlay.style.height = document.body.offsetHeight + 'px';
    overlay.style.width = document.body.offsetWidth + 'px';

    const messageBox = document.createElement('div');
    messageBox.setAttribute('class', 'message');

    const messageStart = document.createElement('div');
    messageStart.innerText = "The following action is about to be performed:";
    messageBox.appendChild(messageStart);

    const actionDescriptionMessage = document.createElement('div');
    actionDescriptionMessage.setAttribute('class', 'action-description dangerous');
    actionDescriptionMessage.innerText = action_description;
    messageBox.appendChild(actionDescriptionMessage);

    const warningMessage = document.createElement('div');
    warningMessage.innerText = 'This cannot be undone!';
    messageBox.appendChild(warningMessage);

    const callToAction = document.createElement('div');
    const instructionsStart = document.createElement('span');
    instructionsStart.innerText = 'Type “';
    callToAction.appendChild(instructionsStart);

    const instructionsRequirement = document.createElement('span');
    instructionsRequirement.innerText = type_information;
    callToAction.appendChild(instructionsRequirement);

    const instructionsEnd = document.createElement('span');
    instructionsEnd.innerText = '” to confirm';
    callToAction.appendChild(instructionsEnd);
    messageBox.appendChild(callToAction);
    popup.appendChild(messageBox);

    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.setAttribute('class', 'user-confirmation');
    popup.appendChild(inputBox);

    const confirmButton = document.createElement('button');
    confirmButton.setAttribute('class', 'action-button dangerous');
    confirmButton.innerText = 'Confirm';
    confirmButton.disabled = true;
    confirmButton.onclick = () => {
        (popup as any).close();
        callback();
    }
    popup.appendChild(confirmButton);

    inputBox.onkeyup = () => {
        const confirmed = inputBox.value === type_information;
        confirmButton.disabled = !confirmed;
    };

    (popup as any).close = () => {
        document.body.removeChild(overlay);
    }

    const cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'action-button');
    cancelButton.innerText = 'Cancel';
    cancelButton.onclick = (popup as any).close;
    popup.appendChild(cancelButton);

    overlay.onclick = (popup as any).close;
    popup.onclick = (ev) => {
        ev.stopPropagation();
    }
}

function build_popup(element, graph){ 
    const overlay = document.createElement("div");
    overlay.setAttribute('class', 'overlay');    
    const popup = document.createElement("div");
    popup.setAttribute('class', 'popup');

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    const graphTree = document.getElementById('techtree-graph');
    const fullHeight = Math.max(screen.height,
                                document.body.parentElement.offsetHeight);

    const fullWidth = Math.max(screen.width,
                               document.body.parentElement.offsetWidth,
                               (parseInt(graphTree.style.width) +
                                parseInt(graphTree.style.left))
                               );

    overlay.style.height = fullHeight + 'px';
    overlay.style.width = fullWidth + 'px';

    const has_element_changed = build_fast_element_form(element, popup, graph);

    (popup as any).close = () => {
        if (has_element_changed()) {
            // Refresh window
            window.location = window.location;
        }
        document.body.removeChild(overlay);
    }

    overlay.onclick = (popup as any).close;
    popup.onclick = (ev) => {
        ev.stopPropagation();
    }


    return popup;
}

function popup_element(element, graph) {
    const popup = build_popup(element, graph);

    window.scrollTo({
        top: 0,
        left: 0,
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
                          column: LayoutRow, svg,
                          nodes_map,
                          column_num, graph){
    const box_padding = 3; // px
    const inter_row_separation = 5; // px
    const draw_actions = [];
    const base_end_runway = 20; // px

    let height = 0;
    let width = 0;

    const per_row_height = calculate_per_row_height(svg);
    const dependency_line_padding = 1; // px
    const dependency_line_size = 1; // px

    const dependency_positions = {};
    let dependency_count = 0;
    let line_count = 0;

    // Find out necessary padding for dependency lines
    for (const entry of column) {
        const element = entry.element;
        if (element === undefined) {
            continue;
        }

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

    for (const entry of column) {
        const element = entry.element;

        if (element === undefined) {
            continue;
        }

        const row_num = entry.row_index;

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
            draw_actions.push(() => {
                if (nodes_map[dependency] === undefined) {
                    return;
                }

                // Connect two points
                const dependency_index = dependency_positions[dependency];
                const end_runway = base_end_runway + dependency_line_offset
                                                   - (dependency_index * ((dependency_line_padding * 2)
                                                                          + 1)); // px

                const init_column = nodes_map[dependency].column_num;
                const end_column = nodes_map[element.id].column_num;

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
                    const init = nodes_map[dependency].right_middle;
                    const end = nodes_map[element.id].left_middle;

                    curve = [
                        "M", init.left, ",", init.top,
                        " C", init.left + end_runway, ",", init.top,
                        " ", end.left - end_runway, ",", end.top,
                        " ", end.left, ",", end.top
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