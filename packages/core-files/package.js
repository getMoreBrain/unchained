Package.describe({
  name: 'unchained:core-files',
  version: '0.22.0',
  summary: 'Unchained Engine Core: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8.0.2');
  api.use('ostrio:files@1.9.11');
  api.use('ecmascript');
  api.mainModule('core-files.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-files');
  api.mainModule('core-files-tests.js');
});