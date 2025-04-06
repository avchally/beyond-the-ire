import MapParser from "../MapParser";
import { Sector } from "./SectorsSection";

export interface MidPlatformsSectionJSON {
    // count: number;
    platforms: MidPlatformJSON[];
}

export interface MidPlatformJSON {
    ceilingTextureIndex: number;
    ceilingHeight: number;
    ceilingTextureShiftX: number;
    ceilingTextureShiftY: number;
    floorTextureIndex: number;
    floorHeight: number;
    floorTextureShiftX: number;
    floorTextureShiftY: number;
    floorTextureScale: number;
    padding?: number;
}

export default class MidPlatformsSection {
    public count: number;
    public platforms: MidPlatform[];
    public offsetMap: { [offset: number]: MidPlatform };

    constructor() {
        this.count = 0;
        this.platforms = [];
        this.offsetMap = {};
    }

    public static toJSON(map: MapParser): MidPlatformsSectionJSON | undefined {
        if (!map.midPlatformsSection) {
            return undefined;
        }
        return {
            // count: map.midPlatformsSection.count,
            platforms: map.midPlatformsSection.platforms.map((midPlatform: MidPlatform) => ({
                ceilingTextureIndex: midPlatform.ceilingTextureIndex,
                ceilingHeight: midPlatform.ceilingHeight,
                ceilingTextureShiftX: midPlatform.ceilingTextureShiftX,
                ceilingTextureShiftY: midPlatform.ceilingTextureShiftY,
                floorTextureIndex: midPlatform.floorTextureIndex,
                floorHeight: midPlatform.floorHeight,
                floorTextureShiftX: midPlatform.floorTextureShiftX,
                floorTextureShiftY: midPlatform.floorTextureShiftY,
                floorTextureScale: midPlatform.floorTextureScale,
                padding: midPlatform.padding,
            })),
        };
    }
}

export class MidPlatform {
    public selfOffset: number | undefined;
    public associatedSectors: Sector[];

    public constructor(
        public ceilingTextureIndex = 0x0000,
        public ceilingHeight = 0x0000, // signed
        public ceilingTextureShiftX = 0x00, // signed
        public ceilingTextureShiftY = 0x00, // signed
        public floorTextureIndex = 0x0000,
        public floorHeight = 0x0000, //signed
        public floorTextureShiftX = 0x00, // signed
        public floorTextureShiftY = 0x00, // signed
        public floorTextureScale = 0x00,
        public padding = 0x00,
    ) {
        this.associatedSectors = [];
    }

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            fields
            ceilingTextureIndex: 0x${this.ceilingTextureIndex.toString(16).padStart(4, '0')}
            ceilingHeight: ${this.ceilingHeight}
            ceilingTextureShiftX: ${this.ceilingTextureShiftX}
            ceilingTextureShiftY: ${this.ceilingTextureShiftY}
            floorTextureIndex: 0x${this.floorTextureIndex.toString(16).padStart(4, '0')}
            floorHeight: ${this.floorHeight}
            floorTextureShiftX: ${this.floorTextureShiftX}
            floorTextureShiftY: ${this.floorTextureShiftY}
            floorTextureScale: ${this.floorTextureScale.toString(16).padStart(2, '0')}
            padding: ${this.padding.toString(16).padStart(2, '0')}
        `
    }
}
