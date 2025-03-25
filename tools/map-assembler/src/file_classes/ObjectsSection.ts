import { Sector } from "./SectorsSection";

export default class ObjectsSection {
    public selfOffset?: number;
    public selfRelativeOffset?: number;
    
    public size: number;
    public sectorObjectMapping: number[];
    public objectContainers: ObjectContainer[]

    public constructor() {
        this.size = 0;
        this.sectorObjectMapping = [];
        this.objectContainers = [];
    }
}

export class ObjectContainer {
    public selfRelativeOffset?: number;
    public selfOffset?: number;
    public associatedSector?: Sector;
    
    public count: number;
    public countRepeat: number;
    public objects: GameObject[];

    public constructor() {
        this.count = 0;
        this.countRepeat = 0;
        this.objects = [];
    }

    public toString(): string {
        return `
            relativeOffset: 0x${this.selfRelativeOffset?.toString(16).padStart(4, '0')}
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}
            
            count: ${this.count}
            countRepeat: ${this.countRepeat}
            objects: ${this.objects.map((gameObject: GameObject) => gameObject.toString()).join('\n')}
        `
    }
}

export class GameObject {
    public selfOffset?: number;
    public container?: ObjectContainer;

    public constructor(
        public posX = 0x0000, // signed
        public posY = 0x0000, // signed
        public textureIndex = 0x00,
        public textureSource = 0x00, 
        public rotation = 0x00,
        public unk0x07 = 0x00,
        public lighting = 0x00, 
        public renderType = 0x00,
        public posZ = 0x0000,
        public unk0x0C = 0x0000,
        public unk0x0E = 0x0000,
    ) {}

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}
        
            posX: ${this.posX}
            posY: ${this.posY}
            textureIndex: 0x${this.textureIndex.toString(16).padStart(2, '0')}
            textureSource: 0x${this.textureSource.toString(16).padStart(2, '0')}
            rotation: ${this.rotation}
            unk0x07: 0x${this.unk0x07.toString(16).padStart(2, '0')}
            lighting: ${this.lighting}
            renderType: 0x${this.renderType.toString(16).padStart(2, '0')}
            posZ: ${this.posZ}
            unk0x0C: 0x${this.unk0x0C.toString(16).padStart(4, '0')}
            unk0x0E: 0x${this.unk0x0E.toString(16).padStart(4, '0')}
        `
        
    }

}