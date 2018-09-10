export interface GraphNode {
    id: number,
    title: string,
    description: string,
    dependencies: number[],
};

export interface DoubleLinkedGraphNode extends GraphNode {
    depended_by: number[],
};