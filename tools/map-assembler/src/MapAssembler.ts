import FacesSection, { Face } from "./file_classes/FacesSection";
import Header from "./file_classes/Header";
import SectorsSection, { Sector } from './file_classes/SectorsSection';
import FaceTextureMappingSection, { ExtraFaceTextureMappingData, FaceTextureMapping } from "./file_classes/FaceTextureMappingSection";
import MidPlatformsSection, { MidPlatform } from "./file_classes/MidPlatformsSection";
import MapMetadataSection from "./file_classes/MapMetadataSection";
import VerticesSection, { Vertex, VerticesHeader } from "./file_classes/VerticesSection";

export default class MapAssembler {
    public fileBuffer: Buffer<ArrayBufferLike>;
    public header: Header;
    public sectorsSection: SectorsSection;
    public facesSection: FacesSection;
    public faceTextureMappingSection: FaceTextureMappingSection;
    public midPlatformsSection?: MidPlatformsSection; // may not exist in the map
    public mapMetadataSection: MapMetadataSection;
    public verticesSection: VerticesSection;

    public constructor(fileBuffer: Buffer<ArrayBufferLike>) {
        this.fileBuffer = fileBuffer;
        
        this.header = new Header();
        this.sectorsSection = new SectorsSection();
        this.facesSection = new FacesSection();
        this.faceTextureMappingSection = new FaceTextureMappingSection();
        this.mapMetadataSection = new MapMetadataSection();
        this.verticesSection = new VerticesSection();

        this.parseFile();
    }

    private parseHeader() {
        if (this.fileBuffer.length < 0x1E) {
            throw new Error(`File is too small: ${this.fileBuffer.length} bytes. Header requires at least 30 bytes.`);
        }

        this.header.verticesOffset = this.fileBuffer.readUInt16LE(0x00);
        this.header.version = this.fileBuffer.readUInt16LE(0x02);
        this.header.sectorsOffset = this.fileBuffer.readUInt16LE(0x04);
        this.header.facesOffset = this.fileBuffer.readUInt16LE(0x06);
        this.header.faceTextureMapsOffset = this.fileBuffer.readUInt16LE(0x08);
        this.header.mapMetadataOffset = this.fileBuffer.readUInt16LE(0x0A);
        this.header.verticesOffsetRepeat = this.fileBuffer.readUInt16LE(0x0C);
        this.header.signature = this.fileBuffer.toString('ascii', 0x0E, 0x10);
        this.header.midPlatformsSection = this.fileBuffer.readUInt16LE(0x10);
        this.header.section7Size = this.fileBuffer.readUInt16LE(0x12);
        this.header.verticesSectionSize = this.fileBuffer.readUInt16LE(0x14);
        this.header.objectsSectionSize = this.fileBuffer.readUInt16LE(0x16);
        this.header.footerSize = this.fileBuffer.readUInt16LE(0x18);
        this.header.commandsSectionSize = this.fileBuffer.readUInt16LE(0x1A);
        this.header.sectorCount = this.fileBuffer.readUInt16LE(0x1C);
    }

    private confirmFileSize(): void {
        const expectedFileSize = this.header.verticesOffset + this.header.verticesSectionSize + this.header.commandsSectionSize + this.header.section7Size + this.header.objectsSectionSize + this.header.footerSize;
        
        // console.log(this.header.toString());
        // console.log(`Expected size: ${expectedFileSize}. Actual size: ${this.fileBuffer.length}`);

        if (expectedFileSize !== this.fileBuffer.length) {
            throw new Error(`Section sizes in header do not correlate to actual file size. Expected size: ${expectedFileSize}. Actual size: ${this.fileBuffer.length}`);
        }
    }

    private parseSectorsSection(): void {
        let currentPosition = this.header.sectorsOffset;;
        this.sectorsSection.sectors = [];
        this.sectorsSection.offsetMap = {};
        for (let i = 0; i < this.header.sectorCount; i++) {
            const sector = new Sector(
                this.fileBuffer.readInt16LE(currentPosition),          // ceilingHeight
                this.fileBuffer.readInt16LE(currentPosition + 0x02),   // floorHeight
                this.fileBuffer.readUInt16LE(currentPosition + 0x04),  // unk0x04
                this.fileBuffer.readUInt16LE(currentPosition + 0x06),  // ceilingTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x08),  // floorTextureIndex
                this.fileBuffer.readUInt8(currentPosition + 0x0A),  // textureFit
                this.fileBuffer.readUInt8(currentPosition + 0x0B),  // lighting
                this.fileBuffer.readUInt8(currentPosition + 0x0C),  // unk0x0C
                this.fileBuffer.readUInt8(currentPosition + 0x0D),  // facesCount
                this.fileBuffer.readUInt16LE(currentPosition + 0x0E),  // firstFaceOffset
                this.fileBuffer.readInt8(currentPosition + 0x10),  // ceilingTextureShiftX
                this.fileBuffer.readInt8(currentPosition + 0x11),  // ceilingTextureShiftY
                this.fileBuffer.readInt8(currentPosition + 0x12),  // floorTextureShiftX
                this.fileBuffer.readInt8(currentPosition + 0x13),  // floorTextureShiftY
                this.fileBuffer.readUInt16LE(currentPosition + 0x14),  // unk0x14
                this.fileBuffer.readUInt16LE(currentPosition + 0x16),  // unk0x16
                this.fileBuffer.readUInt16LE(currentPosition + 0x18),  // intermediateFloorOffset
            );

            sector.selfOffset = currentPosition;
            this.sectorsSection.sectors.push(sector);
            this.sectorsSection.offsetMap[currentPosition] = sector;

            currentPosition += 0x1A;
        }
        this.sectorsSection.faceCount = this.fileBuffer.readUInt16LE(currentPosition);

        // console.log(`Sector section results:\n`
        //     + `First sector: ${this.sectorsSection.sectors[0]?.toString()}\n`
        //     + `Second sector: ${this.sectorsSection.sectors[1]?.toString()}\n`
        //     + `Face count ${this.sectorsSection.faceCount}`
        // );
    }

