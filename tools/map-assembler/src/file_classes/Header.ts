import MapDisassembler from "../MapAssembler";

export interface HeaderJSON {
    sectorCount: number;
}
export default class Header {
    verticesOffset: number;
    version: number;
    sectorsOffset: number;
    facesOffset: number;
    faceTextureMapsOffset: number;
    mapMetadataOffset: number;
    verticesOffsetRepeat: number;
    signature: string;
    midPlatformsSection: number;
    section7Size: number;
    verticesSectionSize: number;
    objectsSectionSize: number;
    footerSize: number;
    commandsSectionSize: number;
    sectorCount: number;

    public constructor() {
        this.verticesOffset = 0;
        this.version = 0;
        this.sectorsOffset = 0;
        this.facesOffset = 0;
        this.faceTextureMapsOffset = 0;
        this.mapMetadataOffset = 0;
        this.verticesOffsetRepeat = 0;
        this.signature = "";
        this.midPlatformsSection = 0;
        this.section7Size = 0;
        this.verticesSectionSize = 0;
        this.objectsSectionSize = 0;
        this.footerSize = 0;
        this.commandsSectionSize = 0;
        this.sectorCount = 0;
    }

    public toString(): string {
        return `Header:
        VERTICES_OFFSET: 0x${this.verticesOffset.toString(16).padStart(4, '0')}
        VERSION: 0x${this.version.toString(16).padStart(4, '0')}
        SECTORS_OFFSET: 0x${this.sectorsOffset.toString(16).padStart(4, '0')}
        FACES_OFFSET: 0x${this.facesOffset.toString(16).padStart(4, '0')}
        FACE_TEXTURE_MAPS_OFFSET: 0x${this.faceTextureMapsOffset.toString(16).padStart(4, '0')}
        MAP_METADATA_OFFSET: 0x${this.mapMetadataOffset.toString(16).padStart(4, '0')}
        VERTICES_OFFSET_REPEAT: 0x${this.verticesOffsetRepeat.toString(16).padStart(4, '0')}
        SIGNATURE: "${this.signature}" (0x${this.signature.charCodeAt(0).toString(16)}${this.signature.charCodeAt(1).toString(16)})
        MID_PLATFORMS_SECTION: 0x${this.midPlatformsSection.toString(16).padStart(4, '0')}
        SECTION_7_SIZE: 0x${this.section7Size.toString(16).padStart(4, '0')}
        VERTICES_SECTION_SIZE: 0x${this.verticesSectionSize.toString(16).padStart(4, '0')}
        OBJECTS_SECTION_SIZE: 0x${this.objectsSectionSize.toString(16).padStart(4, '0')}
        FOOTER_SIZE: 0x${this.footerSize.toString(16).padStart(4, '0')}
        COMMANDS_SECTION_SIZE: 0x${this.commandsSectionSize.toString(16).padStart(4, '0')}
        SECTOR_COUNT: 0x${this.sectorCount.toString(16).padStart(4, '0')}`;
    }

    public static toJSON(map: MapDisassembler): HeaderJSON {
        return {
            sectorCount: map.header.sectorCount,
        }
    }
}


