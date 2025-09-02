## Inventory Examples within DBASE100

### Monsters

Here is information about the [Dodger](https://tales-from-the-tower.fandom.com/wiki/Dodger) monster.

Raw bytes:
```
@0x000021e0 in DBASE100.DAT
Basic info:
78 00 0F 03 80 00 00 00 D1 D8 00 00 6F 02 00 00 84 0D 00 00 

INVENTORY_COMMAND_SECTIONS
60 00 00 0A  <= TRIGGER_CODE = 0x0A (AsMonster)
40 1F 00 26  0D 00 00 24  00 01 00 25  13 00 00 2B  | 
C1 00 00 2A  0D 01 00 28  0C 00 00 AB  D8 00 00 AA  | 
0C 01 00 A8  3E 01 00 29  22 01 00 29  26 01 00 29  |--> commands under the 0x0A TRIGGER_CODE
27 01 00 29  24 01 00 A9  25 01 00 A9  D7 00 00 A9  | 
D8 00 00 A9  E1 00 00 31  E1 00 00 B1  22 00 00 A7  | 
22 00 00 A7  FE 00 00 A7  FE 00 00 A7  00 00 00 00  |
```

Here is a breakdown of the data (@ addresses are the addresses within DBASE100.DAT (UK Version 1.4)):

Index: 256 0x0101
Name: Monster
Label: Dodger
Type: 0x00 (generic)
Entry: 0x000021e0
CloseupImg: 0x0000d8d1
InvImg: 0x0000026f
NameOff: 0x00000d84

Inventory Command Section (see [DBASE100_commands](DBASE100_commands.md))

Trigger: 0x0a [AsMonster] section 0x000021f4 len 96
- 0x26 [SetHealthOrHeal] args=0x001f40 (dec 8000) @0x000021f8
- 0x24 [SetMonsterMoveSpeed] args=0x00000d (dec 13) @0x000021fc
- 0x25 [MonsterPathingFlag?] args=0x000100 (dec 256) @0x00002200
- 0x2b [MonsterPrimAttackDelay] args=0x000013 (dec 19) @0x00002204
- 0x2a [MonsterPrimAttackSFX] args=0x0000c1 (dec 193) @0x00002208
- 0x28 [SetMonsterBullet] args=0x00010d (dec 269) @0x0000220c
- 0xab [MonsterSecondAttackDelay] args=0x00000c (dec 12) @0x00002210
- 0xaa [MonsterSecondAttackSFX] args=0x0000d8 (dec 216) @0x00002214
- 0xa8 [SetMonsterSecondaryBullet] args=0x00010c (dec 268) @0x00002218
- 0x29 [MonsterRoamingSFX] args=0x00013e (dec 318) @0x0000221c
- 0x29 [MonsterRoamingSFX] args=0x000122 (dec 290) @0x00002220
- 0x29 [MonsterRoamingSFX] args=0x000126 (dec 294) @0x00002224
- 0x29 [MonsterRoamingSFX] args=0x000127 (dec 295) @0x00002228
- 0xa9 [OnMonsterDamageSFX] args=0x000124 (dec 292) @0x0000222c
- 0xa9 [OnMonsterDamageSFX] args=0x000125 (dec 293) @0x00002230
- 0xa9 [OnMonsterDamageSFX] args=0x0000d7 (dec 215) @0x00002234
- 0xa9 [OnMonsterDamageSFX] args=0x0000d8 (dec 216) @0x00002238
- 0x31 [MonsterDeathSFX] args=0x0000e1 (dec 225) @0x0000223c
- 0xb1 [MonsterCritDeathSFX] args=0x0000e1 (dec 225) @0x00002240
- 0xa7 [BulletVulnerable] args=0x000022 (dec 34) @0x00002244
- 0xa7 [BulletVulnerable] args=0x000022 (dec 34) @0x00002248
- 0xa7 [BulletVulnerable] args=0x0000fe (dec 254) @0x0000224c
- 0xa7 [BulletVulnerable] args=0x0000fe (dec 254) @0x00002250


### Weapons

Here is information about the [Staff](https://tales-from-the-tower.fandom.com/wiki/Creator%27s_Staff).

```
48 00 94 02 50 01 00 00 9B B7 28 00 F4 DC 01 00 7C F3 00 00 


INVENTORY_COMMAND_SECTIONS
08 00 00 04 <= TRIGGER_CODE = 0x04 (OnInspect)
8C F3 00 05  |--> commands under the 0x04 TRIGGER_CODE 

28 00 00 05 <= TRIGGER_CODE = 0x05 (WeaponAction)
04 00 00 33  05 00 00 2D  02 80 00 20  06 00 00 14  | 
0E DD 01 12  05 00 00 18  3B 00 00 13  B0 00 00 19  |--> commands under the 0x05 TRIGGER_CODE 
20 00 00 30  00 00 00 00                            |
```

#### Here is a breakdown of the data (@ addresses are the addresses within DBASE100.DAT (UK Version 1.4)):

Index: 11 0x000c
Name: Staff
Label: (none)
Type: 0x01 (weapon)
Entry: 0x00006638
CloseupImg: 0x0028b79b
InvImg: 0x0001dcf4
NameOff: 0x0000f37c

#### Inventory Command Section (see [DBASE100_commands](DBASE100_commands.md))

Trigger: 0x04 [OnInspect] section 0x0000664c len 8
- 0x05 [Play Audio Dialog] args=0x00f38c (dec 62348) @0x00006650

Trigger: 0x05 [WeaponAction] section 0x00006654 len 40
- 0x33 [WeaponIconUI] args=0x000004 (dec 4) @0x00006658
- 0x2d [?] args=0x000005 (dec 5) @0x0000665c
- 0x20 [WeaponAmmoRecharge] args=0x008002 (dec 32770) @0x00006660
- 0x14 [SetAmmoCap] args=0x000006 (dec 6) @0x00006664
- 0x12 [WeaponAnimation] args=0x01dd0e (dec 122126) @0x00006668
- 0x18 [WeaponBulletDelay] args=0x000005 (dec 5) @0x0000666c
- 0x13 [SetWeaponBullet] args=0x00003b (dec 59) @0x00006670
- 0x19 [Play SFX] args=0x0000b0 (dec 176) @0x00006674
- 0x30 [FlashScreen] args=0x000020 (dec 32) @0x00006678