import MapParser, { OffsetIndexLookupMaps } from "../MapParser";
import { Face } from "./FacesSection";
import { MidPlatform } from "./MidPlatformsSection";
import { GameObject, ObjectContainer, ObjectJSON } from "./ObjectsSection";


export interface SectorsSectionJSON {
    sectors: SectorJSON[];
    // faceCount: number;
}

export interface SectorJSON {
    ceilingHeight: number;
    floorHeight: number;
    unk0x04: number;
    ceilingTextureIndex: number;
    floorTextureIndex: number;
    textureFit: number;
    lighting: number;
    unk0x0C: number;
    facesCount: number;
    firstFaceIndex: number;
    ceilingTextureShiftX: number;
    ceilingTextureShiftY: number;
    floorTextureShiftX: number;
    floorTextureShiftY: number;
    floorTriggerID: number;
    unk0x16: number;
    intermediateFloorIndex: number | undefined;
    objectInformation: ObjectJSON[] | undefined;
}

export default class SectorsSection {
    public sectors: Sector[];
    public offsetMap: { [offset: number]: Sector };
    public faceCount: number;

    public constructor() {
        this.sectors = [];
        this.offsetMap = {};
        this.faceCount = 0;
    }

    public static toJSON(map: MapParser, offsetIndexLookupMaps: OffsetIndexLookupMaps): SectorsSectionJSON {
        const sectorsJSON: SectorJSON[] = [];
        map.sectorsSection.sectors.forEach((sector: Sector, index: number) => {
            // const objectInformation = map.objectsSection.objectContainers[index]?.objects.map((gameObject: GameObject) => gameObject.toJSON());

            sectorsJSON.push({
                ceilingHeight: sector.ceilingHeight,
                floorHeight: sector.floorHeight,
                unk0x04: sector.unk0x04,
                ceilingTextureIndex: sector.ceilingTextureIndex,
                floorTextureIndex: sector.floorTextureIndex,
                textureFit: sector.textureFit,
                lighting: sector.lighting,
                unk0x0C: sector.unk0x0C,
                facesCount: sector.facesCount,
                firstFaceIndex: offsetIndexLookupMaps.faces[sector.firstFaceOffset],
                ceilingTextureShiftX: sector.ceilingTextureShiftX,
                ceilingTextureShiftY: sector.ceilingTextureShiftY,
                floorTextureShiftX: sector.floorTextureShiftX,
                floorTextureShiftY: sector.floorTextureShiftY,
                floorTriggerID: sector.floorTriggerID,
                unk0x16: sector.unk0x16,
                intermediateFloorIndex: sector.intermediateFloorOffset === 0 ? undefined : offsetIndexLookupMaps.midPlatforms[sector.intermediateFloorOffset],
                objectInformation: [],
            });
        });

        for (const objectContainer of map.objectsSection.objectContainers) {
            if (objectContainer.sectorIndex === undefined) {
                throw new Error("Object container does not have sectorIndex!");
            }
            sectorsJSON[objectContainer.sectorIndex].objectInformation = objectContainer.objects.map((gameObject: GameObject) => gameObject.toJSON());
        }

        return {
            sectors: sectorsJSON,
            // faceCount: map.sectorsSection.faceCount,
        }
    }
}

export class Sector {
    public selfOffset: number | undefined;

    public faces?: Face[];
    public intermediateFloor?: MidPlatform;
    public associatedObjectContainer?: ObjectContainer
    public sectorIndex?: number;

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
        public floorTriggerID = 0x0000,
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
            floorTriggerID: ${this.floorTriggerID.toString(16).padStart(4, '0')}
            unk0x16: ${this.unk0x16.toString(16).padStart(4, '0')}
            intermediateFloorOffset: 0x${this.intermediateFloorOffset.toString(16).padStart(4, '0')}
        `
    }

    // public toJSON(): SectorJSON {
    //     return {
    //         ceilingHeight: this.ceilingHeight,
    //         floorHeight: this.floorHeight,
    //         unk0x04: this.unk0x04,
    //         ceilingTextureIndex: this.ceilingTextureIndex,
    //         floorTextureIndex: this.floorTextureIndex,
    //         textureFit: this.textureFit,
    //         lighting: this.lighting,
    //         unk0x0C: this.unk0x0C,
    //         facesCount: this.facesCount,
    //         firstFaceIndex: 0, // must be later reassigned
    //         ceilingTextureShiftX: this.ceilingTextureShiftX,
    //         ceilingTextureShiftY: this.ceilingTextureShiftY,
    //         floorTextureShiftX: this.floorTextureShiftX,
    //         floorTextureShiftY: this.floorTextureShiftY,
    //         floorTriggerID: this.floorTriggerID,
    //         unk0x16: this.unk0x16,
    //         intermediateFloorIndex: 0, // must be later reassigned
    //     }
    // }
}