    private parseFacesSection() {
        let currentPosition = this.header.facesOffset;
        this.facesSection.faces = [];
        this.facesSection.offsetMap = {};
        for (let i = 0; i < this.sectorsSection.faceCount; i++) {
            const face = new Face(
                this.fileBuffer.readUInt16LE(currentPosition), // vertexOffset01
                this.fileBuffer.readUInt16LE(currentPosition + 0x02), // vertexOffset02
                this.fileBuffer.readUInt16LE(currentPosition + 0x04), // textureMappingOffset
                this.fileBuffer.readUInt16LE(currentPosition + 0x06), // sectorOffset
                this.fileBuffer.readUInt16LE(currentPosition + 0x08), // sisterFaceOffset
                this.fileBuffer.readUInt16LE(currentPosition + 0x0A), // unk0x0A
            );

            face.selfOffset = currentPosition;
            this.facesSection.faces.push(face);
            this.facesSection.offsetMap[currentPosition] = face;

            currentPosition += 0x0C;
        }
        this.facesSection.faceTextureMappingCount = this.fileBuffer.readUInt16LE(currentPosition);

        // console.log(`Face section results:\n`
        //     + `First face: ${this.facesSection.faces[0]?.toString()}\n`
        //     + `Second face: ${this.facesSection.faces[1]?.toString()}\n`
        //     + `Face count ${this.facesSection.faceTextureMappingCount}`
        // );
    }

    private parseFaceTextureMappingSection() {
        let currentPosition = this.header.faceTextureMapsOffset;
        this.faceTextureMappingSection.mappings = [];
        this.faceTextureMappingSection.offsetMap = {};
        for (let i = 0; i < this.facesSection.faceTextureMappingCount; i++) {
            const type = this.fileBuffer.readUInt8(currentPosition + 0x01);
            let extraData: undefined | ExtraFaceTextureMappingData;
            if (type >= 0x80 && type <= 0x8F) {
                extraData = {
                    shiftTextureX: this.fileBuffer.readInt8(currentPosition + 0x0A),
                    shiftTextureY: this.fileBuffer.readInt8(currentPosition + 0x0B),
                    unk0x0C: this.fileBuffer.readUInt16LE(currentPosition + 0x0C),
                }
            }
            
            const faceTexturingMapping = new FaceTextureMapping(
                this.fileBuffer.readUInt8(currentPosition),             // unk0x00
                type,      // type
                this.fileBuffer.readUInt16LE(currentPosition + 0x02),   // midTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x04),   // upperTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x06),   // lowerTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x08),   // unk0x08
                extraData,
            );

            faceTexturingMapping.selfOffset = currentPosition;
            this.faceTextureMappingSection.mappings.push(faceTexturingMapping);
            this.faceTextureMappingSection.offsetMap[currentPosition] = faceTexturingMapping;

            currentPosition += 0x0A;
            if (extraData) {
                currentPosition += 0x04;
            }
        }

        // console.log(`Face texture mapping section results:\n`
        //     + `First face texture mapping: ${this.faceTextureMappingSection.mappings[0]?.toString()}\n`
        //     + `Second face texture mapping: ${this.faceTextureMappingSection.mappings[1]?.toString()}\n`
        // );
    }

