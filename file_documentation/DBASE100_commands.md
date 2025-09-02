## DBASE100 Commands

Here is an ongoing list of commands/actions/opcodes found in the action chain section of DBASE100 as well as in the inventory item definitions.

| Code | Total Count | Label                       | Description |
|------|-------------|-----------------------------------|-------|
| 0x00 (0)    |             | InventoryDocumentImage            | for notes/maps/etc, the image to show after initial animation
| 0x01 (1)    | 360         | If flag set, continue             | Flag
| 0x02 (2)    | 16          | If has item, continue             | Item index
| 0x04 (4)    | 239         | Set flag                          | Flag 
| 0x05 (5)    | 1088        | Play Audio Dialog                 | DBASE400 offset
| 0x07 (7)    | 183         | Play Video                        | Cutscene index from DBASE100
| 0x08 (8)    | 102         | Choice String                     | DBASE400 offset
| 0x09 (9)    | 102         | Start Choice                      | Always 16777215 (0xFFFFFF)
| 0x0A (10)   | 102         | End Choice                        | Always 16777215 (0xFFFFFF)
| 0x0B (11)   | 31          | Start Random                      | Always 16777215 (0xFFFFFF)
| 0x0C (12)   | 31          | End Random                        | Always 16777215 (0xFFFFFF) 
| 0x0D (13)   | 147         | If flag set, then next command    | Flag
| 0x0E (14)   | 1           | Displays Texture                  | DBase300 Offset / 8
| 0x11 (17)   | 52          | Give item                         | Item index
| 0x12 (18)   |             | WeaponAnimation                   | The passive and attacking weapon animation. Offset to the animation
| 0x13 (19)   |             | SetWeaponBullet                   | the item ID of the bullet to associate with a weapon
| 0x14 (20)   |             | SetAmmoCap                        | sets the max ammo before the weapon needs to be reloaded
| 0x15 (21)   |             | MaxDamage                         | For bullet, the max damage it will do (anywhere from 0.5x - 1.0x)
| 0x16 (22)   |             | TravelSpeed                       | For bullet, the speed it travels at
| 0x17 (23)   |             | BulletHitAnimation                | For bullet, the texture to change to upon impact (index? but doesn't appear in DEMO.DAS or ADEMO.DAS)
| 0x18 (24)   |             | WeaponBulletDelay                 | For weapon, the delay after firing to spawn the bullet object
| 0x19 (25)   | 7           | Play SFX                          | Index from FXSCRIPT.SFX
| 0x1A (26)   | 23          | Change Music                      | DBase400 Offset / 8
| 0x1C (28)   | 2           | ?                                 | Always 16777215 (0xFFFFFF)
| 0x1D (29)   | 127         | Jump to different command         | DBASE100 command index
| 0x20 (32)   |             | WeaponAmmoRecharge                | the inventory index of the ammo refill. when second byte is 80, it's a rechargeable weapon and the first byte represents ammo recharge rate
| 0x23 (35)   | 5           | Map Command Index Callback        | Performs a script from the current .RAW map file. value is the command index
| 0x24 (36)   |             | SetMonsterMoveSpeed               | Set the move speed of a monster
| 0x25 (37)   |             | MonsterPathingFlag?               | Slightly influencing a monster's movement/pathing
| 0x26 (38)   | 10          | SetHealthOrHeal                   | Initializes max health of a monster or heals by value
| 0x27 (39)   |             | BulletResistance                  | For a monster, sets the resistance against a bullet by index (bullet does no damage)
| 0x28 (40)   |             | SetMonsterBullet                  | sets the bullet for a monster's primary attack
| 0x29 (41)   |             | MonsterRoamingSFX                 | sets the sound effect to play during monster roam (multiple can be set with multiple calls)
| 0x2A (42)   |             | MonsterPrimAttackSFX              | sets the sound effect to play when monster makes its primary attack
| 0x2B (43)   |             | MonsterPrimAttackDelay            | the delay to spawn the bullet for an monster's primary attack
| 0x2C (44)   |             | WeaponAnimationSpeed              | for a weapon, modifies the animation play speed (directly impacts fire rate)
| 0x2D (45)   | 55          | ?                                 | Only 1,4, or 7 (also used when initializing: weapons = 0x05, monsters = 0x02 or 0x03)
| 0x30 (48)   |             | FlashScreen                       | Flashes the environment. First darkness then brightness. Value is the intensity
| 0x31 (49)   |             | MonsterDeathSFX                   | the sound effect to play when the monster dies (but not critically dies, see 0xB1)
| 0x32 (50)   |             | MonsterSpawnSFX                   | the sound effect to play when the monster spawns
| 0x33 (51)   |             | WeaponIconUI                      | Which icon to display on screen for an equipped weapon (0x0A is unused Mace)
| 0x36 (54)   | 39          | Map Command ID Callback           | Map Command ID
| 0x81 (129)  | 82          | If not flag set, continue         | Flag
| 0x82 (130)  | 20          | If not item has, continue         | Item index
| 0x84 (132)  | 50          | Unset value                       | Flag
| 0x8D (141)  | 175         | If not flag set, next command     | Flag
| 0x91 (145)  | 19          | Remove item                       | Item index
| 0x9C (156)  | 2           | ?                                 | Always 16777215 (0xFFFFFF)
| 0xA2 (162)  |             | Weapon X screen offset            | offsets the weapon's onscreen horizontal position (affects where projectile is fired)
| 0xA7 (167)  |             | BulletVulnerable                  | For a monster, set vulnerability against a bullet (bullet does 2x damage). this can stack
| 0xA8 (168)  |             | SetMonsterSecondaryBullet         | sets the bullet for a monster's secondary attack
| 0xA9 (169)  |             | OnMonsterDamageSFX                | For a monster, what sound effect to play on damage (when run multiple times, randomly chooses one) (bugged? when multiple are selected, will not play the last one? need to add it twice)
| 0xAA (170)  |             | MonsterSecondAttackSFX            | the sound effect to play when monster makes its secondary attack
| 0xAB (171)  |             | MonsterSecondAttackDelay          | the delay to spawn the bullet for a monster's secondary attack
| 0xB1 (177)  |             | MonsterCritDeathSFX               | The sound effect to play when monster critically dies (like from max health in a single hit)


## Interesting findings

- Aelf's Dagger is technically also classified as a bullet, but does no damage
  - It's the only non-"Bullet" item that contains a trigger code of `0x06` (which initializes Bullet data)
  - The only Bullet-related data it contains is a travel speed of `0x0E`
- There is an unused weapon icon of a mace that can be used (command `0x33` = `0x0A`)
- There are two fully implemented Bullets that are unused: the throwing stars (index `0x48` and `0x49`)

