import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface DevContainerConfig {
    name?: string;
    image?: string;
    build?: {
        dockerfile?: string;
        context?: string;
        args?: Record<string, string>;
    };
    runArgs?: string[];
    postCreateCommand?: string;
    features?: Record<string, any>;
    forwardPorts?: number[];
    remoteUser?: string;
}

export async function findDevContainerConfig(projectPath: string): Promise<string | null> {
    const possiblePaths = [
        path.join(projectPath, '.devcontainer', 'devcontainer.json'),
        path.join(projectPath, '.devcontainer.json')
    ];

    for (const p of possiblePaths) {
        try {
            await fs.access(p);
            return p;
        } catch {
            continue;
        }
    }
    return null;
}

export async function parseDevContainer(projectPath: string): Promise<DevContainerConfig | null> {
    const configPath = await findDevContainerConfig(projectPath);
    if (!configPath) return null;

    try {
        const content = await fs.readFile(configPath, 'utf-8');
        // Basic comment stripping (// and /* */) to support JSONC
        const jsonc = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        return JSON.parse(jsonc);
    } catch (e) {
        console.error('Failed to parse devcontainer.json', e);
        return null;
    }
}


export async function startDevContainer(projectPath: string, config: DevContainerConfig, options: { rebuild?: boolean } = {}): Promise<string> {
    let image = config.image;

    // Handle Dockerfile build if no image provided
    if (!image && config.build && config.build.dockerfile) {
        const context = config.build.context ? path.join(projectPath, config.build.context) : projectPath;
        const dockerfilePath = path.join(context, config.build.dockerfile);

        // Simple tag generation
        image = `vsc-openova-${path.basename(projectPath).toLowerCase()}-${Date.now()}`;
        console.log(`Building image: ${image} from ${dockerfilePath}`);

        try {
            // If rebuild is requested, add --no-cache
            const buildArgs = options.rebuild ? '--no-cache' : '';
            await execPromise(`docker build ${buildArgs} -t ${image} -f "${dockerfilePath}" "${context}"`);
        } catch (e: any) {
            console.error('Docker build failed:', e.stderr || e.message);
            throw new Error(`Docker build failed: ${e.stderr || e.message}`);
        }
    }

    if (!image) {
        throw new Error('No image specified and no valid build configuration found.');
    }

    const workspaceMount = `-v "${projectPath}:/workspace"`;
    const workdir = `-w /workspace`;
    // We use host network for simplicity in this MVP to avoid port forwarding complexity
    const network = '--network host';
    const runArgs = config.runArgs ? config.runArgs.join(' ') : '';

    // Command to launch container detached
    const cmd = `docker run -d ${workspaceMount} ${workdir} ${network} ${runArgs} ${image} sleep infinity`;
    console.log('Starting container:', cmd);

    try {
        const { stdout } = await execPromise(cmd);
        const containerId = stdout.trim();
        console.log('Container started:', containerId);

        if (config.postCreateCommand) {
            console.log('Running postCreateCommand:', config.postCreateCommand);
            await execPromise(`docker exec ${containerId} /bin/sh -c "${config.postCreateCommand}"`);
        }

        return containerId;
    } catch (e: any) {
        console.error('Failed to start container:', e.stderr || e.message);
        throw e;
    }
}
