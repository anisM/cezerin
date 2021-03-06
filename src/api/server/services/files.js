'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');
const formidable = require('formidable');
const utils = require('../lib/utils');
const settings = require('../lib/settings');
const Papa = require('papaparse');

// here we add all files type...
const configTypeFile = ['BASE', 'COMP', 'PRICE'];

const CONTENT_PATH = path.resolve(settings.filesUploadPath);

class FilesService {
  getFileData(fileName) {
    const filePath = CONTENT_PATH + '/' + fileName;
    const stats = fs.statSync(filePath);
    if(stats.isFile()){
      return {
        file: fileName,
        type: this.fileType(fileName),
        size: stats.size,
        modified: stats.mtime
      }
    } else {
      return null;
    }
  }

  fileType(fileName) {
    let type = "unknown";
    for (let _i = 0, _length = configTypeFile.length; _i < _length; _i++) {
        if(fileName.search(configTypeFile[_i]) != -1) {
          type = configTypeFile[_i];
          break;
        }
    }
    return type;
  }

  getFilesData(files) {
    return files
    .map(fileName => this.getFileData(fileName))
    .filter(fileData => fileData !== null)
    .sort((a,b) => (a.modified - b.modified));
  }

  getFiles() {
    return new Promise((resolve, reject) => {
      fs.readdir(CONTENT_PATH, (err, files) => {
        if(err){
          reject(err);
        } else {
          const filesData = this.getFilesData(files);
          resolve(filesData);
        }
      })
    });
  }

  getFileInfos(fileName) {
    return new Promise((resolve, reject) => {
      const filePath = CONTENT_PATH + '/' + fileName;
      const stats = fs.createReadStream(filePath);
      if(fs.existsSync(filePath)){
          Papa.parse(stats, {
            newline: "",  // auto-detect
            quoteChar: '"', 
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true,
          complete: function(results) {
            //console.log("Finished:", results.meta);
            resolve(results.data);
          }
        });
      } else {
        reject('File not found');
      }
    });
  }



  deleteFile(fileName) {
    return new Promise((resolve, reject) => {
      const filePath = CONTENT_PATH + '/' + fileName;
      if(fs.existsSync(filePath)){
        fs.unlink(filePath, (err) => {
          resolve();
        })
      } else {
        reject('File not found');
      }
    });
  }

  uploadFile(req, res, next) {
    const uploadDir = CONTENT_PATH;

    let form = new formidable.IncomingForm(),
        file_name = null,
        file_size = 0;

    form.uploadDir = uploadDir;

    form
      .on('fileBegin', (name, file) => {
        // Emitted whenever a field / value pair has been received.
        file.name = utils.getCorrectFileName(file.name);
        file.path = uploadDir + '/' + file.name;
      })
      .on('file', function(name, file) {
        // every time a file has been uploaded successfully,
        file_name = file.name;
        file_size = file.size;
      })
      .on('error', (err) => {
        res.status(500).send(this.getErrorMessage(err));
      })
      .on('end', () => {
        //Emitted when the entire request has been received, and all contained files have finished flushing to disk.
        if(file_name) {
          res.send({ 'file': file_name, 'size': file_size });
        } else {
          res.status(400).send(this.getErrorMessage('Required fields are missing'));
        }
      });

    form.parse(req);
  }

  getErrorMessage(err) {
    return { 'error': true, 'message': err.toString() };
  }
}

module.exports = new FilesService();
