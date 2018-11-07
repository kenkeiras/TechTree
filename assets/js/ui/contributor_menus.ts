import { ContributorStore } from "./contributor_store";
import { build_popup } from "../dependency_graph/prompts";
import { Id } from "../api";
import { Contributor } from "./contributor";

export function show_contributor_prompt(
    contributor_store: ContributorStore,
    project_id: Id
) {
    try {
        build_popup(popup =>
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

function build_contributor_list(contributors: Contributor[]) {
    const list = document.createElement("ul");

    sort_contributors_by_email(contributors);

    for (const contributor of contributors) {
        const item = document.createElement("li");
        item.innerText = contributor.email;

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
        const contributor_list = build_contributor_list(contributors);
        for (const subelement of contributor_list_holder.childNodes) {
            contributor_list_holder.removeChild(subelement);
        }

        contributor_list_holder.appendChild(contributor_list);
    };

    contributor_store.link_set(on_contributors_change);
    popup.appendChild(contributor_list_holder);

    const form = document.createElement("form");
    form.onsubmit = () => false;

    const button_group = document.createElement("div");
    button_group.setAttribute("class", "form-group");

    const cancel_button = document.createElement("button");
    cancel_button.setAttribute("class", "nav-button");
    cancel_button.innerText = "Close";
    cancel_button.onclick = () => popup.close();

    button_group.appendChild(cancel_button);

    form.appendChild(button_group);

    popup.appendChild(form);

    return () => has_changed;
}
