import { DoubleLinkedGraphNode } from './graph_node';
const UNDEPENDED = 'UNDEPENDED';

interface RowAllocationNodeSlot {
    id: number,
    depended_by: number[]
};

type SlotEntry = RowAllocationNodeSlot | 'UNDEPENDED';

export class RowAllocationSlots {
    positions: SlotEntry[];

    constructor() {
        this.positions = [];
    }

    get_position_for_element(vanilla_element: RowAllocationNodeSlot) {
        // Prepare a copy of the element to insert
        const element = {
            id: vanilla_element.id,
            depended_by: Array.from(vanilla_element.depended_by)
        };

        // Remove element from depended_by
        const depending_on_this = [];
        for (let i = 0; i < this.positions.length; i++) {
            const slot = this.positions[i];

            if ((slot === undefined) || (slot === UNDEPENDED)) {
                continue;
            }

            if (slot.depended_by.indexOf(element.id) !== -1) {
                depending_on_this.push(i);

                // Rebuild the array to undefined's in between
                slot.depended_by = slot.depended_by.filter((v, _i, _a) => {
                    const keep = v !== element.id;
                    return keep;
                });
            }
        }

        // Remove elements which was undepended the step before
        for (const i of depending_on_this) {
            const slot = this.positions[i];
            if ((slot as DoubleLinkedGraphNode).depended_by.length === 0) {
                this.positions[i] = UNDEPENDED;
            }
        }

        // Get any element which only remaining dependence was this
        for (const i of depending_on_this) {
            const slot = this.positions[i];

            if ((slot === UNDEPENDED) || (slot.depended_by.length === 0)) {
                this.positions[i] = element;
                return i;
            }
        }

        // Get any available position
        for (let i = 0; i < this.positions.length; i++) {
            if (this.positions[i] === undefined) { // Empty position
                this.positions[i] = element;
                return i;
            }
        }

        // Return the last position
        const position = this.positions.length;
        this.positions.push(element);
        return position;
    }

    finish_column() {
        for(let i=0; i < this.positions.length; i++) {
            if (this.positions[i] === UNDEPENDED) {
                this.positions[i] = undefined;
            }
        }
    }
}