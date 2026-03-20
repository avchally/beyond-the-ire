import std.mem;
import std.io;
import std.core;

struct RAWHeader {
    u16 section5_offset; // for some reason
    u16 version;
    u16 section1_offset; // sectors (boxes) section
    u16 section2_offset; // faces section
    u16 section3_offset; // edge texturing section (final subsection is for sub sectors (platforms/water/etc)
    u16 section4_offset; // default game settings
    u16 section5_offset_repeat; // contains vertices
    u16 WR;
    u16 field_10; // offset to first element in section 3 end section (or 0 if there is none)
    u16 section7_size; // sfx section
    u16 section5_size; // vertices section
    u16 section8_size; // objects section
    u16 footer_size;
    u16 section6_size; // command section
    u16 section1_elmt_count; // also used to determine object count (section 8)
};
RAWHeader header @ 0x00;

u32 calculated_file_size = header.section5_offset
        + header.section6_size
        + header.section7_size
        + header.section5_size
        + header.section8_size
        + header.footer_size;
        

// SECTION 1 STRUCT
struct Obj_00 {
    //u16 elmt[0x1A / 2];
    s16 ceil_z_pos;     // ceil z position
    s16 floor_z_pos;    // floor z position
    u16 unk_field_04;
    u16 index_texture_up;    // index in das file or palette (when high byte is 0xFF)
    //u8 texture_up_flag;     // FF refers to palette index
    u16 index_texture_down;  // index in das file or palette (when high byte is 0xFF)
    //u8 texture_down_flag;   // FF refers to palette index
    u8 unk_field_0A;    // something to do with scaling or fitting textures to area
    u8 unk_field_0B;    // seems to be related to lighting.. 0x80 is slight shading from distance
    u8 unk_field_0C;    // have only seen 0
    u8 unk_field_0D;    // number of faces (starts at section 2 element offset and counts)
    u16 offset_section_2_elmt;
    s8 unk_field_10;    // texture up shift x
    s8 unk_field_11;    // texture up shift y
    s8 unk_field_12;    // texture down shift x
    s8 unk_field_13;    // texture down shift y
    u16 unk_field_14;   // absolutely no idea
    u16 unk_field_16;   // have only seen 0.. random values seem to do nothing
    u16 unk_field_18;   // offset to section3 end section object. adds an intermediate floor segment (like a platform or water)
    
    u16 section_2_elmt @ offset_section_2_elmt;
    if (unk_field_18 != 0x00) {
        u16 extra_face @ unk_field_18;
    }
    
    /*
    if (index_texture_up == 0x1C && index_texture_down == 0x6E) {
        std::print(offset_section_2_elmt);
    }
    */
};

struct Section1 {
    //u8 section1_val[header.section2_offset - header.section1_offset];
    Obj_00 elements[(header.section2_offset - header.section1_offset) / 0x1A];
    u16 footer_sec2_count;
};
Section1 section1 @ header.section1_offset;


// SECTION 2 STRUCT
// represents a face
struct Obj_01 {
    //u16 elmt[0x0C / 2];
    u16 vertex_01_s5_offset; // vertex_offset relative to header.section5_offset
    u16 vertex_02_s5_offset; // vertex_offset relative to header.section5_offset
    u16 offset_sect3_elmt; // offset to section 3 element
    u16 offset_sect1_elmt; // offset back to section 1 element
    u16 offset_bordering_edge; // offset to a face that's bordering (portal)
    u16 unk_field_0A; // no idea
    
    u16 vertex_01 @ (header.section5_offset + vertex_01_s5_offset);
    u16 vertex_02 @ (header.section5_offset + vertex_02_s5_offset);
    u16 sect1_elmt @ offset_sect1_elmt;
    u16 sect3_elmt @ offset_sect3_elmt;
    if (offset_bordering_edge != 0xFFFF) {
        u16 sister_edge @ offset_bordering_edge;
    } else {
        //std::print("s3 elmt: {:d} || s1 elmt: {:d}", offset_sect3_elmt, offset_sect1_elmt);
    }
    
    //std::print("{:d}\t{:d}\t{:d}", unk_field_00, unk_field_02, offset_sect1_elmt);
};

struct Section2 {
    Obj_01 elements[(header.section3_offset - header.section2_offset) / 0x0C];
    u16 footer;
};
Section2 section2 @ header.section2_offset;


// Section 3 - face texturing
struct Section3_Obj {
    u8 unk_0x00;
    
    // 0x80 adds additional scaling/translation options
    // 0x81, 82, 83 repeats texture extra 1, 2, 3 times
    u8 type;
    