    private parseMidPlatformSection() {
        if (this.header.midPlatformsSection === 0x0000) {
            return;
        }

        let currentPosition = this.header.midPlatformsSection - 0x02;
        this.midPlatformsSection = new MidPlatformsSection();
        this.midPlatformsSection.count = this.fileBuffer.readUInt16LE(currentPosition);
        currentPosition += 0x02;

        for (let i = 0; i < this.midPlatformsSection.count; i++) {
            const midPlatform = new MidPlatform(
                this.fileBuffer.readUInt16LE(currentPosition),        // ceilingTextureIndex
                this.fileBuffer.readInt16LE(currentPosition + 0x02), // ceilingHeight
                this.fileBuffer.readUInt16LE(currentPosition + 0x04), // unk0x04
                this.fileBuffer.readUInt16LE(currentPosition + 0x06), // floorTextureIndex
                this.fileBuffer.readInt16LE(currentPosition + 0x08), // floorHeight
                this.fileBuffer.readUInt16LE(currentPosition + 0x0A), // unk0x0A
                this.fileBuffer.readUInt16LE(currentPosition + 0x0C), // unk0x0C
            );

            midPlatform.selfOffset = currentPosition;
            this.midPlatformsSection.platforms.push(midPlatform);
            this.midPlatformsSection.offsetMap[currentPosition] = midPlatform;

            currentPosition += 0x0E;
        }

        // console.log(`Mid platform section results:\n`
        //     + `Mid platform count ${this.midPlatformsSection.count}\n`
        //     + `First mid platform: ${this.midPlatformsSection.platforms[0]?.toString()}\n`
        //     + `Second mid platform: ${this.midPlatformsSection.platforms[1]?.toString()}\n`
        // );
    }

    private parseMapMetadata() {
        const currentPosition = this.header.mapMetadataOffset;
        this.mapMetadataSection = new MapMetadataSection(
            this.fileBuffer.readInt16LE(currentPosition),           // initPosX
            this.fileBuffer.readInt16LE(currentPosition + 0x02),    // initPosZ
            this.fileBuffer.readInt16LE(currentPosition + 0x04),    // initPosY
            this.fileBuffer.readInt16LE(currentPosition + 0x06),    // rotation
            this.fileBuffer.readUInt16LE(currentPosition + 0x08),   // moveSpeed
            this.fileBuffer.readUInt16LE(currentPosition + 0x0A),   // playerHeight
            this.fileBuffer.readUInt16LE(currentPosition + 0x0C),   // maxClimb
            this.fileBuffer.readUInt16LE(currentPosition + 0x0E),   // minFit
            this.fileBuffer.readUInt16LE(currentPosition + 0x10),   // unk0x10
            this.fileBuffer.readInt16LE(currentPosition + 0x12),    // candleGlow
            this.fileBuffer.readUInt16LE(currentPosition + 0x14),   // lightAmbience
            this.fileBuffer.readUInt16LE(currentPosition + 0x16),   // unk0x16
            this.fileBuffer.readUInt16LE(currentPosition + 0x18),   // skyTexture
            this.fileBuffer.readUInt16LE(currentPosition + 0x1A),   // unk0x1A
        );

        // console.log(this.mapMetadataSection.toString());
    }

    private parseVerticesSection() {
        let currentPosition = this.header.verticesOffset;
        this.verticesSection.header = {
            sectionSize: this.fileBuffer.readUInt16LE(currentPosition),
            sectionHeaderSize: this.fileBuffer.readUInt16LE(currentPosition + 0x02),
            unk0x04: this.fileBuffer.readUInt16LE(currentPosition + 0x04),
            verticesCount: this.fileBuffer.readUInt16LE(currentPosition + 0x06),
        }
        currentPosition += 0x08;

        for (let i = 0; i < this.verticesSection.header.verticesCount; i++) {
            const vertex = new Vertex(
                this.fileBuffer.readInt16LE(currentPosition),           // unk0x00
                this.fileBuffer.readInt16LE(currentPosition + 0x02),    // unk0x02
                this.fileBuffer.readInt16LE(currentPosition + 0x04),    // unk0x04
                this.fileBuffer.readInt16LE(currentPosition + 0x06),    // unk0x06
                this.fileBuffer.readInt16LE(currentPosition + 0x08),   // posX
                this.fileBuffer.readInt16LE(currentPosition + 0x0A),   // posY
            );

            vertex.selfOffset = currentPosition;
            this.verticesSection.vertices.push(vertex);
            this.verticesSection.offsetMap[currentPosition] = vertex;

            currentPosition += 0x0C;
        }

        console.log(`Vertices section results:\n`
            + `Vertices header: 
                sectionSize: ${this.verticesSection.header.sectionSize}
                sectionHeaderSize: ${this.verticesSection.header.sectionHeaderSize}
                unk0x04: ${this.verticesSection.header.unk0x04}
                verticesCount: ${this.verticesSection.header.verticesCount}\n`
            + `First vertex: ${this.verticesSection.vertices[0]?.toString()}\n`
            + `Second vertex: ${this.verticesSection.vertices[1]?.toString()}\n`
        );
    }

    private parseFile(): void {
        this.parseHeader();
        this.confirmFileSize();
        this.parseSectorsSection();
        this.parseFacesSection();
        this.parseFaceTextureMappingSection();
        this.parseMidPlatformSection();
        this.parseMapMetadata();
        this.parseVerticesSection();
    }
}