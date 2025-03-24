import fs from 'fs';
import MapAssembler from './MapAssembler';

async function main() {
    // const filePath = './GNARL1.RAW';
    const filePath = './SOULST2.RAW';
    
    try {
        const buffer = await fs.promises.readFile(filePath);
        const map = new MapAssembler(buffer);
    } catch(error) {
        console.log(error);
    }
}

main();
