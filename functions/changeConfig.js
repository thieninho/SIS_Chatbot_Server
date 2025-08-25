const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const archiver = require('archiver');
const { promisify } = require('util');
const ping = require('ping');
const { openHMP, closeHMP, commandHMP } = require('./HMP.js');

async function downloadZipFile(sftp, remoteFile, localZip) {
  try {
    // Ensure the local directory exists
    const localDir = path.dirname(localZip);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    await sftp.fastGet(remoteFile, localZip);
    console.log(`Downloaded ${remoteFile} to ${localZip} successfully`);
  } catch (err) {
    console.error('Download error:', err.message);
    throw err;
  }
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

  const result = await parser.parseStringPromise(xmlContent);
  if (
    result.Environment &&
    result.Environment.startupJob &&
    result.Environment.startupJob[0]
  ) {
    if (result.Environment.startupJob[0].value) {
      result.Environment.startupJob[0].value[0] = newJobName;
    } else {
      result.Environment.startupJob[0].value = [newJobName];
    }
  } else {
    throw new Error('startupJob node not found');
  }

  const newXml = builder.buildObject(result);
  fs.writeFileSync(xmlPath, newXml, 'utf8');
  console.log(`Changed <startupJob> to "${newJobName}"`);
}

async function changeSymbologyRaw(newSymbologyEnum, xmlPath) {
  let xmlContent = await fs.promises.readFile(xmlPath, 'utf8');
  xmlContent = xmlContent.replace(
    /(<setupparameter2ddecoder[\s\S]*?<searchingsymbology[^>]*>\s*<value>)(.*?)(<\/value>)/,
    `$1${newSymbologyEnum}$3`
  );
  await fs.promises.writeFile(xmlPath, xmlContent, 'utf8');
  console.log(`Changed <searchingsymbology><value> inside <setupparameter2ddecoder> to "${newSymbologyEnum}"`);
}