    u16 texture_index;
    u16 upper_texture; // upper texture index (likes being 0xFFFF which is last index in palette)
    u16 lower_texture; // lower texture index (likes being 0xFFFF which is last index in palette)
    u16 unk_0x06; // may refer to some defined texture behavior. 0xAE fits to size
    
    if (
        type >= 0x80 //&& type <= 0x8F
    ) {
        // does not wrap, if even a single pixel is rendered where
        // there is no texture pixel, the entire wall is messed up
        s8 texture_x_translate;
        s8 texture_z_translate;
        
        u16 unk_0x0A;
    }
};

struct Section3_EndSection_Obj {
    u16 texture_index_under; // texture index underside
    s16 height_underside; // height underside
    //u16 unk_0x04;
    s8 shift_lower_texture_x;
    s8 shift_lower_texture_y;
    u16 texture_index_upper; // texture index topside
    s16 height_upperside; // height topside
    // u16 unk_0x0A;
    s8 shift_upper_texture_x;
    s8 shift_upper_texture_y;
    u16 unk_0x0C;
    //u16 obj[0x0E / 2];
};
// [[color("2244FF")]];

struct Section3_EndSection {
    u16 count;
    Section3_EndSection_Obj elements[count];
};

// the object here has variable size. regular size is 0x0A
// if the second byte of the element is 0x8_ it is 0x0E
// the count of elements is taken from the last two bytes of 
// section 2
// there is also an optional end section composed of a count
// and an array of objects
struct Section3 {
    Section3_Obj elements[section2.footer];
    
    if (sizeof(elements) < (header.section4_offset - header.section3_offset)) {
        Section3_EndSection end_section @ header.field_10 - 0x02;
    }
};
Section3 section3 @ header.section3_offset;

// Section 4 - general map information
// player speed, height, climb, and min fit are set for the 
// whole game if game starts with this map
struct Section4 {
    s16 init_x_pos; // starting x_pos
    s16 init_z_pos; // starting z_pos
    s16 init_y_pos; // starting y_pos
    s16 init_rotation; // starting rotation
    u16 move_speed; // movement speed
    u16 height; // player height
    u16 max_climb; // max climb (as in, obstacles taller than this require jumping)
    u16 min_fit_hgt; // min fit height
    u16 unk_0x10; // ??
    s16 candle_glow; // candle glow (higher val is brighter area) (0-32)
    u16 light_ambience; // light ambience (0-2) (candle ambience seems to be missing or not sure how to check)
    u16 unk_0x16; // adds blue shadows with any value other than 0? gamma fix?
    u16 sky_texture; // texture index for skybox
    u16 unk_0x1A;
    //u16 section4_val[(header.section5_offset - header.section4_offset) / 2];
    //u8 elmt1[0x0E];
    //u8 elmt2[0x0E];
} [[color("2244FF")]];
Section4 section4 @ header.section4_offset;




// Section 5 - vertices
struct Section5Header {
    u16 section5_size;
    u16 section5_header_size; // maybe?
    u16 blank;
    u16 section5_elmt_count;
};
Section5Header section5Header @ header.section5_offset;

struct Section5Obj {
    u16 unk_0x00;
    u16 unk_0x02;
    u16 unk_0x04;
    u16 unk_0x06;
    s16 pos_x;
    s16 pos_y;
    //u16 elm[0x06];
} [[single_color]];
struct Section5Elements {
    Section5Obj elements[section5Header.section5_elmt_count];
};
Section5Elements section5Elements @ (header.section5_offset + section5Header.section5_header_size);


// Section 6 - Commands
u32 section6_start = header.section5_offset + section5Header.section5_size;
struct Section6Header {
    u16 magic_3u;
    u16 unknown_0x02;
    u16 commands_start_offset;
    u16 command_index_count; // count of command index/lookup table (including 0x0000 entries)
    
    // command counts
    u16 category_00 [[color("AAAFFF")]];
    u16 cat00_count [[color("AAAFFF")]];
    u16 category_01 [[color("AAAFFF")]];
    u16 cat01_count [[color("AAAFFF")]];
    u16 category_02 [[color("AAAFFF")]];
    u16 cat02_count [[color("AAAFFF")]];
    u16 category_03 [[color("AAAFFF")]];
    u16 cat03_count [[color("AAAFFF")]];
    u16 category_04 [[color("AAAFFF")]];
    u16 cat04_count [[color("AAAFFF")]];
    u16 category_05 [[color("AAAFFF")]];
    u16 cat05_count [[color("AAAFFF")]];
    u16 category_06 [[color("AAAFFF")]];
    u16 cat06_count [[color("AAAFFF")]];
    u16 category_07 [[color("AAAFFF")]];
    u16 cat07_count [[color("AAAFFF")]];
    u16 category_08 [[color("AAAFFF")]];
    u16 cat08_count [[color("AAAFFF")]];
    u16 category_09 [[color("AAAFFF")]];
    u16 cat09_count [[color("AAAFFF")]];
    u16 category_10 [[color("AAAFFF")]];
    u16 cat10_count [[color("AAAFFF")]];
    u16 category_11 [[color("AAAFFF")]];
    u16 cat11_count [[color("AAAFFF")]];
    u16 category_12 [[color("AAAFFF")]];
    u16 cat12_count [[color("AAAFFF")]];
    u16 category_13 [[color("AAAFFF")]];
    u16 cat13_count [[color("AAAFFF")]];
    u16 category_14 [[color("AAAFFF")]];
    u16 cat14_count [[color("AAAFFF")]];
    // the remaining seems to be categorizing the commands and giving a count of each type
};
Section6Header section6Header @ section6_start;
u16 section6_header_size = 0x44;

