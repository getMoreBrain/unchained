Package.describe({
  name: 'unchained:platform',
  version: '0.43.0',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.9');

  api.use('ecmascript');
  api.use('random');
  api.use('check');
  api.use('accounts-base');
  api.use('dburles:factory@1.1.0');
  api.use('unchained:core@0.43.0');
  api.use('unchained:core-currencies@0.43.0');
  api.use('unchained:core-countries@0.43.0');
  api.use('unchained:core-delivery@0.43.0');
  api.use('unchained:core-discounting@0.43.0');
  api.use('unchained:core-documents@0.43.0');
  api.use('unchained:core-languages@0.43.0');
  api.use('unchained:core-logger@0.43.0');
  api.use('unchained:core-messaging@0.43.0');
  api.use('unchained:core-quotations@0.43.0');
  api.use('unchained:core-orders@0.43.0');
  api.use('unchained:core-payment@0.43.0');
  api.use('unchained:core-pricing@0.43.0');
  api.use('unchained:core-products@0.43.0');
  api.use('unchained:core-users@0.43.0');
  api.use('unchained:core-bookmarks@0.43.0');
  api.use('unchained:core-warehousing@0.43.0');
  api.use('unchained:core-filters@0.44.0');
  api.use('unchained:core-assortments@0.43.0');
  api.use('unchained:core-worker@0.43.0');
  api.use('unchained:api@0.43.0');

  api.mainModule('platform.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
