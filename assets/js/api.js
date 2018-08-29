function get_csrf_token() {
    return document.head.querySelector('[name="csrf-token"]').content;
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

module.exports = exports =  {
    mark_step_done,
    mark_step_todo,
}