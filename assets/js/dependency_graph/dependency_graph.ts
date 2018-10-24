import * as Api from '../api';
import * as params from '../params';
import { layout_steps, Layout, LayoutRow, LayoutEntry } from './layout';

const COMPLETED_STROKE_STYLE = '#548A00';
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

function add_node(canvas, element, left, top, graph) {
    const x_padding = 2; // px
    const y_padding = 2; // px

    let completed_class = '';
    let strike_color = 'black';
    if (element.completed) {
        strike_color = COMPLETED_STROKE_STYLE;
        completed_class = ' completed';
    }

    const node = document.createElementNS(SvgNS, 'a');
    const rect = document.createElementNS(SvgNS, 'rect');
    const textBox = document.createElementNS(SvgNS, 'text');

    canvas.appendChild(node);

    node.appendChild(rect);

    node.appendChild(textBox);

    textBox.setAttribute('class', 'actionable' + completed_class);
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
        textBox.setAttributeNS(null, 'x', "0");
        textBox.setAttributeNS(null, 'y', "0");

        textCorrection = { 
            X: -(textBox.getClientRects()[0].left - canvas.getClientRects()[0].left),
            Y: -(textBox.getClientRects()[0].top - canvas.getClientRects()[0].top)
        }
    }

    textBox.setAttributeNS(null,'x', x_padding + left + textCorrection.X);
    textBox.setAttributeNS(null,'y', y_padding + top + textCorrection.Y);

    rect.setAttribute('class', completed_class);
    rect.setAttributeNS(null,'x', left);
    rect.setAttributeNS(null,'y', top);
    rect.setAttributeNS(null,'stroke-width','1');
    rect.setAttributeNS(null,'width', (textBox.getClientRects()[0].width + x_padding * 2) + "");
    rect.setAttributeNS(null,'height', (textBox.getClientRects()[0].height + y_padding * 2) + "");

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

    (node as any).onmouseenter = onHover;
    (node as any).onmouseleave = onRestore;
    node.onclick = () => {
        popup_element(element, graph);
    };

    return {
        width: rect.getClientRects()[0].width,
        height: rect.getClientRects()[0].height,
        node_list: [node]
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
        console.log("Success", success);
        console.log("Result", result);

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

    const set_completion = (element) => {
        if (element.completed) {
            state.innerText = 'COMPLETE';
            completedClass = 'completed';
            toggleButton.innerText = 'Mark To-Do';
            toggleButton.onclick = () => {
                toggleButton.setAttribute('class', 'action-button loading');
                has_changed = true;
                Api.mark_step_todo(element.project_id,
                                element.id,
                                (success) => {
                                    if (success) {
                                        toggleButton.setAttribute('class', 'action-button loaded');
                                        element.completed = false;
                                        set_completion(element);
                                    }
                                    else {
                                        toggleButton.setAttribute('class', 'action-button failed');
                                    }
                                });
            }        
        }
        else {
            state.innerHTML = 'TO-DO';
            toggleButton.innerText = 'Mark Completed';

            toggleButton.onclick = () => {
                toggleButton.setAttribute('class', 'action-button loading');
                has_changed = true;
                Api.mark_step_done(element.project_id, 
                                   element.id,
                                   (success) => {
                                    if (success) {
                                          toggleButton.setAttribute('class', 'action-button loaded');
                                          element.completed = true;
                                          set_completion(element);
                                    }
                                    else {
                                        toggleButton.setAttribute('class', 'action-button failed');
                                    }
                                   });
            }
        }

        completedRow.setAttribute('class', 'completion ' + completedClass);
    };

    set_completion(element);

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
        createDependencyAdder(element.project_id, 
                              element.id,
                              addDependencySection,
                              () => { has_changed = true; });
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