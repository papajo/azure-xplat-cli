// This file has been autogenerated.

var profile = require('../../../lib/util/profile');

exports.getMockedProfile = function () {
  var newProfile = new profile.Profile();

  newProfile.addSubscription(new profile.Subscription({
    id: '6e0b24a6-2bef-4598-9bd3-f87e9700e24c',
    name: 'Windows Azure Internal Consumption',
    user: {
      name: 'user@domain.example',
      type: 'user'
    },
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    state: 'Enabled',
    registeredProviders: [],
    _eventsCount: '1',
    isDefault: true
  }, newProfile.environments['AzureCloud']));

  return newProfile;
};

exports.setEnvironment = function() {
  process.env['AZURE_BATCH_ACCOUNT'] = 'test1';
  process.env['AZURE_BATCH_ENDPOINT'] = 'https://test1.westus.batch.azure.com';
};

exports.scopes = [[function (nock) { 
var result = 
nock('http://test1.westus.batch.azure.com:443')
  .filteringRequestBody(function (path) { return '*';})
.put('/pools/xplatTestLinuxPool/nodes/tvm-1219235766_1-20160422t053911z/users/xplatUser?api-version=2016-02-01.3.0&timeout=30', '*')
  .reply(200, "", { 'transfer-encoding': 'chunked',
  server: 'Microsoft-HTTPAPI/2.0',
  'request-id': 'c4c9ee6b-fd2b-4ccc-9d27-7b7a3e0983e6',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'client-request-id': 'd3a8f338-3813-4ef0-b4c1-0e432b8948e6',
  dataserviceversion: '3.0',
  dataserviceid: 'https://test1.westus.batch.azure.com/pools/xplatTestLinuxPool/nodes/tvm-1219235766_1-20160422t053911z/users/xplatUser',
  date: 'Fri, 22 Apr 2016 06:11:58 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://test1.westus.batch.azure.com:443')
  .filteringRequestBody(function (path) { return '*';})
.put('/pools/xplatTestLinuxPool/nodes/tvm-1219235766_1-20160422t053911z/users/xplatUser?api-version=2016-02-01.3.0&timeout=30', '*')
  .reply(200, "", { 'transfer-encoding': 'chunked',
  server: 'Microsoft-HTTPAPI/2.0',
  'request-id': 'c4c9ee6b-fd2b-4ccc-9d27-7b7a3e0983e6',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'client-request-id': 'd3a8f338-3813-4ef0-b4c1-0e432b8948e6',
  dataserviceversion: '3.0',
  dataserviceid: 'https://test1.westus.batch.azure.com/pools/xplatTestLinuxPool/nodes/tvm-1219235766_1-20160422t053911z/users/xplatUser',
  date: 'Fri, 22 Apr 2016 06:11:58 GMT',
  connection: 'close' });
 return result; }]];