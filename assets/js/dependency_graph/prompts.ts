import * as Api from '../api';
import * as Hotkeys from '../hotkeys';

export function show_add_step_prompt(project_id: string, steps) {
    build_popup((popup) => add_step_prompt(popup, project_id, steps));

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
}

function to_set(values: [string]): {[key: string] : boolean} {
    const set = {};

    for (const value of values) {
        set[value] = true;
    }

    return set;
}

function add_step_prompt(popup, project_id: string, steps): (() => boolean) {
    let has_changed = false;

    const titleBar = document.createElement('h1');
    const title = document.createElement('span');
    title.innerText = 'Add step';

    titleBar.appendChild(title);
    popup.appendChild(titleBar);

    const form = document.createElement('form');
    form.onsubmit = () => false;

    const name_group = document.createElement('div');
    name_group.setAttribute('class', 'form-group add-step-name');

    const name_label = document.createElement('label');
    name_label.setAttribute('class', 'control-label');
    name_label.setAttribute('for', 'step_title');
    name_label.innerText = 'Title';

    const name_input = document.createElement('input');
    name_input.setAttribute('class', 'form-control');
    name_input.placeholder = 'Step title';
    name_input.id = 'step_title';
    name_input.name = 'step[title]';
    name_input.type = 'text';

    const name_help_block = document.createElement('span');
    name_help_block.setAttribute('class', 'help-block');

    name_group.appendChild(name_label);
    name_group.appendChild(name_help_block);
    name_group.appendChild(name_input);

    form.appendChild(name_group);

    const description_group = document.createElement('div');
    description_group.setAttribute('class', 'form-group');

    const description_label = document.createElement('label');
    description_label.setAttribute('class', 'control-label');
    description_label.setAttribute('for', 'step_description');
    description_label.innerText = 'Description';

    const description_input = document.createElement('input');
    description_input.setAttribute('class', 'form-control');
    description_input.placeholder = 'Step description';
    description_input.id = 'step_description';
    description_input.name = 'step[description]';
    description_input.type = 'text';

    description_group.appendChild(description_label);
    description_group.appendChild(description_input);
    form.appendChild(description_group);

    const button_group = document.createElement('div');
    button_group.setAttribute('class', 'form-group');

    const create_button = document.createElement('button');
    create_button.setAttribute('class', 'btn btn-primary');
    create_button.innerText = 'Create';
    create_button.onclick = () => {
        let valid = true;
        // Validate
        if (name_input.value.length < 1) {
            mark_error(name_input, name_help_block, 'Cannot be empty');
            valid = false;
        }

        if (valid) {
            create_button.disabled = true;

            Api.create_step(project_id,
                            {
                                title: name_input.value,
                                description: description_input.value
                            },
                            (success) => {
                                if (success) {
                                    has_changed = true;
                                    popup.close();
                                }
                                else {
                                    create_button.disabled = false;
                                }
                            });
        }
    }
    button_group.appendChild(create_button);

    // Check that the name is not repeated
    const step_set = to_set(steps.map(step => step.title.trim().toUpperCase()));
    const check_name_not_repeated = () => {
        // On name input check if it's repeated, if it is
        if (step_set[name_input.value.trim().toUpperCase()]) {
            name_input.classList.add('warning');
            create_button.classList.add('warning');
            name_help_block.innerText = 'There is already a step with that name';
        }
        else {
            if (name_input.classList.contains('warning')){
                name_input.classList.remove('warning');
                name_help_block.innerText = '';

                if (create_button.classList.contains('warning')) {
                    create_button.classList.remove('warning');
                }
            }
        }
    };
    name_input.onchange = check_name_not_repeated;
    name_input.onkeyup = check_name_not_repeated;


    const cancel_button = document.createElement('button');
    cancel_button.setAttribute('class', 'nav-button');
    cancel_button.innerText = 'Cancel';
    cancel_button.onclick = () => popup.close();

    button_group.appendChild(cancel_button);

    form.appendChild(button_group);

    popup.appendChild(form);
    name_input.focus();

    return () => has_changed;
}

function mark_error(input: HTMLInputElement, help_block: HTMLElement, message: string) {
    input.classList.add('invalid');
    help_block.innerText = message;
}

function set_class(element: HTMLElement, className: string) {
    element.classList.add(className);
}

function build_popup(setup_prompt: Function){ 
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

    const has_element_changed = setup_prompt(popup);

    (popup as any).close = () => {
        Hotkeys.pop_key('Escape', (popup as any).close);

        if (has_element_changed()) {
            // Refresh window
            window.location = window.location;
        }
        document.body.removeChild(overlay);
    }

    Hotkeys.set_key('Escape', (popup as any).close);

    overlay.onclick = (popup as any).close;
    popup.onclick = (ev) => {
        ev.stopPropagation();
    }


    return popup;
}
