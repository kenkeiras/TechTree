function get_csrf_token(): string {
    return (document.head.querySelector('[name="csrf-token"]') as HTMLMetaElement).content;
}

type id = number | string;

export function mark_step_done(project_id: id, step_id: id, cb: Function) {
    patch_step(project_id, step_id, {completed: true}, cb);
}

export function mark_step_todo(project_id: id, step_id: id, cb: Function) {
    patch_step(project_id, step_id, {completed: false}, cb);
}

export function patch_step(project_id: id, step_id: id, state: any, cb: Function) {
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

export function get_available_dependencies_for_step(project_id: id, step_id: id, cb: Function){
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

export function add_dependency(project_id: id, depender_id: id, dependency_id: id, cb: Function) {
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

export function remove_dependency(project_id: id, step_id: id, dependency_id: id, cb: Function){
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

export function remove_step(project_id: id, step_id: id, cb: Function){
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

export function get_project_graph(project_id: id, cb: Function) {
    function process(project_id, stepsResult) {
        for (const step of stepsResult.steps){
            step.location = "/projects/" + project_id + "/steps/" + step.id;
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

    xhttp.send(JSON.stringify({"name": name}));
}