u16 commandIndexCount = section6Header.cat00_count
    + section6Header.cat01_count
    + section6Header.cat02_count
    + section6Header.cat03_count
    + section6Header.cat04_count
    + section6Header.cat05_count
    + section6Header.cat06_count
    + section6Header.cat07_count
    + section6Header.cat08_count
    + section6Header.cat09_count
    + section6Header.cat10_count
    + section6Header.cat11_count
    + section6Header.cat12_count
    + section6Header.cat13_count
    + section6Header.cat14_count;
struct Section6CommandsIndex {
    u16 elements[commandIndexCount];
};
//Section6CommandsIndex section6CommandsIndex @ (section6_start + section6Header.section6_header_size);
//u16 section6CommandsIndex[commandIndexCount] @ (section6_start + section6Header.section6_header_size);

u16 section6IndexFullSize = section6Header.commands_start_offset - section6_header_size;
u16 section6TotalCommandCount = section6IndexFullSize / 0x02;

struct Section6Command {
    u16 size;
    u8 unknown_0x02;
    u8 command_type;
    u16 next_command;
    u16 args[(size) / 2 - 3];
    //u16 remainder[(size) / 2 - 3];
} [[single_color]];

struct Section6CommandIndexElement {
    u16 offset;
    Section6Command command @ (section6_start + offset);
};


// command index/lookup table
// this is an array of offsets to commands that can be directly called by 
// an object interaction. 
// the length of the array is the same number of commands there are, but most
// entries will likely be 0x0000 because most commands are part of a chain
Section6CommandIndexElement section6CommandsIndex[commandIndexCount] @ (section6_start + section6_header_size);
u16 section6IndexFull[section6TotalCommandCount] @ (section6_start + section6_header_size);

Section6Command allCommands[while(std::core::array_index() + 1 < section6TotalCommandCount)] @ (section6_start + section6Header.commands_start_offset);


// Section 7 - SFX
struct Section7aObject {
    s16 pos_x;
    s16 pos_y;
    u16 sfx_index; // index number to the sfx to play
    u16 sfx_id; // for triggering from commands
    u8 unk_0x08; // cuts out some portion of the sfx (81 00 is regular, C3 1C plays portion sporadically, 01 00 command activated)
    u8 bound_box_index;
    u16 audible_radius; // distance from node where sfx will be no longer audible
    u16 unk_0x0C; // 0x3C ?
    u16 unk_0x0E; // 0 ?
    u8 volume;  
    u8 unk_0x11; // padding?
    //u16 unk_0x00[0x12 / 2];
    //u16 elements[(section7a_size / 2) - 1];
};

struct Section7bObject {
    u16 box_count;
    u16 unk_0x02;
    s16 x_bound_lower_01;
    s16 y_bound_lower_01;
    s16 x_bound_upper_01;
    s16 y_bound_upper_01;
    u16 unk_0x0C;
    s16 x_bound_lower_02;
    s16 y_bound_lower_02;
    s16 x_bound_upper_02;
    s16 y_bound_upper_02;
    u16 unk_0x16;
    s16 x_bound_lower_03;
    s16 y_bound_lower_03;
    s16 x_bound_upper_03;
    s16 y_bound_upper_03;
};

u32 section7_start = section6_start + header.section6_size;
struct Section7 {
    u16 section7a_size;
    u16 section7a_count;
    Section7aObject section7a_elements[((section7a_size - 0x04) / 0x12)];
    //Section7aObject section7a_elements[(section7a_size / 2) - 1];
    //u16 section7b[(header.section7_size - section7a_size) / 2];
    Section7bObject section7b_elements[(header.section7_size - section7a_size) / 0x20];
};
Section7 section7 @ section7_start;



