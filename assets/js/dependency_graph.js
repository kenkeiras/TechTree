class DependencyGraph {
    constructor(div) {
        this.div = div;
    }

    render(data) {
        console.log("Rendering on", this.div, "data:", data);

        console.log(sort_by_dependency_columns(data.steps));
    }
}

function sort_by_dependency_columns(steps) {
    // Check which steps are being depended by which
    const depended = {};

    for (const step of steps){
        depended[step.id] = { 
            id: step.id,
            dependencies: step.dependencies,
            depended_by: [],
        };
    }

        
    for (const step of steps){
        for (const dependency of step.dependencies) {
            depended[dependency].depended_by.push(step.id);
        }
    }

    const undepended = [];
    for (const depId of Object.keys(depended)) {
        const dep = depended[depId];

        if (dep.depended_by.length == 0) {
            undepended.push(dep.id);
        }
    }

    let rows = [undepended];

    // Start building by the undepended, and backtrack until
    // there are no more dependencies
    while (true) {
        const last_row = rows[rows.length - 1];
        let depended_by_last = [];
        for(const element of last_row) {
            depended_by_last = depended_by_last.concat(depended[element].dependencies);
        }

        if (depended_by_last.length == 0) {
            break;
        }
        rows.push(depended_by_last);
    }

    // Then try to show items as soon as possible by prunning them
    const found = {};
    rows = rows.reverse();
    for (const row of rows) {
        for (let i = 0; i < row.length; i++) {
            let step_id = row[i];
            if (found[step_id] !== true) {
                found[step_id] = true;
            }
            else {
                delete row[i];
            }
        }
    }

    return resolve(rows, steps);
}

function resolve(rows, steps) {
    const steps_by_id = {};
    for(const step of steps) {
        steps_by_id[step.id] = step;
    }

    const resolved = [];
    for(const row of rows) {
        const resolved_row = [];
        for (const step_id of row) {
            if (step_id !== undefined){
                resolved_row.push(steps_by_id[step_id]);
            }
        }

        resolved.push(resolved_row);
    }

    return resolved;
}

function get_project_graph(project_id, cb) {
    const xhr = new XMLHttpRequest(),
          method = "GET",
          url = "/api/projects/" + project_id + "/dependencies";

    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
        if(xhr.readyState === 4 && xhr.status === 200) {
            cb(JSON.parse(xhr.responseText));
        }
        else if (xhr.readyState === 4) {
            console.error("Request returned code", xhr.status, "text", xhr.responseText);
        }        
    };
    xhr.send();
}

var Graph = undefined;

var DependencyGraphRenderer = { 
    run: function() {
        Graph = new DependencyGraph(document.getElementById("dependency_graph"));

        const project_id = document.location.pathname.split("/")[2];

        get_project_graph(project_id, data => {
            Graph.render(data);
        });
    }
};

module.exports = {
    DependencyGraph,
    DependencyGraphRenderer,
    sort_by_dependency_columns,
};
