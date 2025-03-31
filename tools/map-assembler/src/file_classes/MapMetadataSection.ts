import MapDisassembler from "../MapAssembler";

export interface MapMetadataSectionJSON {
    initPosX: number;
    initPosZ: number;
    initPosY: number;
    rotation: number;
    moveSpeed: number;
    playerHeight: number;
    maxClimb: number;
    minFit: number;
    unk0x10: number;
    candleGlow: number;
    lightAmbience: number;
    unk0x16: number;
    skyTexture: number;
    unk0x1A: number;
}

export default class MapMetadataSection {
    public constructor(
        public initPosX = 0x0000,  // signed
        public initPosZ = 0x0000,  // signed
        public initPosY = 0x0000,  // signed
        public rotation = 0x0000,  // signed
        public moveSpeed = 0x0000, // default 0x05
        public playerHeight = 0x0000,
        public maxClimb = 0x0000,
        public minFit = 0x0000,
        public unk0x10 = 0x0000,
        public candleGlow = 0x0000, // signed
        public lightAmbience = 0x0000, // 0x00 - 0x02
        public unk0x16 = 0x0000,
        public skyTexture = 0x0000,
        public unk0x1A = 0x0000,
    ) {}

    public toString(): string {
        return `Map metadata:
            initPosX: ${this.initPosX}
            initPosZ: ${this.initPosZ}
            initPosY: ${this.initPosY}
            rotation: ${this.rotation}
            moveSpeed: ${this.moveSpeed}
            playerHeight: ${this.playerHeight}
            maxClimb: ${this.maxClimb}
            minFit: ${this.minFit}
            unk0x10: 0x${this.unk0x10.toString(16).padStart(4, '0')}
            candleGlow: ${this.candleGlow}
            lightAmbience: ${this.lightAmbience}
            unk0x16: 0x${this.unk0x16.toString(16).padStart(4, '0')}
            skyTexture: 0x${this.skyTexture.toString(16).padStart(4, '0')}
            unk0x1A: 0x${this.unk0x1A.toString(16).padStart(4, '0')}
        `
    }

    public static toJSON(map: MapDisassembler): MapMetadataSectionJSON {
        const section = map.mapMetadataSection;
        return {
            initPosX: section.initPosX,
            initPosZ: section.initPosZ,
            initPosY: section.initPosY,
            rotation: section.rotation,
            moveSpeed: section.moveSpeed,
            playerHeight: section.playerHeight,
            maxClimb: section.maxClimb,
            minFit: section.minFit,
            unk0x10: section.unk0x10,
            candleGlow: section.candleGlow,
            lightAmbience: section.lightAmbience,
            unk0x16: section.unk0x16,
            skyTexture: section.skyTexture,
            unk0x1A: section.unk0x1A,
        }
    }
}
