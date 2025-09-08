# .DAS File Format

## Overview

DAS files are texture archives containing collections of textures including floors, ceilings, walls, skyboxes, in-game objects, enemies, projectiles, and items.

The DAS format supports multiple image types, compression schemes, and animation sequences.


## Main Header (68 bytes)

The DAS file header contains metadata about the file structure and offsets to various sections.

| Offset | Size | Field Name | Description |
|--------|------|------------|-------------|
| 0x00 | 4 | DAS_id_str | File signature: "DASP" |
| 0x04 | 2 | DAS_id_num | Always 5 |
| 0x06 | 2 | size_FAT | Total size of both FATs combined |
| 0x08 | 4 | img_FAT_offset | Offset to image FAT (usually 0x44) |
| 0x0C | 4 | palette_offset | Palette offset (0 = use ADEMO.DAS palette) |
| 0x10 | 4 | unk_0x10 | Unknown field |
| 0x14 | 4 | file_names_section | Offset to filename section |
| 0x18 | 2 | file_names_section_size | Size of filename section |
| 0x1A | 2 | unk_0x1C_size | Size of data at unk_0x1C |
| 0x1C | 4 | unk_0x1C | Unknown offset |
| 0x20 | 4 | unk_0x20 | Unknown field |
| 0x24 | 4 | unk_0x24 | Unknown FAT offset |
| 0x28 | 4 | monster_mapping_section | Offset to the section for mapping animations to monsters |
| 0x2C | 4 | monster_mapping_section_size | Size of monster_mapping_section |
| 0x30 | 4 | unk_0x30 | Unknown field |
| 0x34 | 2 | img_FAT_block1_count | Number of entries in primary image FAT |
| 0x36 | 2 | img_FAT_block2_count | Number of entries in secondary image FAT |
| 0x38 | 4 | unk_0x38 | Unknown field |
| 0x3C | 2 | unk_0x38_size | Size related to unk_0x38 |
| 0x3E | 2 | unk_0x40_size | Size related to unk_0x40 |
| 0x40 | 4 | unk_0x40 | Unknown offset |

## FAT Section

| Offset | Size | Field Name | Description |
|--------|------|------------|-------------|
| 0x00 | 4 | image_data_offset | absolute offset to the image header |
| 0x04 | 2 | length_div_2 | byte length divided by 2 |
| 0x06 | 1 | type | Flags or type. (0x24 is monster) |
| 0x07 | 1 | special_info | when type is 0x24, this is the index within the monster mapping section to apply to the object |


## Monster Mapping Section

This section is an array of monster texture mapping entries, which assigns textures to various monster-related states, such as flying, walking, attacking, and dying. A monster texture mapping entry is referred to by its index in this array.

| Offset | Size | Field Name | Description |
|--------|------|------------|-------------|
| 0x00 | 0x68 | monster_mapping_entry_array  | array of monster mapping entries |

#### Monster mapping entry

Each monster state can have a texture/animation assigned to it. Flying, walking, primary attack, secondary attack, and receiving damage are all directional and can have a texture/animation assigned to any of 8 directions.

Notes: 
- If the monster has flying animations assigned, the game automatically makes it able to fly
- Primary and secondary attacks and receiving damage only ever have the "front" position that's differently defined; the other positions are just the walking textures.
- The receiving damage state only randomly occurs when the monster receives damage

| Offset | Size | Field Name | Description |
|--------|------|------------|-------------|
| 0x00 | 4 | unk_0x00               |  |
| 0x04 | 2 | flying_back            | Flying textures |
| 0x06 | 2 | flying_back_right      |  |
| 0x08 | 2 | flying_right           |  |
| 0x0A | 2 | flying_front_right     |  |
| 0x0C | 2 | flying_front           |  |
| 0x0E | 2 | flying_front_left      |  |
| 0x10 | 2 | flying_left            |  |
| 0x12 | 2 | flying_back_left       |  |
| 0x14 | 2 | walking_back           | Walking textures |
| 0x16 | 2 | walking_back_right     |  |
| 0x18 | 2 | walking_right          |  |
| 0x1A | 2 | walking_front_right    |  |
| 0x1C | 2 | walking_front          |  |
| 0x1E | 2 | walking_front_left     |  |
| 0x20 | 2 | walking_left           |  |
| 0x22 | 2 | walking_back_left      |  |
| 0x24 | 2 | attack1_back           | Primary attack textures |
| 0x26 | 2 | attack1_back_right     |  |
| 0x28 | 2 | attack1_right          |  |
| 0x2A | 2 | attack1_front_right    |  |
| 0x2C | 2 | attack1_front          |  |
| 0x2E | 2 | attack1_front_left     |  |
| 0x30 | 2 | attack1_left           |  |
| 0x32 | 2 | attack1_back_left      |  |
| 0x34 | 2 | attack2_back           | Secondary attack textures |
| 0x36 | 2 | attack2_back_right     |  |
| 0x38 | 2 | attack2_right          |  |
| 0x3A | 2 | attack2_front_right    |  |
| 0x3C | 2 | attack2_front          |  |
| 0x3E | 2 | attack2_front_left     |  |
| 0x40 | 2 | attack2_left           |  |
| 0x42 | 2 | attack2_back_left      |  |
| 0x44 | 2 | on_damage_back         | Receiving damage textures (only a small chance) |
| 0x46 | 2 | on_damage_back_right   |  |
| 0x48 | 2 | on_damage_right        |  |
| 0x4A | 2 | on_damage_front_right  |  |
| 0x4C | 2 | on_damage_front        |  |
| 0x4E | 2 | on_damage_front_left   |  |
| 0x50 | 2 | on_damage_left         |  |
| 0x52 | 2 | on_damage_back_left    |  |
| 0x54 | 2 | dying_normal           | Death animation |
| 0x56 | 2 | dead_normal            | Dead texture |
| 0x58 | 2 | dying_crit             | Death by massive damage animation |
| 0x5A | 2 | dead_crit              | Dead texture (when death by massive damage) |
| 0x5C | 2 | spawn                  | Spawn animation |
| 0x5E | 2 | unk_0x5e               |  |
| 0x60 | 4 | unk_0x60               |  |
| 0x64 | 4 | unk_0x64               |  |


## File Names Section

| Offset | Size | Field Name | Description |
|--------|------|------------|-------------|
| 0x00 | 2 | section1_element_count  | Count of the elements in the first section |
| 0x02 | 2 | section2_element_count  | Count of the elements in the section section |
| 0x04 | section1_size | section1_array  | First section of file name elements (empty for ADEMO.DAS) |
| section1_size + 0x04 | section2_size | section2_array | Second section of file name elements |

Each element in both sections are a file name element, which has the following format:

| Offset | Size | Field Name | Description |
|--------|------|------------|-------------|
| 0x00 | 2 | element_size  | Size in bytes of the file name element |
| 0x02 | 2 | index         | The index of the FAT entry to link this file to |
| 0x04 | title_size | title       | Null-terminated ASCII string representing the title of the file |
| 0x04 + title_size | description_size | description | Null-terminated ASCII string represnting the description of the file |