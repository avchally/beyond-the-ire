import { Vertex } from "./VerticesSection";
import { Sector } from "./SectorsSection";
import { FaceTextureMapping } from "./FaceTextureMappingSection";

export default class FacesSection {
    public faces: Face[];
    public offsetMap: { [offset: number]: Face };
    public faceTextureMappingCount: number;
    
    public constructor() {
        this.faces = [];
        this.offsetMap = {};
        this.faceTextureMappingCount = 0;
    }
}

export class Face {
    public selfOffset: number | undefined;
    
    public vertex1?: Vertex;
    public vertex2?: Vertex;
    public faceTextureMapping?: FaceTextureMapping;
    public sector?: Sector;
    public sisterFace?: Face;
    
    public constructor(
        public vertexOffset01 = 0x0000,
        public vertexOffset02 = 0x0000,
        public textureMappingOffset = 0x0000,
        public sectorOffset = 0x0000,
        public sisterFaceOffset = 0x0000,
        public unk0x0A = 0x0000,
    ) {}

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            fields
            vertexOffset01: 0x${this.vertexOffset01.toString(16).padStart(4, '0')}
            vertexOffset02: 0x${this.vertexOffset02.toString(16).padStart(4, '0')}
            textureMappingOffset: 0x${this.textureMappingOffset.toString(16).padStart(4, '0')}
            sectorOffset: 0x${this.sectorOffset.toString(16).padStart(4, '0')}
            sisterFaceOffset: 0x${this.sisterFaceOffset.toString(16).padStart(4, '0')}
            unk0x0A: ${this.unk0x0A}
        `
    }
}
