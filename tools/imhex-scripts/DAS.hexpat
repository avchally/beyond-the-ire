// =============================================================================
// Realms of the Haunting — .DAS File Format Pattern
// =============================================================================

#pragma loop_limit 16384
#include <type/color.pat>
import std.string;
import std.io;
import std.mem;


// =============================================================================
// ENUMS
// =============================================================================

enum ImageType : u8 {
    // Plain uncompressed (even values)
    PLAIN_DATA_9        = 0x00,
    PLAIN_DATA          = 0x02,
    PLAIN_DATA_4        = 0x04,
    PLAIN_DATA_6        = 0x06,
    PLAIN_DATA_7        = 0x0A,
    PLAIN_DATA_8        = 0x0C,
    PLAIN_DATA_FLIPPED  = 0x10,
    PLAIN_DATA_FLIPPED_2= 0x12,
    PLAIN_DATA_FLIPPED_3= 0x14,
    PLAIN_DATA_3        = 0x18,
    PLAIN_DATA_2        = 0x1A,
    PLAIN_DATA_5        = 0x1C,
    PLAIN_DATA_FLIPPED_4= 0x30,

    // Compressed (odd values)
    COMPRESSED_6        = 0x03,
    COMPRESSED          = 0x11,
    COMPRESSED_2        = 0x13,
    COMPRESSED_4        = 0x17,
    COMPRESSED_3        = 0x31,
    COMPRESSED_5        = 0x33,

    // Special
    OBJECT_3D           = 0x80,
};


// =============================================================================
// HEADER (68 bytes, offset 0x00)
// =============================================================================

struct DASHeader {
    char    signature[4];               // 0x00: "DASP"
    u16     version;                    // 0x04: Always 5
    u16     size_FAT;                   // 0x06: Total size of both FAT blocks combined
    u32     img_FAT_offset;             // 0x08: Offset to image FAT (usually 0x44)
    u32     palette_offset;             // 0x0C: Palette offset (0 = use ADEMO.DAS)
    u32     unk_0x10_offset;            // 0x10: Unknown optional offset
    u32     file_names_offset;          // 0x14: Offset to filename block
    u16     file_names_size;            // 0x18: Size of filename block in bytes
    u16     unk_0x1C_size;              // 0x1A: Size of data at unk_0x1C_offset
    u32     unk_0x1C_offset;            // 0x1C: Unknown offset
    u32     unk_0x20;                   // 0x20: Unknown
    u32     object_collision_section_offset;            // 0x24: gives objects a collision box (size = fat_block_3_count * 4)
    u32     monster_mapping_offset;     // 0x28: Monster animation mapping section
    u32     monster_mapping_size;       // 0x2C: Size of monster mapping section
    u16     fat_block_1_count;          // 0x30: Number of entries in the first FAT page/block (wall/floor textures)
    u16     fat_block_2_count;          // 0x32: Number of entries in the second FAT page/block (always empty?)
    u16     fat_block_3_count;          // 0x34: Number of entries in the third FAT page/block (object-mappable textures/data)
    u16     fat_block_4_count;          // 0x36: Number of entries in the fourth FAT page/block (directional billboard sprites)
    u32     unk_0x38_offset;            // 0x38: Unknown offset
    u16     unk_0x38_size;              // 0x3C: Size related to unk_0x38
    u16     unk_0x40_size;              // 0x3E: Size related to unk_0x40
    u32     unk_0x40_offset;            // 0x40: Unknown offset
};

DASHeader header @ 0x00;

// =============================================================================
// PALETTE (768 bytes — 256 × RGB, 6-bit per channel)
// =============================================================================
// Conversion to 8-bit: (value * 259 + 33) >> 6
// For ImHex color display we approximate with value * 4.

using Palette;
using PaletteRemapTable;
struct PaletteSystemSection {
    if (header.palette_offset > 0 && header.palette_offset + 768 <= std::mem::size()) {
        Palette palette;
        u16 starting; // either this or ending
        PaletteRemapTable remap_tables[322];
        //u16 ending; // either this or starting
    }
};

struct PaletteRemapTable {
    u8 data[256];
};


struct PaletteColor {
    u8 r;   // 6-bit (0-63)
    u8 g;   // 6-bit (0-63)
    u8 b;   // 6-bit (0-63)
} [[color(std::format("{:02X}{:02X}{:02X}", r * 4, g * 4, b * 4))]];