async function zipFolder(folderPath) {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const archiver = require('archiver');
    const path = require('path');

    const folderName = path.basename(folderPath);
    const zipPath = path.join(path.dirname(folderPath), `${folderName}.zip`);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped files from ${folderName} to ${zipPath}`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Read only files (not subdirectories) from folderPath
    const files = fs.readdirSync(folderPath).filter(file => 
      fs.statSync(path.join(folderPath, file)).isFile()
    );

    // Add each file to the zip, placing it in the root of the zip archive
    files.forEach(file => {
      archive.file(path.join(folderPath, file), { name: file });
    });

    archive.finalize();
  });
}

async function cleanAssetsFolder(assetsPath) {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const items = await fs.readdir(assetsPath);
    for (const item of items) {
      if (item !== 'M120.key') {
        const itemPath = path.join(assetsPath, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          await fs.rm(itemPath, { recursive: true, force: true });
          console.log(`Deleted directory: ${itemPath}`);
        } else {
          await fs.unlink(itemPath);
          console.log(`Deleted file: ${itemPath}`);
        }
      }
    }
    console.log(`Cleaned assets folder, preserving ${path.join(assetsPath, 'M120.key')}`);
  } catch (err) {
    console.error(`Error cleaning assets folder: ${err.message}`);
    throw err;
  }
}

async function uploadZipFileToFolder(sftp, localZip, remoteFolder) {
  try {
    const remoteFileName = path.basename(localZip);
    const remoteFilePath = path.posix.join(remoteFolder, remoteFileName);
    await sftp.fastPut(localZip, remoteFilePath);
    console.log(`Uploaded ${localZip} to ${remoteFilePath} successfully`);
  } catch (err) {
    console.error('Upload error:', err.message);
    throw err;
  }
}

async function changeConfig(ws, data) {
  if(data.config.name == 'undefined')
  {
    data.config.name = 'myDefault';
    ws.send(JSON.stringify({ type: 'warning', message: 'No config name provided, using "myDefault".', errorCode: 0 }));
  }
  if (!ws.clientHMP) {
    ws.send(JSON.stringify({ type: 'warning', message: 'No HMP client available. Please wait until the connection is established.', errorCode: 0 }));
    const response = await openHMP(parsedData.IP, ['C', 'B']);
    const lastMessage = response.messages[response.messages.length - 1];
    if (lastMessage === '\x1BH\r\n\x1BS\r\n' || lastMessage === '\x1BS\r\n') {
      ws.clientHMP = response.client;
      ws.send(JSON.stringify({ type: 'success', message: 'HMP connection opened. Please wait to change configuration.', errorCode: 0 }));
    } else {
      response.client.destroy();
      ws.send(JSON.stringify({ type: 'error', message: `Failed to open HMP connection. Cannot change configuration`, errorCode: 1 }));
      return;
    }
  }
  
  try {
    if (!ws.clientHMP) {
      console.log('HMP client is undefined');
      throw new Error('HMP client is undefined');
    }
    let response = await commandHMP(ws.clientHMP, "GET_INFO\n");
    if (response.message !== 'NACK\n') {
      const isDefault = isDefaultConfigurationRunning(response.message);
      if (!isDefault) {
        response = await commandHMP(ws.clientHMP, "CHANGE_CFG Default");
        if (response.message !== 'ACK\n') throw new Error('Failed to change default config.');
        console.log('Change default config executed successfully');
      }
    }

    response = await commandHMP(ws.clientHMP, `SAVE ${data.config.name}`);
    if (response.message !== 'ACK\n') throw new Error(`Failed to save config ${data.config.name}.`);

    console.log(`Save ${data.config.name} executed successfully`);

    response = await commandHMP(ws.clientHMP, `STARTUP_CFG ${data.config.name}`);
    if (response.message !== 'ACK\n') throw new Error(`Failed to set startup config ${data.config.name}.`);

    console.log(`Startup config set to ${data.config.name} successfully`);

    const sftp = await openSSHConnection(data.IP);
    if (!sftp) {
      throw new Error('Failed to open SSH connection.');
    }

    try {
      console.log('Config name:', data.config.name);
      await downloadZipFile(sftp, `/media/user/AppData/Jobs/${data.config.name}.zip`, path.join(__dirname, `../assets/${data.config.name}.zip`));
      await unzipZipFile(path.join(__dirname, `../assets/${data.config.name}.zip`), path.join(__dirname, `../assets/${data.config.name}`));
      const symbologyEnum = data.config.symbology === 'QR' ? "1" : "0"; // QR or Data Matrix
      await changeSymbologyRaw(symbologyEnum, path.join(__dirname, `../assets/${data.config.name}/Job.xml`));
      await zipFolder(path.join(__dirname, `../assets/${data.config.name}`));
      await uploadZipFileToFolder(sftp, path.join(__dirname, `../assets/${data.config.name}.zip`), '/media/user/AppData/Jobs/');
      // Send reboot command using the existing sftp connection
      await sendRebootCommand(sftp);
      console.log('Reboot command sent');
      ws.send(JSON.stringify({ type: 'success', message: 'Configuration updated and reboot command sent successfully. Please wait for device to be ready.', errorCode: 0 }));
      // Ping device until ready
      await pingDeviceUntilReady(data.IP, { timeout: 300000, interval: 5000 });
      // Wait for 5 seconds before proceeding
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('Waited 5 seconds after device readiness');
      ws.send(JSON.stringify({ type: 'success', message: 'Device is ready to use.', errorCode: 0 }));
      // Clean assets folder, preserving M120.key
      await cleanAssetsFolder(path.join(__dirname, '../assets'));
    } finally {
      await sftp.end();
    }
  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', message: err.message, errorCode: 1 }));
  }
}

function isDefaultConfigurationRunning(get_info_response) {
  return get_info_response.includes('Current Job: Default\n');
}

async function pingDeviceUntilReady(ip, options = {}) {
  const { timeout = 300000, interval = 5000, maxAttempts = null } = options;

  const startTime = Date.now();
  let attempts = 0;

  while (true) {
    if (maxAttempts && attempts >= maxAttempts) {
      throw new Error(`Device ${ip} not ready after ${maxAttempts} attempts`);
    }
    if (Date.now() - startTime > timeout) {
      throw new Error(`Device ${ip} not ready after ${timeout / 1000}s timeout`);
    }

    try {
      const res = await ping.promise.probe(ip, { timeout: 2 });
      if (res.alive) {
        console.log(`Device ${ip} is ready (ping time: ${res.time}ms)`);
        return true;
      }
      console.log(`Device ${ip} not responding, retrying... (attempt ${attempts + 1})`);
    } catch (err) {
      console.log(`Ping error for ${ip}: ${err.message}, retrying...`);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

async function sendRebootCommand(sftp) {
  return new Promise((resolve, reject) => {
    if (!sftp || !sftp.client) {
      return reject(new Error('Invalid or closed SFTP client'));
    }

    sftp.client.exec('reboot', (err, stream) => {
      if (err) {
        console.error('Exec error:', err.message);
        return reject(err);
      }

      stream.on('close', (code, signal) => {
        console.log(`Reboot command executed, stream closed with code ${code}, signal ${signal}`);
        resolve({ code, signal });
      }).on('data', (data) => {
        console.log('STDOUT:', data.toString());
      }).stderr.on('data', (data) => {
        console.error('STDERR:', data.toString());
      });
    });
  });
}

async function openSSHConnection(ip) {
  const client = new SftpClient();
  try {
    await client.connect({
      host: ip,
      port: 22,
      username: 'root',
      privateKey: fs.readFileSync(path.join(__dirname, '../assets/M120.key'))
    });
    console.log(`SSH Connection established to ${ip}`);
    return client;
  } catch (err) {
    console.error(`SSH Connection error to ${ip}:`, err.message);
    throw err;
  }
}

module.exports = {
  changeConfig
};