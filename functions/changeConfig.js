const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const archiver = require('archiver');

async function downloadZipFile(sftp, remoteFile, localZip) {
  return new Promise((resolve, reject) => {
    sftp.fastGet(remoteFile, localZip, {}, (err) => {
      if (err) {
        console.error('Download error:', err.message);
        reject(err);
      } else {
        console.log('Downloaded .zip file successfully');
        resolve();
      }
    });
  });
}

async function unzipZipFile(localZip, localFolder) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(localZip)
      .pipe(unzipper.Extract({ path: localFolder }))
      .on('close', () => {
        console.log('Unzipped .zip file successfully');
        fs.unlinkSync(localZip); // Remove the zip file after unzipping
        resolve();
      })
      .on('error', (err) => {
        console.error('Unzip error:', err.message);
        reject(err);
      });
  });
}

async function changeStartupJob(newJobName, xmlPath) {
  const xmlContent = fs.readFileSync(xmlPath, 'utf8');
  const parser = new xml2js.Parser();
  const builder = new xml2js.Builder();

  // Parse XML
  const result = await parser.parseStringPromise(xmlContent);

  // Change <startupJob> node value
  if (
    result.Environment &&
    result.Environment.startupJob &&
    result.Environment.startupJob[0]
  ) {
    // If <value> node exists, set it; otherwise, create it
    if (result.Environment.startupJob[0].value) {
      result.Environment.startupJob[0].value[0] = newJobName;
    } else {
      result.Environment.startupJob[0].value = [newJobName];
    }
  } else {
    throw new Error('startupJob node not found');
  }

  // Build XML and save
  const newXml = builder.buildObject(result);
  fs.writeFileSync(xmlPath, newXml, 'utf8');
  console.log(`Changed <startupJob> to "${newJobName}"`);
}

async function changeSymbology(newSymbologyEnum, xmlPath) {
  const xmlContent = fs.readFileSync(xmlPath, 'utf8');
  const parser = new xml2js.Parser();
  const builder = new xml2js.Builder();

  // Parse XML
  let result;
  try {
    result = await parser.parseStringPromise(xmlContent);
  } catch (err) {
    console.error('XML parse error:', err.message);
    throw err;
  }

  // Traverse to <setupparameter2ddecoder> and change <searchingsymbology><value>
  let changed = false;
  if (
    result.job &&
    result.job.task &&
    result.job.task[0] &&
    result.job.task[0].operatingmode &&
    result.job.task[0].operatingmode[0] &&
    result.job.task[0].operatingmode[0].generalopmodesettings &&
    result.job.task[0].operatingmode[0].generalopmodesettings[0] &&
    result.job.task[0].operatingmode[0].generalopmodesettings[0].setupparameter2ddecoder
  ) {
    const setupparameter2ddecoderArr = result.job.task[0].operatingmode[0].generalopmodesettings[0].setupparameter2ddecoder;
    setupparameter2ddecoderArr.forEach(decoder => {
      if (
        decoder.searchingsymbology &&
        decoder.searchingsymbology[0] &&
        decoder.searchingsymbology[0].value
      ) {
        decoder.searchingsymbology[0].value[0] = newSymbologyEnum;
        changed = true;
      }
    });
  }

  if (!changed) {
    throw new Error('searchingsymbology node not found');
  }
  // Build XML and save
  const newXml = builder.buildObject(result);
  fs.writeFileSync(xmlPath, newXml, 'utf8');
  console.log(`Changed <searchingsymbology><value> to "${newSymbologyEnum}"`);
}

async function changeSymbologyRaw(newSymbologyEnum, xmlPath, outputXmlPath) {
  let xmlContent = await fs.promises.readFile(xmlPath, 'utf8');
  // Only change <searchingsymbology><value> inside <setupparameter2ddecoder>
  xmlContent = xmlContent.replace(
    /(<setupparameter2ddecoder[\s\S]*?<searchingsymbology[^>]*>\s*<value>)(.*?)(<\/value>)/,
    `$1${newSymbologyEnum}$3`
  );
  await fs.promises.writeFile(outputXmlPath, xmlContent, 'utf8');
  console.log(`Changed <searchingsymbology><value> inside <setupparameter2ddecoder> to "${newSymbologyEnum}"`);
}

async function zipFile(filePath, zipPath, fileName) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped ${fileName} to ${zipPath}`);
      resolve();
    });
    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.file(filePath, { name: fileName });
    archive.finalize();
  });
}

async function uploadZipFile(sftp, localZip, remoteFile) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localZip, remoteFile, {}, (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        reject(err);
      } else {
        console.log('Uploaded new .zip successfully');
        resolve();
      }
    });
  });
}

async function uploadZipFileToFolder(sftp, localZip, remoteFolder) {
  return new Promise((resolve, reject) => {
    // Use the same file name as localZip for remote upload
    const remoteFileName = path.basename(localZip);
    const remoteFilePath = path.posix.join(remoteFolder, remoteFileName);
    sftp.fastPut(localZip, remoteFilePath, {}, (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        reject(err);
      } else {
        console.log(`Uploaded ${localZip} to ${remoteFilePath} successfully`);
        resolve();
      }
    });
  });
}

function connectSSHAndUnzipAndUpload() {
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH Connection established');
    conn.sftp(async (err, sftp) => {
      if (err) {
        console.error('SFTP error:', err.message);
        conn.end();
        return;
      }
      const remoteEnvironmentFile = '/media/user/AppData/Environment/Environment.zip';
      const localEnvironmentFolder = path.join(__dirname, '../assets/Environment');
      const localZip = path.join(__dirname, '../assets/Environment.zip');
      const xmlPath = path.join(localEnvironmentFolder, 'Environment.xml');
      const remoteDefaultJobFile = '/media/boot/Current/App/AppFiles/Templates/DefaultJob.zip';
      const localDefaultJobFolder = path.join(__dirname, '../assets/DefaultJob');
      const xmlJobPath = path.join(localDefaultJobFolder, 'DefaultJob.xml');
      const xmlJobOutputPath = path.join(localDefaultJobFolder, 'Job.xml');
      const localZipJob = path.join(__dirname, '../assets/test3.zip');
      const remoteJobListFolder = '/media/user/AppData/Jobs/';

      try {
        // await downloadZipFile(sftp, remoteEnvironmentFile, localZip);
        // await unzipZipFile(localZip, localEnvironmentFolder);
        // await changeStartupJob("newConfig11122233xy", xmlPath);
        // await zipFile(xmlPath, localZip, 'Environment.xml');
        // await uploadZipFile(sftp, localZip, remoteEnvironmentFile);

        await downloadZipFile(sftp, remoteDefaultJobFile, localZip);
        
        await unzipZipFile(localZip, localDefaultJobFolder);
        await changeSymbologyRaw("2", xmlJobPath, xmlJobOutputPath);
        await zipFile(xmlJobOutputPath, localZipJob, 'Job.xml');
        await uploadZipFileToFolder(sftp, localZipJob, remoteJobListFolder);
      } catch (err) {
        // Error already logged in each function
      }
      conn.end();
    });
  }).on('error', (err) => {
    console.error('SSH Connection error:', err.message);
  }).connect({
    host: '192.168.3.120',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync(path.join(__dirname, '../assets/M120.key'))
  });
}

// Example usage:
connectSSHAndUnzipAndUpload();