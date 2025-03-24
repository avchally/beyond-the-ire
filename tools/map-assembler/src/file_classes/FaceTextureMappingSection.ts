export default class FaceTextureMappingSection {
    public mappings: FaceTextureMapping[];
    public offsetMap: { [offset: number]: FaceTextureMapping };
    
    public constructor() {
        this.mappings = [];
        this.offsetMap = {};
    }
}


export interface ExtraFaceTextureMappingData {
    shiftTextureX: number // 0x00 (signed)
    shiftTextureY: number // 0x00 (signed)
    unk0x0C: number // 0x0000
}

export class FaceTextureMapping {
    public selfOffset: number | undefined;
    
    public constructor(
        public unk0x00 = 0x00,
        public type = 0x00,
        public midTextureIndex = 0x0000,
        public upperTextureIndex = 0x0000,
        public lowerTextureIndex = 0x0000,
        public unk0x08 = 0x0000,
        public additionalMetadata?: ExtraFaceTextureMappingData,
    ) {}

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            fields
            unk0x00: 0x${this.unk0x00.toString(16).padStart(2, '0')}
            type: 0x${this.type.toString(16).padStart(2, '0')}
            midTextureIndex: 0x${this.midTextureIndex.toString(16).padStart(4, '0')}
            upperTextureIndex: 0x${this.upperTextureIndex.toString(16).padStart(4, '0')}
            lowerTextureIndex: 0x${this.lowerTextureIndex.toString(16).padStart(4, '0')}
            unk0x08: 0x${this.unk0x08.toString(16).padStart(4, '0')}
            ${this.additionalMetadata ? `shiftTextureX: ${this.additionalMetadata.shiftTextureX}` : ''}
            ${this.additionalMetadata ? `shiftTextureY: ${this.additionalMetadata.shiftTextureY}` : ''}
            ${this.additionalMetadata ? `unk0x0C: 0x${this.additionalMetadata.unk0x0C.toString(16).padStart(4, '0')}` : ''}
        `
    }
}
