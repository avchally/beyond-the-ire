import { Sector } from "./SectorsSection";

export default class MidPlatformsSection {
    public count: number;
    public platforms: MidPlatform[];
    public offsetMap: { [offset: number]: MidPlatform };

    constructor() {
        this.count = 0;
        this.platforms = [];
        this.offsetMap = {};
    }
}

export class MidPlatform {
    public selfOffset: number | undefined;
    public associatedSectors: Sector[];

    public constructor(
        public ceilingTextureIndex = 0x0000,
        public ceilingHeight = 0x0000, // signed
        public unk0x04 = 0x0000,
        public floorTextureIndex = 0x0000,
        public floorHeight = 0x0000, //signed
        public unk0x0A = 0x0000,
        public unk0x0C = 0x0000,
    ) {
        this.associatedSectors = [];
    }

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            fields
            ceilingTextureIndex: 0x${this.ceilingTextureIndex.toString(16).padStart(4, '0')}
            ceilingHeight: ${this.ceilingHeight}
            unk0x04: 0x${this.unk0x04.toString(16).padStart(4, '0')}
            floorTextureIndex: 0x${this.floorTextureIndex.toString(16).padStart(4, '0')}
            floorHeight: ${this.floorHeight}
            unk0x0A: 0x${this.unk0x0A.toString(16).padStart(4, '0')}
            unk0x0C: 0x${this.unk0x0C.toString(16).padStart(4, '0')}
        `
    }
}
