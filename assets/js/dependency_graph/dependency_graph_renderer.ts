import { DependencyGraph } from './dependency_graph';
import * as params from '../params';
import * as Api from '../api';
import * as Prompts from './prompts';
import * as Hotkeys from '../hotkeys';

function is_depended_by(depended, depender, graph) {
    if (depender.id === depended.id) {
        return true;
    }

    if (depender.dependencies.indexOf(depended.id) >= 0) {
        return true;
    }

    const explored = {};
    const to_explore = Array.from(depender.dependencies);
    while (to_explore.length > 0) {
        const elem = to_explore.shift() as number;

        for (const dependency of graph[elem].dependencies) {
            if (dependency == depended.id) {
                return true;
            }

            if (explored[dependency] === undefined) {
                explored[dependency] = true;
                to_explore.push(dependency);
            }
        }
    }

    return false;
}

function remove_steps_not_depended_by(steps, step_id) {
    const graph = {};

    for (const step of steps) {
        graph[step.id] = step;
    }

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (!is_depended_by(step, graph[step_id], graph)) {
            delete steps[i];
        }
    }

    return steps.filter((v) => v !== undefined);
}

function focus_data(data) {
    const search_dict = params.search_to_dict(document.location.search);
    if (search_dict['from'] === undefined) {
        return;
    }

    const steps = remove_steps_not_depended_by(data.steps, search_dict['from']);
    data.steps = steps;
}

class DependencyGraphRendererDriver {
    public run() {
        const graph = new DependencyGraph(document.getElementById("dependency_graph"));

        const project_id = document.location.pathname.split("/")[2];

        Api.get_project_graph(project_id, data => {
            focus_data(data);
            graph.render(data);
        });

        this.configure_title(project_id);
        this.configure_buttons(project_id);
    }

    private configure_buttons(project_id: string) {
        this.configure_add_step_buttons(project_id);
    }

    private configure_add_step_buttons(project_id: string) {
        const buttons = document.getElementsByClassName("add-step-button");
        const trigger_add_step = () => Prompts.show_add_step_prompt(project_id);

        // Set buttons
        for (const button of buttons) {
            (button as HTMLButtonElement).onclick = trigger_add_step;
        }

        // Set hotkeys
        Hotkeys.set_key('a', trigger_add_step);
    }

    private configure_title(project_id: string) {
        const title = document.querySelector(".header > nav > h1.title");

        const editableTitle: HTMLSpanElement = title.querySelector("span.editable");
        const search_dict = params.search_to_dict(document.location.search);
        const focused = search_dict['from'] !== undefined;

        if (focused) {
            const unfocus_link = document.createElement("a");
            unfocus_link.innerText = "←";
            unfocus_link.href = document.location.pathname; // No search part

            title.insertBefore(unfocus_link, editableTitle);
        }

        make_editable(editableTitle, project_id);
    }
};

function make_editable(editableTitle: HTMLSpanElement, project_id: string) {
    editableTitle.setAttribute('contentEditable', 'true');
    editableTitle.setAttribute('spellcheck', 'false');

    let real_value = editableTitle.innerText;

    // Block line jumps on project names
    editableTitle.onkeypress = (ev: KeyboardEvent) => {
        const key = ev.key;
        if (key == 'Enter') {
            ev.preventDefault();
            editableTitle.blur();
        }
    };

    editableTitle.onblur = (ev: FocusEvent) => {
        const new_value = editableTitle.innerText.trim();
        if (new_value === real_value) {
            return;
        }

        Api.set_project_name(project_id, new_value, (success) => {
            if (success) {
                real_value = new_value;
                document.title = new_value + ' @ TechTree';
            }
            else {
                editableTitle.innerText = real_value;
            }
        });
    }
}

const DependencyGraphRenderer = new DependencyGraphRendererDriver();

export { DependencyGraphRenderer };