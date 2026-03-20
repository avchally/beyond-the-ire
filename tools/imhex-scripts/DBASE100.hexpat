import std.io;

using InventoryObject;
using ActionChain;
using Action;

struct Header {
    char DBASE100[8];
    u32 file_size;
    u32 unk_0x0C;
    u32 inventory_count;
    u32 inventory_section_offset;
    u32 actions_count;
    u32 actions_section_offset;
    u32 cutscenes_count;
    u32 cutscenes_section_offset;
    u32 interfaces_count;
    u32 interfaces_section_offset;
    u32 unk_0x30;
};

Header header @ 0x00;



// CUTSCENES
struct CutsceneEntry {
    u8 entry[0x14];
};
struct CutsceneSection {
    CutsceneEntry entries[header.cutscenes_count];
};

CutsceneSection cutscene_section @ header.cutscenes_section_offset;


// INTERFACES => DBASE400
struct InterfaceLookupEntry {
    u32 interface_offset; // offset within DBASE400
};
struct InterfacesLookupSection {
    InterfaceLookupEntry entries[header.interfaces_count];
};
InterfacesLookupSection interfaces_lookup_section @ header.interfaces_section_offset;

// INVENTORY
struct InventoryLookupEntry {
    u32 inventory_entry_offset;
    if (inventory_entry_offset != 0x00) {
        InventoryObject object @ inventory_entry_offset;
    }
};
struct InventoryLookupSection {
    InventoryLookupEntry entries[header.inventory_count];
};
InventoryLookupSection inventory_lookup_section @ header.inventory_section_offset;

// ACTIONS
struct ActionLookupEntry {
    u32 action_offset;
    
    ActionChain action_chain @ action_offset;
};
struct ActionsLookupSection {
    ActionLookupEntry entries[header.actions_count];
};
ActionsLookupSection actions_lookup_section @ header.actions_section_offset;

//////////////////////

bitfield ObjectRenderLookup {
    fat_3_index : 9;
    is_ademo : 1;
    padding : 6;
};

struct InventoryObject {
    u16 length;
    ObjectRenderLookup object_render_lookup; // bits 0-8 is the value, bit 9 is whether it's in ADEMO or not
    u8 closeup_type;
    u8 item_type;
    u8 unk_0x06;
    u8 unk_0x07;
    u32 closeup_image_offset; // DBASE300
    u32 inventory_image_offset; // DBASE200
    u32 name_offset; // DBASE400 (84 0D is Monster) EC 0E is bullet
    
    // actions section
    
    
    u24 first_command_length;
    u8 entry_command;
    
    //u8 inventory_actions[length - 24];
    Action inventory_actions[(length - 24) / 4][[single_color]];
};

struct ActionChainTest {
    Action entry_action;
    Action actions[(entry_action.args - 0x04) / 4];
} [[single_color]];

struct ActionChain {
    Action entry_action;
    if (entry_action.command == 0x03) {
        u16 num_remaining = 0;
        if (entry_action.args > 0x00) {
            num_remaining = (entry_action.args / 4) - 1;
        }
        Action actions[num_remaining];
    }
} [[single_color]];

struct Action {
    u24 args;
    u8 command;
};