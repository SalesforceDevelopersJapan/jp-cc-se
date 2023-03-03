import { execSync } from 'child_process';
import { homedir } from 'os';

export default class Shell {
    static runAsJson(cmd: string) {
        const data = execSync(`${cmd} --json`, {
            stdio: 'pipe',
            cwd: `${__dirname}/../../..`,
            env: {
                NODE_TLS_REJECT_UNAUTHORIZED: '0',
                SFDX_REST_DEPLOY: 'false',
                NODE_NO_WARNINGS: '1',
                HOME: homedir(),
            },
        });
        const str = data.toString();
        return JSON.parse(str);
    }

    static run(cmd: string) {
        execSync(`${cmd}`, {
            stdio: 'inherit',
            cwd: `${__dirname}/../../..`,
            env: {
                NODE_TLS_REJECT_UNAUTHORIZED: '0',
                SFDX_REST_DEPLOY: 'false',
                NODE_NO_WARNINGS: '1',
                HOME: homedir(),
            },
        });
    }
}
