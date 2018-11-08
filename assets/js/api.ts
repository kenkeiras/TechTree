import * as Project from './project';
import { Contributor } from './ui/contributor';

function get_csrf_token(): string {
    return (document.head.querySelector('[name="csrf-token"]') as HTMLMetaElement).content;
}

export type Id = number | string;

export function set_step_state(project_id: Id, step_id: Id, state: string, cb: Function) {
    patch_step(project_id, step_id, {state: state}, cb);
}

export function patch_step(project_id: Id, step_id: Id, state: any, cb: Function) {
    const xhttp = new XMLHttpRequest();
   
    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success);
    };
    
    xhttp.open("PATCH", "/api/projects/" + project_id +  "/steps/" + step_id, true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");
    
    xhttp.send(JSON.stringify({"state": state}));
}

export function get_available_dependencies_for_step(project_id: Id, step_id: Id, cb: Function){
    const xhttp = new XMLHttpRequest();
   
    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success, success ? JSON.parse(this.responseText) : null);
    };
    
    xhttp.open("GET", "/api/projects/" + project_id +  "/steps/" + step_id + "/dependencies", true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());

    xhttp.send();
}

export function add_dependency(project_id: Id, depender_id: Id, dependency_id: Id, cb: Function) {
    const xhttp = new XMLHttpRequest();
   
    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success, success ? JSON.parse(this.responseText) : null);
    };
    
    xhttp.open("PUT", "/api/projects/" + project_id +  "/steps/" + depender_id + "/dependencies/" + dependency_id, true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");
    
    xhttp.send();
}

export function remove_dependency(project_id: Id, step_id: Id, dependency_id: Id, cb: Function){
    const xhttp = new XMLHttpRequest();
   
    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success, success ? JSON.parse(this.responseText) : null);
    };
    
    xhttp.open("DELETE", "/api/projects/" + project_id +  "/steps/" + step_id + "/dependencies/" + dependency_id, true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");
    
    xhttp.send();

}

export function remove_step(project_id: Id, step_id: Id, cb: Function){
    const xhttp = new XMLHttpRequest();
   
    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success, success ? JSON.parse(this.responseText) : null);
    };
    
    xhttp.open("DELETE", "/api/projects/" + project_id +  "/steps/" + step_id, true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");
    
    xhttp.send();
}

export function set_element_name(project_id: string, step_id: string, new_value: string, cb: Function) {
    patch_step(project_id, step_id, { "title": new_value }, cb);
}

export function set_element_description(project_id: string, step_id: string, new_value: string, cb: Function) {
    patch_step(project_id, step_id, { "description": new_value }, cb);
}

export function get_contributors(project_id: Id, cb: Function) {
    const xhr = new XMLHttpRequest(),
        method = "GET",
        url = "/api/projects/" + project_id + "/contributors";

    xhr.open(method, url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            cb(result);
        } else if (xhr.readyState === 4) {
            console.error(
                "Request returned code",
                xhr.status,
                "text",
                xhr.responseText
            );
        }
    };
    xhr.send();
}

export function get_project_graph(project_id: Id, cb: Function) {
    function process(project_id, stepsResult) {
        for (const step of stepsResult.steps){
            step.location = "/projects/" + project_id + "/steps/" + step.Id;
            step.project_id = project_id;
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

export function set_project_name(project_id: string, name: string, cb: Function) {
    if (name.length < 1) {
        cb(false);
        return;
    }

    patch_project(project_id, {"name": name}, cb);
}

export function set_project_visibility(project_id: Id, visibility: Project.Visibility, cb: Function) {
    patch_project(project_id, {"visibility": visibility}, cb);
}

function patch_project(project_id: Id, data, cb: Function) {
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success);
    };

    xhttp.open("PATCH", "/api/projects/" + project_id, true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");

    xhttp.send(JSON.stringify(data));
}

export function create_step(project_id: string, properties: any, cb: Function){
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;
        cb(success);
    };

    xhttp.open("POST", "/api/projects/" + project_id + "/steps", true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");

    xhttp.send(JSON.stringify({step: properties}));
}

export function add_contributor_to_project(
    project_id: Id,
    contributor_email: string,
    cb: (success: boolean, contributor_id: Number) => void
) {
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;

        let contributor_id: Number = null;

        if (success) {
            const data = JSON.parse(this.responseText);
            contributor_id = data.contributor.id;
        }

        cb(success, contributor_id);
    };

    xhttp.open("POST", "/api/projects/" + project_id + "/contributors", true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");

    xhttp.send(JSON.stringify({email: contributor_email}));
}

export function remove_contributor_from_project(
    project_id: Id,
    contributor: Contributor,
    cb: ((success: boolean) => void)
) {
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        const success = this.status == 200;

        cb(success);
    };

    xhttp.open("DELETE", "/api/projects/" + project_id + "/contributors/" + contributor.id, true);
    xhttp.setRequestHeader("x-csrf-token", get_csrf_token());
    xhttp.setRequestHeader("Content-Type", "application/json");

    xhttp.send();
}
