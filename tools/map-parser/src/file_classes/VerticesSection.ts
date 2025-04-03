import MapParser from "../MapParser";

export interface VerticesHeader {
    sectionSize: number;
    sectionHeaderSize: number;
    unk0x04: number;
    verticesCount: number;
}

export interface VerticesSectionJSON {
    // count: number;
    vertices: VertexJSON[]
}

export interface VertexJSON {
    // all other fields are always 0
    x: number;
    y: number;
}

export default class VerticesSection {
    public header?: VerticesHeader;
    
    public vertices: Vertex[];
    public offsetMap: { [offset: number]: Vertex };
    public relativeOffsetMap: { [offset: number]: Vertex };

    public constructor() {
        this.vertices = [];
        this.offsetMap = {};
        this.relativeOffsetMap = {};
    }

    public static toJSON(map: MapParser): VerticesSectionJSON {
        return {
            // count: map.verticesSection.header?.verticesCount || NaN,
            vertices: map.verticesSection.vertices.map((vertex: Vertex) => ({ x: vertex.posX, y: vertex.posY })),
        }
    }
}

export class Vertex {
    public selfOffset: number | undefined;
    public selfRelativeOffset: number | undefined;
    
    public constructor(
        public unk0x00 = 0x0000,
        public unk0x02 = 0x0000,
        public unk0x04 = 0x0000,
        public unk0x06 = 0x0000,
        public posX = 0x0000, // signed
        public posY = 0x0000, // signed
    ) {}

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            fields
            unk0x00: 0x${this.unk0x00.toString(16).padStart(4, '0')}
            unk0x02: 0x${this.unk0x02.toString(16).padStart(4, '0')}
            unk0x04: 0x${this.unk0x04.toString(16).padStart(4, '0')}
            unk0x06: 0x${this.unk0x06.toString(16).padStart(4, '0')}
            posX: ${this.posX}
            posY: ${this.posY}
        `
    }
}
