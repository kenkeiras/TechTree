#!/usr/bin/env python3

import json
import sys

data = json.load(open(sys.argv[1], 'rt'))

print("digraph {")
print("rankdir=LR;")
for step in data['steps']:
    print(step['title'], file=sys.stderr)

    print("{}[label=\"{}\"];".format(step['id'], step['title']))
    for dep in step['dependencies']:
        print("{} -> {};".format(dep, step['id']))

print("}")
