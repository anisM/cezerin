'use strict';

const security = require('../lib/security');
const FilesService = require('../services/files');

class FilesRoute {
  constructor(router) {
    this.router = router;
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get('/v1/files', security.checkUserScope.bind(this, security.scope.READ_FILES), this.getFiles.bind(this));
    this.router.get('/v1/files/:file/analyse', security.checkUserScope.bind(this, security.scope.READ_FILES), this.getFileInfos.bind(this));
    this.router.post('/v1/files', security.checkUserScope.bind(this, security.scope.WRITE_FILES), this.uploadFile.bind(this));
    this.router.delete('/v1/files/:file', security.checkUserScope.bind(this, security.scope.WRITE_FILES), this.deleteFile.bind(this));
  }

  getFiles(req, res, next) {
    FilesService.getFiles()
    .then((data) => {
      res.send(data)
    })
    .catch(next);
  }

  getFileInfos(req, res, next) {
    FilesService.getFileInfos(req.params.file)
    .then((data) => {
      res.send(data)
    })
    .catch(next);
  }

  uploadFile(req, res, next) {
    FilesService.uploadFile(req, res, next);
  }

  deleteFile(req, res, next) {
    FilesService.deleteFile(req.params.file).then(() => {
      res.end()
    }).catch(next)
  }
}

module.exports = FilesRoute;
