const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', '@shoelace-style', 'shoelace', 'dist');
const dest = path.join(__dirname, '..', 'src', 'shoelace', 'dist');

function copyRecursive(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        console.error('Source not found:', srcDir);
        process.exit(1);
    }
    fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(src, dest);
console.log('Copied Shoelace dist to', dest);