// section 8 - objects
//
// first subsection is an array of elements the same size of
// the number of sectors (section 1)
// if the sector does not contain an object, the value in the array is 0x0000
// if it does, the value is the relative section start offset to subsection 2
//
// second subsection is object rendering/placement data
// the first byte in the entry is repeated and
//  represents how many objects the segment contains
// 
/*
    x_pos, 
    y_pos, 
    index_of_object_texture (different than face textures) (0x07 is clock hand, not found in rips)
        if index here is 0x0037 it looks for the 0x37 index in the second grouping
        in the das file. For DEMO2.DAS, 0x37 is at index 0x3710, the 0x10 seems to
        represent the grouping
    
*/

u32 section8_start = section7_start + header.section7_size;
/*
struct Section8_Object {
    u16 unk_0x00;
    s16 unk_0x02; // x_pos
    s16 unk_0x04; // y_pos
    u16 unk_0x06; // index to texture in second grouping in DAS file
    u16 unk_0x08;
    u16 unk_0x0A;
    u16 unk_0x0C;
    u16 unk_0x0E;
    u16 unk_0x10;
};
*/

struct S8_2_Obj_Entry {
    s16 x_pos; // x_pos
    s16 y_pos; // y_pos
    u8 texture_index; // index to texture in second grouping in DAS file
    u8 texture_lookup; // 00 = associated das file; 02 = ademo.das;
    u8 rotation;
    u8 flag; // only include if given flag is set (doesn't completely track, but it's close...)
    u8 brightness; // applies ambient lighting/shade. lower = darker (0x00 or 0x80 seems default?) (doesn't start until like 0x6~)
    u8 render_type; // texture constantly facing you (0x00) or flat (0x80) TODO see what other values are used
    s16 z_pos; // z_pos (height)
    u16 unk_0x0C;
    u16 unk_0x0E; // influences interactability and a command
};

struct Section8_2_Object {
    u8 entry_count; // how many records of data
    u8 entry_count_repeat; // seems to be a repeat of first byte
    S8_2_Obj_Entry entries[entry_count];
}  [[single_color]];

struct Section8_1_Element {
    u16 offset_to_object_data; // only != 0x0000
    if (offset_to_object_data != 0x0000) {
        Section8_2_Object object @ (section8_start + offset_to_object_data);
    }
};

struct Section8 {
    u16 section8_size;
    Section8_1_Element sub1_elements[header.section1_elmt_count];
    //u16 section8_remainder[(section8_size / 2) - 1];
};
Section8 section8 @ section8_start;

u32 footer_start = section8_start + header.section8_size;
struct Footer {
    u16 footer_size;
    u16 footer_remainder[(footer_size / 2) - 1];
};
Footer footer @ footer_start;



// search commands for given type
std::print("Search command results:");
u8 command_type = 0x00;
u16 next_command = 0x66;
for (u16 i = 0, i < section6TotalCommandCount, i += 1) {
    if (allCommands[i].command_type == command_type || allCommands[i].next_command == next_command) {
        str printString = std::format("i: {}\tcommand: {:#4x}\tnext: {}\targs:", i, allCommands[i].command_type, allCommands[i].next_command);
        for (u16 j = 0, j < ((allCommands[i].size / 0x02) - 3), j += 1) {
            printString += std::format(" {:#06x}", allCommands[i].args[j]);
        }
        std::print(printString);
    }
}


std::print("File size: {:#x}", calculated_file_size);
std::print("File size: {:d}", calculated_file_size);


/*
std::print("i\tceil_z_pos\tfloor_z_pos\tunk_field_04\tindex_texture_up\tindex_texture_down\tunk_field_0A\tunk_field_0C\tunk_field_0D\toffset_2_obj_XX\tunk_field_10\tunk_field_12\tunk_field_14\tunk_field_16\tunk_field_18\t");
for (u8 i = 0, i < 134, i += 1) {
    if (
        section1.elements[i].index_texture_up == 0x0AC9
        && section1.elements[i].index_texture_down != 0x0AC9
    ) {
    
        //std::print("{:d}",
        std::print("{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}\t{:d}", 
            i,
            section1.elements[i].ceil_z_pos,
            section1.elements[i].floor_z_pos,
            section1.elements[i].unk_field_04,
            section1.elements[i].index_texture_up,
            //section1.elements[i].texture_up_flag,
            section1.elements[i].index_texture_down,
            //section1.elements[i].texture_down_flag,
            section1.elements[i].unk_field_0A,
            section1.elements[i].unk_field_0C,
            section1.elements[i].unk_field_0D,
            section1.elements[i].offset_section_2_elmt,
            section1.elements[i].unk_field_10,
            section1.elements[i].unk_field_12,
            section1.elements[i].unk_field_14,
            section1.elements[i].unk_field_16,
            section1.elements[i].unk_field_18
        );
    }
}
*/