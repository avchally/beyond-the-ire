#!/usr/bin/env node
/* eslint-disable no-console */
// Node.js analyzer for DBASE100 with focus on inventory items and actions/opcodes
// Usage examples:
//   node tools/dbase-parsers/dbase100/analyze.js --demo
//   node tools/dbase-parsers/dbase100/analyze.js --dbase100 path/to/DBASE100.DAT --dbase400 path/to/DBASE400.DAT --out output/dbase_parser

const fs = require('fs');
const path = require('path');

// Kaitai runtime and generated parser
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const Dbase100File = require('../kaitai/Dbase100File');

// Minimal embedded DBASE400 reader to avoid TS imports in JS
function readDBASE400Interface(buffer, offset) {
  const dbase500Offset = buffer.readUInt32LE(offset);
  const stringLength = buffer.readUInt16LE(offset + 0x04);
  const fontColor = buffer.readUInt16LE(offset + 0x06);
  const text = buffer.toString('ascii', offset + 0x08, offset + 0x08 + stringLength);
  return { dbase500Offset, stringLength, fontColor, text };
}

function parseArgs(argv) {
  const args = { out: 'output/dbase_parser', demo: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--demo') { args.demo = true; continue; }
    if (a === '--dbase100') { args.dbase100 = argv[++i]; continue; }
    if (a === '--dbase400') { args.dbase400 = argv[++i]; continue; }
    if (a === '--out') { args.out = argv[++i]; continue; }
    if (a === '--help' || a === '-h') { args.help = true; }
  }
  return args;
}

function printHelp() {
  console.log('DBASE100 Analyzer');
  console.log('Options:');
  console.log('  --demo                  Use DEMO_VERSION DBASE files from roth_source_files');
  console.log('  --dbase100 <path>       Path to DBASE100.DAT');
  console.log('  --dbase400 <path>       Path to DBASE400.DAT');
  console.log('  --out <dir>             Output directory (default: output/dbase_parser)');
  console.log('  -h, --help              Show help');
}

function ensureOutDir(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
}

function toHex(num, width = 2) {
  return Number(num).toString(16).padStart(width, '0');
}

function decodeArgsBytes(argsBytes) {
  // argsBytes is a Uint8Array length 3 (little-endian 24-bit)
  return argsBytes[0] + (argsBytes[1] << 8) + (argsBytes[2] << 16);
}

function buildOpcodeCatalog() {
  // Seed with known or hypothesized meanings (from documentation); extend as we learn
  // Keys are numeric opcode, values include short label and notes
  return new Map([
    [0x03, { label: 'ChainLen', note: 'First opcode encodes byte length of chain (actions section)' }],
    [0x13, { label: 'SetBullet', note: 'Weapon: set bullet inventory index (observed in Colt-45)' }],
    [0x14, { label: 'SetAmmoCap', note: 'Weapon: set ammo capacity (observed)' }],
    [0x24, { label: 'SetMoveSpeed', note: 'Monster: default move speed' }],
    [0x25, { label: 'AIFlag?', note: 'Monster: unknown, affects AI' }],
    [0x26, { label: 'SetHealth', note: 'Monster: default health' }],
    [0x28, { label: 'SetProjectile', note: 'Monster: projectile item (bullet) index (1-based)' }],
  ]);
}

function analyzeInventory(dbase100, dbase400Buffer) {
  const opcodeCatalog = buildOpcodeCatalog();
  const items = [];
  const opcodeStats = new Map(); // opcode -> count
  const nameCounts = new Map();
  const bullets = [];
  const monsters = [];

  for (let i = 0; i < dbase100.inventoryLookupSection.entries.length; i++) {
    const entry = dbase100.inventoryLookupSection.entries[i];
    if (!entry.object) continue;

    const inv = entry.object;
    const entryOffset = entry.inventoryEntryOffset >>> 0;
    const nameEntry = readDBASE400Interface(dbase400Buffer, inv.nameOffset);
    const name = nameEntry.text.split('\u0000')[0];

    const actions = inv.inventoryActions.map((a, idx) => ({
      index: idx,
      command: a.command,
      argsBytes: Array.from(a.argsBytes),
      args: typeof a.args === 'number' ? a.args : decodeArgsBytes(a.argsBytes),
      label: (opcodeCatalog.get(a.command) || {}).label || null,
      fileOffset: (entryOffset + 24 + idx * 4) >>> 0,
    }));

    // Stats
    for (const a of actions) {
      opcodeStats.set(a.command, (opcodeStats.get(a.command) || 0) + 1);
    }
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);

    const item = {
      index: i,
      itemType: inv.itemType,
      closeupType: inv.closeupType,
      closeupImageOffset: inv.closeupImageOffset >>> 0,
      inventoryImageOffset: inv.inventoryImageOffset >>> 0,
      nameOffset: inv.nameOffset >>> 0,
      entryOffset,
      name,
      actions,
    };

    items.push(item);

    if (name === 'Monster') monsters.push(item);
    if (name === 'Bullet') bullets.push(item);
  }

  // Cross references: monsters -> bullets via opcode 0x28 (args 1-based index)
  const monsterProjectileRefs = monsters.map(m => {
    const setProjectile = m.actions.filter(a => a.command === 0x28);
    return {
      monsterIndex: m.index,
      argsHex: setProjectile.map(a => toHex(a.args, 6)),
      bullets1Based: setProjectile.map(a => a.args),
      bullets0Based: setProjectile.map(a => a.args - 1),
    };
  }).filter(x => x.bullets1Based.length > 0);

  // Derive interesting weapon/bullet relations via opcode 0x13 and 0x14
  const weapons = items.filter(it => it.actions.some(a => a.command === 0x13 || a.command === 0x14));

  // Top opcodes by usage
  const topOpcodes = Array.from(opcodeStats.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([opcode, count]) => ({ opcode, opcodeHex: toHex(opcode), count, label: (buildOpcodeCatalog().get(opcode) || {}).label || null }));

  // Build opcode usage index for deeper analysis
  const opcodeUsages = {};
  for (const it of items) {
    for (const a of it.actions) {
      const key = '0x' + toHex(a.command, 2);
      if (!opcodeUsages[key]) opcodeUsages[key] = [];
      opcodeUsages[key].push({
        itemIndex: it.index,
        itemName: it.name,
        itemType: it.itemType,
        entryOffset: '0x' + toHex(it.entryOffset, 8),
        actionIndex: a.index,
        argsHex: '0x' + toHex(a.args, 6),
        argsDec: a.args,
        fileOffset: '0x' + toHex(a.fileOffset, 8),
        label: a.label || null,
      });
    }
  }

  return { items, opcodeStats: Object.fromEntries(opcodeStats), nameCounts: Object.fromEntries(nameCounts), bullets, monsters, weapons, monsterProjectileRefs, opcodeUsages };
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function writeCsv(filePath, rows) {
  const csv = rows.map(r => r.map(v => String(v).includes(',') || String(v).includes('"') ? `"${String(v).replace(/"/g, '""')}"` : String(v)).join(',')).join('\n') + '\n';
  fs.writeFileSync(filePath, csv, 'utf8');
}

