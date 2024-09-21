import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

// Recursively find all .js and .jsx files in the directory
function getAllFiles(dirPath: string, filesList: string[] = []): string[] {
    const files = readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = join(dirPath, file);
        if (statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, filesList);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            filesList.push(fullPath);
        }
    });

    return filesList;
}

// Check if a directory contains an index.js or index.jsx file
function hasIndexFile(dirPath: string): string | false {
    if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
        return false;
    }
    if (existsSync(join(dirPath, 'index.js'))) {
        return '/index.js';
    }
    if (existsSync(join(dirPath, 'index.jsx'))) {
        return '/index.jsx';
    }
    return false;
}

// Add extension to import paths if not already present
function addExtensionsToImports(filePath: string): void {
    const content = readFileSync(filePath, 'utf-8');

    // Regular expression to match import statements without file extensions
    const updatedContent = content.replace(
        /import\s+([^'";]+)\s+from\s+['"]([^'";]+)['"]/g,
        (match: string, importVar: string, importPath: string): string => {
            // Check if path already has an extension
            if (!importPath.match(/\.(js|jsx)$/)) {
                const fullImportPath = join(dirname(filePath), importPath);

                // Check if it's a folder with index.js or index.jsx
                const indexFileExtension = hasIndexFile(fullImportPath);
                if (indexFileExtension) {
                    return `import ${importVar} from "${importPath}${indexFileExtension}"`;
                }

                // Otherwise, check if it's a file that needs .js or .jsx extension
                const fileExtension = existsSync(fullImportPath + '.js')
                    ? '.js'
                    : existsSync(fullImportPath + '.jsx')
                        ? '.jsx'
                        : '';

                if (fileExtension) {
                    return `import ${importVar} from "${importPath}${fileExtension}"`;
                }
            }
            return match;
        }
    );

    // Write the modified content back to the file
    writeFileSync(filePath, updatedContent);
}

// Progress indicator function
function updateProgress(current: number, total: number): void {
    const percentage = Math.floor((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor((current / total) * 20)).padEnd(20, ' ');
    process.stdout.write(`\rProgress: [${progressBar}] ${percentage}%`);
}

// Main function to update all files
function updateImportsInSrc(srcDir: string): void {
    const files = getAllFiles(srcDir);
    const totalFiles = files.length;

    files.forEach((file, index) => {
        addExtensionsToImports(file);
        updateProgress(index + 1, totalFiles);
    });

    console.log('\nUpdate completed.');
}

// Get the source directory from command-line arguments
const args = process.argv.slice(2);
const srcDir = args[0] ? join(process.cwd(), args[0]) : null;

if (srcDir && existsSync(srcDir)) {
    updateImportsInSrc(srcDir);
} else {
    console.error("Please provide a valid source directory path.");
    process.exit(1);
}
