import MapParser from "../MapParser";

export interface Section7Header {
    size_a: number;
    count: number;
}

export interface Section7JSON {
    unkArray01: UnkObject01JSON[];
    unkArray02?: UnkObject02JSON[];
}

export interface UnkObject01JSON {
    unk0x00: number;
    unk0x02: number;
    unk0x04: number;
    unk0x06: number;
    unk0x08: number;
    unk0x0A: number;
    unk0x0C: number;
    unk0x0E: number;
    unk0x10: number;
}
export interface UnkObject02JSON {
    unk0x00: number;
    unk0x02: number;
    unk0x04: number;
    unk0x06: number;
    unk0x08: number;
    unk0x0A: number;
    unk0x0C: number;
    unk0x0E: number;
    unk0x10: number;
    unk0x12: number;
    unk0x14: number;
    unk0x16: number;
    unk0x18: number;
    unk0x1A: number;
    unk0x1C: number;
    unk0x1E: number;
}

export default class Section7 {
    public header?: Section7Header;
    public unkArray01: UnkObject01[];
    public unkArray02?: UnkObject02[];

    public constructor() {
        this.unkArray01 = [];
    }

    public static toJSON(map: MapParser): Section7JSON {
        return {
            unkArray01: map.section7.unkArray01.map((unkObj01: UnkObject01) => ({
                unk0x00: unkObj01.unk0x00,
                unk0x02: unkObj01.unk0x02,
                unk0x04: unkObj01.unk0x04,
                unk0x06: unkObj01.unk0x06,
                unk0x08: unkObj01.unk0x08,
                unk0x0A: unkObj01.unk0x0A,
                unk0x0C: unkObj01.unk0x0C,
                unk0x0E: unkObj01.unk0x0E,
                unk0x10: unkObj01.unk0x10,
            })),
            unkArray02: map.section7.unkArray02?.map((unkObj02: UnkObject02) => ({
                unk0x00: unkObj02.unk0x00,
                unk0x02: unkObj02.unk0x02,
                unk0x04: unkObj02.unk0x04,
                unk0x06: unkObj02.unk0x06,
                unk0x08: unkObj02.unk0x08,
                unk0x0A: unkObj02.unk0x0A,
                unk0x0C: unkObj02.unk0x0C,
                unk0x0E: unkObj02.unk0x0E,
                unk0x10: unkObj02.unk0x10,
                unk0x12: unkObj02.unk0x12,
                unk0x14: unkObj02.unk0x14,
                unk0x16: unkObj02.unk0x16,
                unk0x18: unkObj02.unk0x18,
                unk0x1A: unkObj02.unk0x1A,
                unk0x1C: unkObj02.unk0x1C,
                unk0x1E: unkObj02.unk0x1E,
            })),
        }
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