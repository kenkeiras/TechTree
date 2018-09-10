function get_csrf_token() {
    return (document.head.querySelector('[name="csrf-token"]') as HTMLMetaElement).content;
}

function mark_step_done(project_id, step_id, cb) {
    patch_step(project_id, step_id, {completed: true}, cb);
}

function mark_step_todo(project_id, step_id, cb) {
    patch_step(project_id, step_id, {completed: false}, cb);
}

function patch_step(project_id, step_id, state, cb) {
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

function get_available_dependencies_for_step(project_id, step_id, cb){
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

function add_dependency(project_id, depender_id, dependency_id, cb) {
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

function remove_dependency(project_id, step_id, dependency_id, cb){
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
                    
export {
    mark_step_done,
    mark_step_todo,
    get_available_dependencies_for_step,
    add_dependency,
    remove_dependency,
}