function makeInventoryCsv(items) {
  const rows = [
    ['INDEX', 'INDEX_REF', 'ENTRY_OFFSET', 'ITEM_TYPE', 'NAME', 'ACTION_COUNT', 'ACTIONS (argsHex:cmdHex[label])']
  ];
  for (const it of items) {
    const actionsStr = it.actions.map(a => `${toHex(a.args, 6)}:${toHex(a.command, 2)}${a.label ? '[' + a.label + ']' : ''}`).join(' ');
    rows.push([
      it.index,
      toHex(it.index + 1, 4),
      '0x' + toHex(it.entryOffset, 8),
      it.itemType,
      it.name,
      it.actions.length,
      actionsStr,
    ]);
  }
  return rows;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); return; }

  let dbase100Path;
  let dbase400Path;
  if (args.demo) {
    dbase100Path = path.resolve(__dirname, '../../../roth_source_files/DEMO_VERSION/DBASE100.DAT');
    dbase400Path = path.resolve(__dirname, '../../../roth_source_files/DEMO_VERSION/DBASE400.DAT');
  } else {
    dbase100Path = args.dbase100 ? path.resolve(process.cwd(), args.dbase100) : path.resolve(__dirname, '../../../roth_source_files/DBASE100.DAT');
    dbase400Path = args.dbase400 ? path.resolve(process.cwd(), args.dbase400) : path.resolve(__dirname, '../../../roth_source_files/DBASE400.DAT');
  }

  const outDir = path.resolve(process.cwd(), args.out);
  ensureOutDir(outDir);

  console.log(`Reading DBASE100: ${dbase100Path}`);
  console.log(`Reading DBASE400: ${dbase400Path}`);
  const dbase100Buffer = fs.readFileSync(dbase100Path);
  const dbase400Buffer = fs.readFileSync(dbase400Path);
  const dbase100 = new Dbase100File(new KaitaiStream(dbase100Buffer));

  const analysis = analyzeInventory(dbase100, dbase400Buffer);

  // Outputs
  const invJsonPath = path.join(outDir, 'dbase100_inventory.json');
  const invCsvPath = path.join(outDir, 'dbase100_inventory.csv');
  const statsJsonPath = path.join(outDir, 'dbase100_opcode_stats.json');
  const crossJsonPath = path.join(outDir, 'dbase100_monster_projectiles.json');
  const usagesJsonPath = path.join(outDir, 'dbase100_opcode_usages.json');

  writeJson(invJsonPath, analysis.items);
  writeCsv(invCsvPath, makeInventoryCsv(analysis.items));
  writeJson(statsJsonPath, analysis.opcodeStats);
  writeJson(crossJsonPath, analysis.monsterProjectileRefs);
  writeJson(usagesJsonPath, analysis.opcodeUsages);

  // Console summaries
  console.log('Totals:');
  console.log(`  Items: ${analysis.items.length}`);
  console.log(`  Monsters: ${analysis.monsters.length}`);
  console.log(`  Bullets: ${analysis.bullets.length}`);
  console.log(`  Weapons(by 0x13/0x14): ${analysis.weapons.length}`);

  console.log('Top opcodes:');
  const top = Object.entries(analysis.opcodeStats).sort((a,b) => b[1]-a[1]).slice(0, 15);
  for (const [op, count] of top) {
    console.log(`  0x${toHex(Number(op))}: ${count}`);
  }

  console.log('Monster projectile refs (first 10):');
  for (const m of analysis.monsterProjectileRefs.slice(0, 10)) {
    console.log(`  Monster#${m.monsterIndex} -> bullets(1-based): ${m.bullets1Based.join(', ')} [argsHex=${m.argsHex.join(', ')}]`);
  }

  console.log('Wrote:');
  console.log(`  ${invJsonPath}`);
  console.log(`  ${invCsvPath}`);
  console.log(`  ${statsJsonPath}`);
  console.log(`  ${crossJsonPath}`);
  console.log(`  ${usagesJsonPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}


