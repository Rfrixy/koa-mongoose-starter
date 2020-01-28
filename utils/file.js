const fs = require('fs');
const cfg = require('@smpx/cfg');

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function mvFile(source, dest) {
  const destDir = dest.split('/').slice(0, -1).join('/');
  mkdir(destDir);
  fs.renameSync(source, dest);
}


function getsubdirPath(team, type = 'images') {
  const d = new Date();
  const systemType = cfg('systemType');
  const subdir = `uploads/${systemType}/${team}/${type}/${d.getFullYear()}_${d.getMonth() + 1}`;
  mkdir(`uploads/${systemType}`);
  mkdir(`uploads/${systemType}/${team}`);
  mkdir(`uploads/${systemType}/${team}/${type}`);
  mkdir(subdir);
  return subdir;
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function readJSONFile(fileName) {
  try {
    const rawdata = fs.readFileSync(fileName);
    return JSON.parse(rawdata);
  } catch (err) { // usually due to no such file existing
    return {};
  }
}

function writeJSONFile(fileName, obj) {
  const data = JSON.stringify(obj, null, 4);
  fs.writeFileSync(fileName, data);
}

module.exports = {
  mkdir,
  mvFile,
  deleteFolderRecursive,
  getsubdirPath,
  readJSONFile,
  writeJSONFile,
};
