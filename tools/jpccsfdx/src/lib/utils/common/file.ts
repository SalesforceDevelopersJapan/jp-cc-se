import { mkdir } from 'fs/promises';
import { access } from 'fs/promises';
import { PathLike, constants, createReadStream } from 'node:fs';
import { Readable } from 'node:stream';


export default class FileUtils {
    static async isExist(path: PathLike): Promise<boolean> {
        try {
            await access(path, constants.F_OK);
            return true;
        } catch(e) {
            console.log(e)
            return false;
        }
    }

    static async mkdir(path: PathLike) {
        await mkdir(path, { recursive: true });
    }

    static getImage(path: PathLike): Readable {
        return createReadStream(path);
    }
}