struct Palette {
    if (header.palette_offset > 0 && header.palette_offset + 768 <= std::mem::size()) {
        PaletteColor colors[256];
    }
};

PaletteSystemSection palette_system @ header.palette_offset;


// =============================================================================
// IMAGE FAT (File Allocation Table)
// =============================================================================
// Each entry is 8 bytes. Located at header.img_FAT_offset.
// Total entries = size_FAT / 8  (or img_FAT_count_1 + img_FAT_count_2)

bitfield FATTypeFlags {
    padding     : 1;    // bit 0
    is_sky      : 1;    // bit 1: sky texture
    padding     : 2;    // bits 2-3
    pin_ceiling : 1;    // bit 4: pin sprite to ceiling
    is_folder   : 1;    // bit 5: folder/directory type
    padding     : 2;    // bits 6-7
};

using ImgFATData;
struct ImgFATEntry {
    u32     data_offset;        // 0x00: Absolute offset to image data
    u16     data_size_half;     // 0x04: Data byte length / 2
    u8      flag_1;         // 0x06: Type/flags (0x24 = monster)
    u8      flag_2;       // 0x07: Monster mapping index when type_flags=0x24
    if (flag_1 != 0x20 && flag_1 != 0x24 && data_size_half != 0x00) {
        ImgFATData img_fat_data @ data_offset;
    } else if (flag_1 == 0x20) {
        u8 non_img_fat_data[data_size_half * 2] @ data_offset; 
    }
};


// Compute total FAT entry count
u32 fat_entry_count = header.size_FAT / 8;

struct ImgFATBlock {
    ImgFATEntry entries[fat_entry_count];
};

ImgFATBlock img_fat @ header.img_FAT_offset;


///////////////////
// Image FAT Data
///////////////////
using ImgFATDataPlain;
using ImgFATDataCompressed;
using ImgFATDataFolder;
using ImgFATData3D;
using ImgFatData3DBillboard;
struct ImgFATData {
    u64 base = addressof(this);
    
    u8  block_type_mod;
    u8  block_type;
    
    if (block_type < 0x40) {
        if (block_type & 1) {
            ImgFATDataCompressed img_data_compressed;   // odd
        } else {
            ImgFATDataPlain img_data_plain;             // even
        }
    } else if (block_type == 0x80) {
        ImgFATData3D img_data_3d;
    } else if (block_type_mod >= 0xc0) {
        ImgFatData3DBillboard img_data_3d_billboard;
    } else if (block_type_mod == 0x40) {
        ImgFATDataFolder img_data_folder;
    } else if (base != 0) {
        std::print("Unknown block at 0x{:X} (block_type_mod=0x{:02X}, block_type=0x{:02X})", base, block_type_mod, block_type);
    }
};

struct ImgFATDataPlain {
    u16 width;
    u16 height;
    if (width * height < 0x1FF * 0x1FF) {
        u8  pixel_data[width * height];
    }
};

struct ImgFATDataFolder {
    u64 base = addressof(this) - 2;
    
    u16 max_width;
    u16 max_height;
    u16 unk_01;
    u16 shifted_img_offsets[1]; // array of offsets that need to be << 4 to get the offset from data block start
    
    u48 first_image @ (base + (shifted_img_offsets[0] << 4));
};

using DeltaFrameElementReference;
struct ImgFATDataCompressed {
    u64 base = addressof(this) - 2;
    
    u16 buffer_width;
    u16 buffer_height;
    u32 total_block_size;
    u16 first_img_offset; // stored as plain image data
    u16 num_delta_frames; 
    
    //std::print("size: 0x{:X}, num_delta_frames: 0x{:X}", total_block_size, num_delta_frames);

    if (num_delta_frames != 0xFFFE) {
        u32 unk_01;
        DeltaFrameElementReference delta_frame_offsets[num_delta_frames];
    
        ImgFATDataPlain first_img_data @ (base + first_img_offset + 2);
    }
};

using DeltaFrame;
struct DeltaFrameElementReference {
    //u64 base = addressof(this);
    u32 delta_frame_offset;
    
    //DeltaFrame delta_frame @ (base + delta_frame_offset);
};

struct DeltaFrame {
    
};


using Img3DBillboard;
struct ImgFatData3DBillboard {
    u64 base = addressof(this) - 2;
    
    u16 max_width;
    u16 max_height;
    
    //u8  remaining_header[24];
    
