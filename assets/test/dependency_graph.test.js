const assert = require('assert');
const dependency_graph = require('../js/dependency_graph.js');

describe('Dependency graph', function() {
    it('Simple two level graph, no loops', function() {
        const input = [
            {
                "id":3,
                "dependencies":[2]
            },
            {
                "id":2,
                "dependencies":[1]
            },
            {
                "id":4,
                "dependencies":[1,2,3]
            },
            {
                "id":1,
                "dependencies":[]
            }
        ];

        /** 
         * Expected result
         * 
         *        /--------v
         *  1 -> 2 -> 3 -> 4
         *   \-------------^   
         */

        const output = [
            [
                {
                    "id":1,
                    "dependencies":[]
                }
            ],
            [
                {
                    "id":2,
                    "dependencies":[1]
                },
            ],
            [
                {
                    "id":3,
                    "dependencies":[2]
                },
            ],
            [
                {
                    "id":4,
                    "dependencies":[1,2,3]
                }
            ]
        ];

        assert.deepEqual(dependency_graph.sort_by_dependency_columns(input), output);
    });
});