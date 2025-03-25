import { Face } from "./FacesSection";
import { MidPlatform } from "./MidPlatformsSection";
import { ObjectContainer } from "./ObjectsSection";

export default class SectorsSection {
    public sectors: Sector[];
    public offsetMap: { [offset: number]: Sector };
    public faceCount: number;

    public constructor() {
        this.sectors = [];
        this.offsetMap = {};
        this.faceCount = 0;
    }
}

export class Sector {
    public selfOffset: number | undefined;

    public faces?: Face[];
    public intermediateFloor?: MidPlatform;
    public associatedObjectContainer?: ObjectContainer

    constructor(
        public ceilingHeight = 0x0000,  // signed
        public floorHeight = 0x0000,    // signed
        public unk0x04 = 0x0000,
        public ceilingTextureIndex = 0x0000,
        public floorTextureIndex = 0x0000,
        public textureFit = 0x00,
        public lighting = 0x00,
        public unk0x0C = 0x00,
        public facesCount = 0x00,
        public firstFaceOffset = 0x0000,
        public ceilingTextureShiftX = 0x00, // signed
        public ceilingTextureShiftY = 0x00, // signed
        public floorTextureShiftX = 0x00,   // signed
        public floorTextureShiftY = 0x00,   // signed
        public unk0x14 = 0x0000,
        public unk0x16 = 0x0000,
        public intermediateFloorOffset = 0x0000,
    ) {

    }

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            fields
            floorHeight: ${this.floorHeight}
            unk0x04: ${this.unk0x04.toString(16).padStart(4, '0')}
            ceilingTextureIndex: 0x${this.ceilingTextureIndex.toString(16).padStart(4, '0')}
            floorTextureIndex: 0x${this.floorTextureIndex.toString(16).padStart(4, '0')}
            textureFit: ${this.textureFit}
            lighting: ${this.lighting}
            unk0x0C: ${this.unk0x0C.toString(16).padStart(4, '0')}
            facesCount: ${this.facesCount}
            firstFaceOffset: 0x${this.firstFaceOffset.toString(16).padStart(4, '0')}
            ceilingTextureShiftX: ${this.ceilingTextureShiftX}
            ceilingTextureShiftY: ${this.ceilingTextureShiftY}
            floorTextureShiftX: ${this.floorTextureShiftX}
            floorTextureShiftY: ${this.floorTextureShiftY}
            unk0x14: ${this.unk0x14.toString(16).padStart(4, '0')}
            unk0x16: ${this.unk0x16.toString(16).padStart(4, '0')}
            intermediateFloorOffset: 0x${this.intermediateFloorOffset.toString(16).padStart(4, '0')}
        `
    }
}
