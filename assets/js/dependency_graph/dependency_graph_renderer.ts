import { DependencyGraph } from './dependency_graph';
import * as params from '../params';
import * as Api from '../api';

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
    }
};

const DependencyGraphRenderer = new DependencyGraphRendererDriver();

export { DependencyGraphRenderer };