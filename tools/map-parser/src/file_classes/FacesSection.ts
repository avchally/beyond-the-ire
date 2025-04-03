import VerticesSection, { Vertex } from "./VerticesSection";
import { Sector } from "./SectorsSection";
import { FaceTextureMapping } from "./FaceTextureMappingSection";
import MapParser, { OffsetIndexLookupMaps } from "../MapParser";

export interface FacesSectionJSON {
    faces: FaceJSON[];
    // faceTextureMappingCount: number;
}

export interface FaceJSON {
    vertexIndex01: number;
    vertexIndex02: number;
    textureMappingIndex: number;
    sectorIndex: number;
    sisterFaceIndex?: number;
    unk0x0A: number;
}

export default class FacesSection {
    public faces: Face[];
    public offsetMap: { [offset: number]: Face };
    public faceTextureMappingCount: number;
    
    public constructor() {
        this.faces = [];
        this.offsetMap = {};
        this.faceTextureMappingCount = 0;
    }

    public static toJSON(map: MapParser, offsetIndexLookupMaps: OffsetIndexLookupMaps): FacesSectionJSON {
        const facesJSON: FaceJSON[] = [];
        for (const face of map.facesSection.faces) {
            
            // console.log(`sectorOffset: ${face.sectorOffset}  | indexlookupmap: ${offsetIndexLookupMaps.sectors[face.sectorOffset]}`);
            // console.log(JSON.stringify(offsetIndexLookupMaps.sectors, null, 2));

            
            // console.log(JSON.stringify({
            //     vertexIndex01: offsetIndexLookupMaps.vertices[face.vertexOffset01],
            //     vertexIndex02: offsetIndexLookupMaps.vertices[face.vertexOffset02],
            //     textureMappingIndex: offsetIndexLookupMaps.faceTextureMappings[face.textureMappingOffset],
            //     sectorIndex: offsetIndexLookupMaps.sectors[face.sectorOffset],
            //     sisterFaceIndex: offsetIndexLookupMaps.faces[face.sisterFaceOffset],
            //     unk0x0A: face.unk0x0A,
            // }, null, 2));
            // throw Error('test');
            
            facesJSON.push({
                vertexIndex01: offsetIndexLookupMaps.vertices[face.vertexOffset01],
                vertexIndex02: offsetIndexLookupMaps.vertices[face.vertexOffset02],
                textureMappingIndex: offsetIndexLookupMaps.faceTextureMappings[face.textureMappingOffset],
                sectorIndex: offsetIndexLookupMaps.sectors[face.sectorOffset],
                sisterFaceIndex: offsetIndexLookupMaps.faces[face.sisterFaceOffset], // 0xFFFF for none, will be undefined
                unk0x0A: face.unk0x0A,
            })
        }

        return {
            faces: facesJSON,
            // faceTextureMappingCount: map.facesSection.faceTextureMappingCount,
        }
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