    u16 unk1;
    u16 pos_1_img_ref; // bit 15 is mirror flip, bits 0-14 shifted left 4 bits are offset to image (ref & 0x7FFF) << 4
    u16 pos_2_img_ref;
    u16 pos_3_img_ref;
    u16 pos_4_img_ref;
    u16 pos_5_img_ref;
    u16 pos_6_img_ref;
    u16 pos_7_img_ref;
    u16 pos_8_img_ref;
    u16 unk2;
    u32 unk_padding;
    
    Img3DBillboard img_1 @ (base + ((pos_1_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_2 @ (base + ((pos_2_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_3 @ (base + ((pos_3_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_4 @ (base + ((pos_4_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_5 @ (base + ((pos_5_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_6 @ (base + ((pos_6_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_7 @ (base + ((pos_7_img_ref & 0x7FFF) << 4));
    Img3DBillboard img_8 @ (base + ((pos_8_img_ref & 0x7FFF) << 4));
};

struct Img3DBillboard {
    u16 img_flags;
    u16 img_width;
    u16 img_height;
    if (img_width * img_height < 0x1FF * 0x1FF) {
        u8  pixel_data[img_width * img_height];
    }
};


// Image types
using Img3dVertex;
using Img3dFaceData;
struct ImgFATData3D {
   // no 0x00, because that would be the img_type contained in ImgFATData
   u16  max_bound_x;
   u16  max_bound_y;
   u16  unk_0x06; // only ever 0x08
   u16  unk_0x08;
   u32  unk_0x0A; // only ever 0x1E
   // u16  unk_0x0C;
   u16  max_bound_z;
   u32  unk_0x10; // only ever 0x00
   // u16  unk_0x12;
   
   u16  vertex_count;
   Img3dVertex vertex_3d[vertex_count];
   
   u32  version;
   u16  version_padding;
   
   u16  face_mapping_section_size; // big-endian

   if (face_mapping_section_size == 0xC405) {
       Img3dFaceData img_face_data[24]; // custom for rchair
   } else {
       Img3dFaceData img_face_data[4]; // 4 is just a placeholder I used for testing, it's actually a variable amount until the calculated end of the section
   }
};

struct Img3dVertex {
    s16 pos_x;
    s16 pos_y; // maybe z
    s16 pos_z; // maybe y
    u32 unk_0x06; // padding?
    u32 unk_0x0A; // padding?
    u16 unk_0x0E; // padding?
};

struct Img3dFaceData {
    u16 face_data_size;
    u48 unk_0x02; // only 0x00
    u16 unk_0x08; // 0x00 0x08 or 0x0E
    u16 unk_0x0A;
    u16 texture_lookup;
    u16 unk_0x0E; // only 0x00 or 0x80
    u48 unk_0x10; // 0?
    //u16 unk_0x12; // 0?
    //u16 unk_0x14; // 0?
    u8  render_type; // bit flags (bit 0 = transparency, 1 = mirror (y-axis), 2 = mirror (x-axis, floor only), 3 = visible, 4 = ?, 5 = render like floor, 6 = ?, 7 = ?
    u8  addt_render_flag; // unknown
    u32 unk_18; // 0?
    u8  sub_texture_index; // which image in the texture folder to display
    u8  unk_1D;
    u8  unk_1E;
    u8  unk_1F;
    u32 unk_20; // 3-4 FF bytes
    u16 unk_24;
    u16 unk_26;
    u32 unk_28; // 0?
    u32 unk_2C; // 0?
    u16 unk_30; // flag? mostly 0x0020
    u16 unk_32; 
    u16 edge_count; // count of number of edges to make the face. the follow array are the points which must make a closed shape, resulting in # edges + 1
    u16 edge_array[edge_count + 1] [[single_color]]; // the vertex is a little weird, appears to be encoded << 4 (so referencing index 1 is actually 10 not 01)
    
    //u16 attribute[face_data_size / 2 - 1];
};
//} [[single_color]];


// =============================================================================
// IMAGE DATA HEADER (6 bytes, at each FAT entry's data_offset)
// =============================================================================

bitfield ImgUnkFlags {
    padding     : 5;    // bits 0-4
    is_folder   : 1;    // bit 5: folder type (from FAT)
    is_3d_obj   : 1;    // bit 6: 0x40 = 3D textured object
    half_size   : 1;    // bit 7: half-size sprite
};

struct ImgDataHeader {
    u8          unk_flags;      // 0x00: Orientation/transform flags (0x40 = 3D obj, >0xC0 = multi-img)
    ImageType   image_type;     // 0x01: Image format type
    u16         width;          // 0x02: Image width in pixels
    u16         height;         // 0x04: Image height in pixels
};


// =============================================================================
// COMPRESSION HEADERS
// =============================================================================

// Type 1 compression header (follows 6-byte ImgDataHeader for compressed types)
struct CompressedType1Header {
    u16     block_size;         // 0x00: Block size
    u16     unk;                // 0x02: Unknown
    u16     first_img_offset;   // 0x04: Offset to first image (relative to ImgDataHeader start + 6)
    u16     frame_count;        // 0x06: Number of delta frames (0xFFFE = use Type 2 instead)
    u16     unk2;               // 0x08: Unknown
    u16     unk3;               // 0x0A: Unknown
};

// Type 2 compression sub-image header (24 bytes)
struct CompressedType2SubHeader {
    u16     sub_img_id;         // 0x00: Always 0x17
    u16     unk;                // 0x02: Always 0
    u16     buf_width;          // 0x04: Buffer width
    u16     buf_height;         // 0x06: Buffer height
    u16     num_imgs;           // 0x08: Number of sub-images
    u16     curr_img_idx;       // 0x0A: Current image index
    u32     curr_img_size;      // 0x0C: Size including this header
    u16     unk2;               // 0x10: Unknown
    u16     width;              // 0x12: Actual image width
    u16     unk4;               // 0x14: Unknown
    u16     height;             // 0x16: Actual image height
};


// =============================================================================
// 3D OBJECT SUB-IMAGE HEADER (6 bytes, before each sub-image's pixel data)
// =============================================================================

struct SubImageHeader {
    u8      img_reference;      // Purpose unknown — may indicate angle/direction
    u8      sub_type;           // Purpose unknown — may indicate rendering mode
    u16     width;              // Sub-image width
    u16     height;             // Sub-image height
};


// =============================================================================
// FILENAME BLOCK
// =============================================================================
// Two groups of named entries that map human-readable names to FAT indices.
// Located at header.file_names_offset.

struct FileNameEntry {
    u16     entry_size;         // Total size of this entry in bytes
    u16     fat_index;          // Index into the FAT
    std::string::NullString title;
    std::string::NullString description;
};

struct FileNamesBlock {
    u16     group1_count;       // Number of entries in group 1
    u16     group2_count;       // Number of entries in group 2
    // Only parse the variable-length entry arrays when the offset is valid.
    // When file_names_offset is 0 the counts above will be garbage from the
    // header area, but the arrays won't be parsed, and console code checks
    // header.file_names_offset > 0 before iterating.
    if (header.file_names_offset > 0 && header.file_names_size > 0) {
        FileNameEntry group1[group1_count];
        FileNameEntry group2[group2_count];
    }
};

// Always placed so the variable is in scope for console output code.
FileNamesBlock file_names @ header.file_names_offset;


// =============================================================================
// MONSTER MAPPING SECTION (0x68 bytes per entry)
// =============================================================================
// Each entry maps directional textures/animations to a monster.
// Referenced by FAT entries with type_flags == 0x24 via special_info index.
//
// Directional states use 8 directions:
//   back, back_right, right, front_right, front, front_left, left, back_left

struct MonsterMappingEntry {
    u32     unk_0x00;                   // 0x00: Unknown (4 bytes)

    // Flying textures (8 directions) — FAT indices
    u16     flying_back;                // 0x04
    u16     flying_back_right;          // 0x06
    u16     flying_right;               // 0x08
    u16     flying_front_right;         // 0x0A
    u16     flying_front;               // 0x0C
    u16     flying_front_left;          // 0x0E
    u16     flying_left;                // 0x10
    u16     flying_back_left;           // 0x12

    // Walking textures (8 directions)
    u16     walking_back;               // 0x14
    u16     walking_back_right;         // 0x16
    u16     walking_right;              // 0x18
    u16     walking_front_right;        // 0x1A
    u16     walking_front;              // 0x1C
    u16     walking_front_left;         // 0x1E
    u16     walking_left;               // 0x20
    u16     walking_back_left;          // 0x22

    // Primary attack textures (8 directions)
    u16     attack1_back;               // 0x24
    u16     attack1_back_right;         // 0x26
    u16     attack1_right;              // 0x28
    u16     attack1_front_right;        // 0x2A
    u16     attack1_front;              // 0x2C
    u16     attack1_front_left;         // 0x2E
    u16     attack1_left;               // 0x30
    u16     attack1_back_left;          // 0x32

    // Secondary attack textures (8 directions)
    u16     attack2_back;               // 0x34
    u16     attack2_back_right;         // 0x36
    u16     attack2_right;              // 0x38
    u16     attack2_front_right;        // 0x3A
    u16     attack2_front;              // 0x3C
    u16     attack2_front_left;         // 0x3E
    u16     attack2_left;               // 0x40
    u16     attack2_back_left;          // 0x42

    // Receiving damage textures (8 directions, only randomly triggered)
    u16     on_damage_back;             // 0x44
    u16     on_damage_back_right;       // 0x46
    u16     on_damage_right;            // 0x48
    u16     on_damage_front_right;      // 0x4A
    u16     on_damage_front;            // 0x4C
    u16     on_damage_front_left;       // 0x4E
    u16     on_damage_left;             // 0x50
    u16     on_damage_back_left;        // 0x52

    // Death & spawn
    u16     dying_normal;               // 0x54: Normal death animation
    u16     dead_normal;                // 0x56: Normal dead texture
    u16     dying_crit;                 // 0x58: Critical/massive damage death
    u16     dead_crit;                  // 0x5A: Critical dead texture
    u16     spawn;                      // 0x5C: Spawn animation

    // Unknown trailing fields
    u16     unk_0x5E;                   // 0x5E
    u32     unk_0x60;                   // 0x60
    u32     unk_0x64;                   // 0x64
};

using MonsterMappingEntry;
struct MonsterMappingSection {
    if (header.monster_mapping_offset > 0 && header.monster_mapping_size >= 0x68) {
        u32 monster_entry_count = header.monster_mapping_size / 0x68;
        MonsterMappingEntry monster_mapping[monster_entry_count];
    }
};

MonsterMappingSection monster_mapping_section @ header.monster_mapping_offset;

// if (header.monster_mapping_offset > 0 && header.monster_mapping_size >= 0x68) {
//     u32 monster_entry_count = header.monster_mapping_size / 0x68;
//     MonsterMappingEntry monster_mapping[monster_entry_count] @ header.monster_mapping_offset;
// }


// =============================================================================
// AUXILIARY / UNKNOWN SECTIONS
// =============================================================================
// These sections are referenced by header fields but their full purpose is
// not yet understood. We parse them as raw u16 arrays for inspection.

using Unk0x10Object;
struct UnkSection0x10 {
    if (header.unk_0x10_offset != 0 && header.unk_0x10_offset < std::mem::size()) {
        Unk0x10Object objects[256];   // Minimal — true layout unknown
    }
};
struct Unk0x10Object {
    u8 data[16];
};

using DirObjMap;
struct DirObjMapSection {
    if (header.unk_0x1C_offset != 0 && header.unk_0x1C_size > 0) {
        u16 dir_obj_data[header.unk_0x1C_size / 2];
        // DirObjMap data[header.unk_0x1C_size / 2];
        
    }
};

struct DirObjMap {
    u16 temp = addressof(this);
    if (temp == 0x8010)
        break;
    
    u16 dir_obj_offset;
    //std::print(addressof(parent));
};

struct ObjectCollisionEntry {
    u16 height;
    u16 width;  // (both x and y directions)
} [[single_color]];

struct ObjectCollisionSection {
    if (header.object_collision_section_offset != 0 && header.fat_block_3_count > 0) {
        ObjectCollisionEntry object_collision_entries[header.fat_block_3_count];
    }
};

struct UnkSection0x38 {
    if (header.unk_0x38_offset != 0 && header.unk_0x38_size > 0) {
        u16 data[header.unk_0x38_size / 2];
    }
};

struct UnkSection0x40 {
    if (header.unk_0x40_offset != 0 && header.unk_0x40_size > 0) {
        u16 data[header.unk_0x40_size / 2];
    }
};

UnkSection0x10 unk_section_0x10 @ header.unk_0x10_offset;
DirObjMapSection dir_object_map_section @ header.unk_0x1C_offset;
ObjectCollisionSection object_collision_section @ header.object_collision_section_offset;
UnkSection0x38 unk_section_0x38 @ header.unk_0x38_offset;
UnkSection0x40 unk_section_0x40 @ header.unk_0x40_offset;