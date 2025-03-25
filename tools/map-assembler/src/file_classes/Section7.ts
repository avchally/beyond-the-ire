export interface Section7Header {
    size_a: number;
    count: number;
}

export default class Section7 {
    public header?: Section7Header;
    public unkArray01: UnkObject01[];
    public unkArray02?: UnkObject02[];

    public constructor() {
        this.unkArray01 = [];
    }
}

export class UnkObject01 {
    public selfOffset: number | undefined;

    public constructor(
        public unk0x00 = 0x0000, //signed
        public unk0x02 = 0x0000, //signed
        public unk0x04 = 0x0000,
        public unk0x06 = 0x0000,
        public unk0x08 = 0x0000,
        public unk0x0A = 0x0000,
        public unk0x0C = 0x0000,
        public unk0x0E = 0x0000,
        public unk0x10 = 0x0000,
    ) {}

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            unk0x00: ${this.unk0x00}
            unk0x02: ${this.unk0x02}
            unk0x04: 0x${this.unk0x04.toString(16).padStart(4, '0')}
            unk0x06: 0x${this.unk0x06.toString(16).padStart(4, '0')}
            unk0x08: 0x${this.unk0x08.toString(16).padStart(4, '0')}
            unk0x0A: 0x${this.unk0x0A.toString(16).padStart(4, '0')}
            unk0x0C: 0x${this.unk0x0C.toString(16).padStart(4, '0')}
            unk0x0E: 0x${this.unk0x0E.toString(16).padStart(4, '0')}
            unk0x10: 0x${this.unk0x10.toString(16).padStart(4, '0')}
        `
    }
}

export class UnkObject02 {
    public selfOffset: number | undefined;

    public constructor(
        public unk0x00 = 0x0000,
        public unk0x02 = 0x0000,
        public unk0x04 = 0x0000,
        public unk0x06 = 0x0000,
        public unk0x08 = 0x0000,
        public unk0x0A = 0x0000,
        public unk0x0C = 0x0000,
        public unk0x0E = 0x0000,
        public unk0x10 = 0x0000,
        public unk0x12 = 0x0000,
        public unk0x14 = 0x0000,
        public unk0x16 = 0x0000,
        public unk0x18 = 0x0000,
        public unk0x1A = 0x0000,
        public unk0x1C = 0x0000,
        public unk0x1E = 0x0000,
    ) {}

    public toString(): string {
        return `
            offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            unk0x00: 0x${this.unk0x00.toString(16).padStart(4, '0')}
            unk0x02: 0x${this.unk0x02.toString(16).padStart(4, '0')}
            unk0x04: 0x${this.unk0x04.toString(16).padStart(4, '0')}
            unk0x06: 0x${this.unk0x06.toString(16).padStart(4, '0')}
            unk0x08: 0x${this.unk0x08.toString(16).padStart(4, '0')}
            unk0x0A: 0x${this.unk0x0A.toString(16).padStart(4, '0')}
            unk0x0C: 0x${this.unk0x0C.toString(16).padStart(4, '0')}
            unk0x0E: 0x${this.unk0x0E.toString(16).padStart(4, '0')}
            unk0x10: 0x${this.unk0x10.toString(16).padStart(4, '0')}
            unk0x12: 0x${this.unk0x12.toString(16).padStart(4, '0')}
            unk0x14: 0x${this.unk0x14.toString(16).padStart(4, '0')}
            unk0x16: 0x${this.unk0x16.toString(16).padStart(4, '0')}
            unk0x18: 0x${this.unk0x18.toString(16).padStart(4, '0')}
            unk0x1A: 0x${this.unk0x1A.toString(16).padStart(4, '0')}
            unk0x1C: 0x${this.unk0x1C.toString(16).padStart(4, '0')}
            unk0x1E: 0x${this.unk0x1E.toString(16).padStart(4, '0')}
        `
    }
}