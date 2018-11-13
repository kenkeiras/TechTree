import { ContributorStore } from "./contributor_store";
import * as Prompts from "../dependency_graph/prompts";
import { add_index_item_removal } from "../dependency_graph/dependency_graph";
import { Id } from "../api";
import * as API from "../api";
import { Contributor } from "./contributor";

export function show_contributor_prompt(
    contributor_store: ContributorStore,
    project_id: Id
) {
    try {
        Prompts.build_popup(popup =>
            add_contributor_prompt(popup, contributor_store, project_id)
        );
    } catch (e) {
        console.error(e);
    }
}

function sort_contributors_by_email(contributors: Contributor[]) {
    contributors.sort((a, b) => {
        const name_a = a.email.toUpperCase(); // ignore upper and lowercase
        const name_b = b.email.toUpperCase(); // ignore upper and lowercase

        if (name_a < name_b) {
            return -1;
        }

        if (name_a > name_b) {
            return 1;
        }

        // names must be equal
        return 0;
    });
}

function build_contributor_list(project_id: Id, contributor_store: ContributorStore) {
    const list = document.createElement("ul");

    const contributors = contributor_store.list_contributors();

    sort_contributors_by_email(contributors);

    for (const contributor of contributors) {
        const item = document.createElement("li");

        const removeDependencyButton = document.createElement('button');
        removeDependencyButton.setAttribute('class', 'list-index dangerous');
        add_index_item_removal(removeDependencyButton);
        item.appendChild(removeDependencyButton);

        removeDependencyButton.onclick = () => {
            Prompts.confirm_dangerous_action("Remove contributor “" + contributor.email + "”",
            contributor.email, () => {
                API.remove_contributor_from_project(project_id, contributor, (success) => {
                    if (success) {
                        contributor_store.remove_contributor(contributor);
                    }
                });
            });
        };

        const contributor_info = document.createElement("span");
        contributor_info.innerText = contributor.email;
        contributor_info.className = 'contributor-email';
        item.appendChild(contributor_info);

        list.appendChild(item);
    }

    return list;
}

function add_contributor_prompt(
    popup,
    contributor_store: ContributorStore,
    project_id: Id
) {
    let has_changed = false;

    const titleBar = document.createElement("h1");
    const title = document.createElement("span");
    title.innerText = "Contributors";

    titleBar.appendChild(title);
    popup.appendChild(titleBar);

    const contributor_list_holder = document.createElement("div");

    const on_contributors_change = (contributors: Contributor[]) => {
        const contributor_list = build_contributor_list(project_id, contributor_store);
        for (const subelement of contributor_list_holder.childNodes) {
            contributor_list_holder.removeChild(subelement);
        }

        contributor_list_holder.appendChild(contributor_list);
    };

    contributor_store.link_set(on_contributors_change);
    popup.appendChild(contributor_list_holder);

    const form = document.createElement("form");
    form.onsubmit = () => false;

    const add_contributor_group = document.createElement("div");
    add_contributor_group.setAttribute("class", "form-group");

    const contributor_input_label = document.createElement('label');
    contributor_input_label.className = 'control-label';
    contributor_input_label.innerText = 'Add contributor';

    const contributor_text_input = document.createElement("input");
    contributor_text_input.type = 'email';
    contributor_text_input.className = 'light-form-control';
    contributor_text_input.placeholder = 'Introduce email of new contributor';

    const add_contributor_button = document.createElement('input');
    add_contributor_button.type = 'submit';
    add_contributor_button.setAttribute('class', 'btn btn-primary');
    add_contributor_button.value = 'Add';

    add_contributor_button.onclick = () => {
        const contributor_email = contributor_text_input.value.trim();

        if (contributor_email.length === 0) {
            return;
        }

        add_contributor_button.disabled = true;
        API.add_contributor_to_project(project_id, contributor_email, (success, id) => {
            add_contributor_button.disabled = false;

            if (success) {
                // On success, we know the id is safe.
                const safe_id: number = id as number;

                contributor_text_input.value = '';
                contributor_store.add_contributor({
                    id: safe_id,
                    email: contributor_email
                });
            }
        })
    };

    add_contributor_group.appendChild(contributor_input_label);
    add_contributor_group.appendChild(contributor_text_input);
    add_contributor_group.appendChild(add_contributor_button);

    form.appendChild(add_contributor_group);

    const button_group = document.createElement("div");
    button_group.setAttribute("class", "form-group");

    const close_button = document.createElement("button");
    close_button.setAttribute("class", "nav-button");
    close_button.innerText = "Close";
    close_button.onclick = () => popup.close();

    button_group.appendChild(close_button);

    form.appendChild(button_group);

    popup.appendChild(form);

    return () => has_changed;
}
