import { DependencyGraph } from './dependency_graph';
import * as params from '../params';
import * as Api from '../api';
import * as Prompts from './prompts';
import * as Hotkeys from '../hotkeys';
import * as Permissions from './permissions';
import * as Project from '../project';
import { Contributor } from '../ui/contributor';
import { ContributorStore } from '../ui/contributor_store';
import * as ContributorMenus from '../ui/contributor_menus';

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
    public run(user_can_edit: boolean) {
        Permissions.set_user_can_edit(user_can_edit);

        const graph = new DependencyGraph(document.getElementById("dependency_graph"));

        const project_id = document.location.pathname.split("/")[2];

        Api.get_project_graph(project_id, data => {
            focus_data(data);
            graph.render(data);

            this.configure_buttons(project_id, data.steps);
        });

        if (user_can_edit) {
            // Only owners or contributors can see the list
            // of contributors
            Api.get_contributors(project_id, contributor_data => {
                this.configure_contributor_data(contributor_data, project_id);
            });
        }

        this.configure_title(project_id);
        this.configure_visibility_dropdown(project_id);
    }

    private configure_contributor_data(contributor_data, project_id) {
        const contributors: Contributor[] = contributor_data.contributors;
        const contributor_store: ContributorStore = new ContributorStore(contributors);

        const contributors_menus = document.getElementsByClassName('contributors-option');
        
        for (const contributors_menu of contributors_menus) {
            for (const count of contributors_menu.getElementsByClassName('contributors-count')) {
                contributor_store.link_set((contributors) => {
                    (count as any).innerText = contributors.length;
                });
            }

            (contributors_menu as any).onclick = () => ContributorMenus.show_contributor_prompt(contributor_store, project_id);
        }
    }

    private project_set_private(project_id: string) {
        const project_name = this.get_project_name();

        Prompts.confirm_dangerous_action("Set project “" + project_name + "” as private",
                                 project_name, () => {
            Api.set_project_visibility(project_id, Project.Visibility.Private, (success) => {
                if (success) {
                    document.location = document.location;
                }
            });
        },
        { danger: "This will remove general access to the project"}
        );
    }

    private project_set_public(project_id: string) {
        const project_name = this.get_project_name();

        Prompts.confirm_dangerous_action("Set project “" + project_name + "” as public",
                                 project_name, () => {
            Api.set_project_visibility(project_id, Project.Visibility.Public, (success) => {
                if (success) {
                    document.location = document.location;
                }
            });
        },
        { danger: "This will allow anyone to see the project"}
        );
    }

    private configure_visibility_dropdown(project_id: string) {
        if (Permissions.can_user_edit()) {
            const set_private_elements = document.getElementsByClassName('set-project-visibility-private');
            for (const private_setter of set_private_elements) {
                (private_setter as any).onclick = () => { this.project_set_private(project_id); return false; }
            }

            const set_public_elements = document.getElementsByClassName('set-project-visibility-public');
            for (const public_setter of set_public_elements) {
                (public_setter as any).onclick = () => { this.project_set_public(project_id); return false; }
            }

        }
        else {
            this.disable_visibility_dropdown();
        }
    }

    private disable_visibility_dropdown() {
        const buttons = document.getElementsByClassName('visibility-dropdown-button');

        for (const button of buttons) {
            (button as HTMLButtonElement).disabled = true;

            // Remove arrows down inside
            for (const arrow_down of button.getElementsByClassName('glyphicon-menu-down')) {
                arrow_down.parentElement.removeChild(arrow_down);
            }
        }
    }

    private configure_buttons(project_id: string, steps) {
        this.configure_add_step_buttons(project_id, steps);
    }

    private configure_add_step_buttons(project_id: string, steps) {
        const buttons = document.getElementsByClassName("add-step-button");

        const trigger_add_step = () => Prompts.show_add_step_prompt(project_id, steps);

        // Set buttons
        for (const button of buttons) {
            (button as HTMLButtonElement).onclick = trigger_add_step;

            if (!Permissions.can_user_edit()) {
                (button as HTMLButtonElement).disabled = true;
            }
        }

        if (Permissions.can_user_edit()) {
            // Set hotkeys
            Hotkeys.set_key('a', trigger_add_step);
        }
    }

    private get_project_name(): string {
        const title = document.querySelector(".header > nav > h1.title");

        const editableTitle: HTMLSpanElement = title.querySelector("span.editable");
        return editableTitle.innerText;
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

        if (Permissions.can_user_edit()){
            make_editable(editableTitle, project_id);
        }
        else {
            // Remove editable property
            editableTitle.classList.remove('editable');
        }
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