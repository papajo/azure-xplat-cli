//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var fs = require('fs');
var util = require('util');
var batchUtil = require('./batch.util');
var batchShowUtil = require('./batch.showUtil');
var utils = require('../../util/utils');
var validation = require('../../util/validation');
var startProgress = batchUtil.startProgress;
var endProgress = batchUtil.endProgress;

var $ = utils.getLocaleString;

/**
* Init batch compute node command
*/
exports.init = function(cli) {
  
  //Init batchUtil
  batchUtil.init(cli);

  /**
  * Define batch compute node command usage
  */
  var batch = cli.category('batch')
    .description($('Commands to manage your Batch objects'));

  var logger = cli.output;

  var interaction = cli.interaction;

  var application = batch.category('application')
    .description($('Commands to manage your Batch Application'));

  var applicationPkg = application.category('package')
      .description($('Commands to manage your Batch Application Package'));

  application.command('create [resource-group] [account-name] [application-id]')
    .description($('Adds an application to the specified Batch account'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--allow-updates <allow-updates>', $('whether packages within the application may be overwritten using the same version string'))
    .option('--display-name <display-name>', $('the disaply name for the application'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(addApplication);

  application.command('set [resource-group] [account-name] [application-id]')
      .description($('Updates an application to the specified Batch account'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .option('--allow-updates <allow-updates>', $('whether packages within the application may be overwritten using the same version string'))
      .option('--display-name <display-name>', $('the disaply name for the application'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(updateApplication);

  application.command('delete [resource-group] [account-name] [application-id]')
      .description($('Deletes an application'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .option('-q, --quiet', $('delete the specified application without confirmation'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(deleteApplication);

  application.command('show [resource-group] [account-name] [application-id]')
      .description($('Show details of the batch application'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(showApplication);

  application.command('list [resource-group] [account-name]')
      .description($('Lists all of the applications in the specified account'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(listApplication);

  application.command('list-summary')
    .description($('Lists all of the applications available in the specified account'))
    .appendBatchAccountOption()
    .execute(listApplicationSummary);

  applicationPkg.command('create [resource-group] [account-name] [application-id] [version]')
      .description($('Creates an application package record'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .option('--version <version>', $('the version of the application'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(addApplicationPkg);

  applicationPkg.command('delete [resource-group] [account-name] [application-id] [version]')
      .description($('Deletes an application package record'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .option('--version <version>', $('the version of the application to delete'))
      .option('-q, --quiet', $('delete the specified application package without confirmation'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(deleteApplicationPkg);

  applicationPkg.command('show [resource-group] [account-name] [application-id] [version]')
      .description($('Show details of the batch application package'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .option('--version <version>', $('the version of the application to show'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(showApplicationPkg);

  applicationPkg.command('activate [resource-group] [account-name] [application-id] [version] [format]')
      .description($('Activate an application package'))
      .option('--account-name <account-name>', $('the name of the Batch account'))
      .option('--application-id <application-id>', $('the id of the application'))
      .option('--version <version>', $('the version of the application to activate'))
      .option('--format <format>', $('the format of the application package binary file'))
      .appendSubscriptionAndResourceGroupOption()
      .execute(activateApplicationPkg);

  /**
  * Implement batch application cli
  */

  function validateResourceGroupAndAccountName(resourceGroup, accountName, options, _) {
    if (resourceGroup) {
      options.resourceGroup = resourceGroup;
    }
    options.resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), options.resourceGroup, _);

    if (accountName) {
      options.accountName = accountName;
    }
    options.accountName = cli.interaction.promptIfNotGiven($('Account name: '), options.accountName, _);
  }

  function validateResourceGroupAccountApplication(resourceGroup, accountName, applicationId, options, _) {
    validateResourceGroupAndAccountName(resourceGroup, accountName, options, _);

    if (applicationId) {
      options.applicationId = resourceGroup;
    }
    options.applicationId = cli.interaction.promptIfNotGiven($('Application Id: '), options.applicationId, _);
  }

  function validateAll(resourceGroup, accountName, applicationId, version, options, _) {
    validateResourceGroupAccountApplication(resourceGroup, accountName, applicationId, options, _);

    if (version) {
      options.version = version;
    }
    options.version = cli.interaction.promptIfNotGiven($('Version: '), options.version, _);
  }

  /**
   * Add batch application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function addApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);

    var tips = util.format($('Adding application %s'), applicationId);
    var param = {};
    if (typeof options.allowUpdates !== 'undefined') {
      param.allowUpdates = (options.allowUpdates === 'true');
    }
    if (options.displayName) {
      param.displayName = options.displayName;
    }

    try {
      startProgress(tips);
      service.applicationOperations.addApplication(options.resourceGroup, options.accountName, options.applicationId, param, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Application %s has been added to account %s successfully'), applicationId, accountName));
  }

  /**
   * Update batch application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function updateApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);
    if (!options.allowUpdates && !options.displayName) {
      throw new Error($('Please specify at least one of option: allow-updates, display-name'));
    }

    var tips = util.format($('Updating application %s'), applicationId);
    var param = {};
    if (typeof options.allowUpdates !== 'undefined') {
      param.allowUpdates = (options.allowUpdates === 'true');
    }
    if (options.displayName) {
      param.displayName = options.displayName;
    }

    try {
      startProgress(tips);
      service.applicationOperations.updateApplication(options.resourceGroup, options.accountName, options.applicationId, param, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Application %s has been updated at account %s successfully'), applicationId, accountName));
  }

  /**
   * Delete the specified application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete application %s? '), applicationId), _)) {
        return;
      }
    }

    var tips = util.format($('Deleting application %s'), applicationId);
    try {
      startProgress(tips);
      service.applicationOperations.deleteApplication(options.resourceGroup, options.accountName, options.applicationId, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Application %s has been deleted from account %s successfully'), applicationId, accountName));
  }

  /**
  * Show the details of the specified application
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);
    var tips = $('Getting Batch application information');

    var applicaiton = null;
    try {
      startProgress(tips);
      applicaiton = service.applicationOperations.getApplication(options.resourceGroup, options.accountName, options.applicationId, _);
    } finally {
      endProgress();
    }

    batchShowUtil.showApplication(applicaiton, cli.output);
  }

  /**
   * List the specified applications of the account
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function listApplication(resourcegroup, accountName, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAndAccountName(resourcegroup, accountName, options, _);
    var tips = $('Listing Batch applications');

    var applications = [];
    try {
      startProgress(tips);
      var result = service.applicationOperations.list(options.resourceGroup, options.accountName, _);
      result.forEach(function (app) {
        applications.push(app);
      });
      var nextLink = result.nextLink;

      while (nextLink) {
        result = service.applicationOperations.listNext(nextLink, _);
        result.forEach(function (app) {
          applications.push(app);
        });
        nextLink = result.nextLink;
      }
    } finally {
      endProgress();
    }

    cli.interaction.formatOutput(applications, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No application found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Id'), item.id);
          row.cell($('Default Version'), item.defaultVersion);
          row.cell($('Allow Updates'), item.allowUpdates);
          if (item.packages) {
            row.cell($('Version Count'), item.packages.length);
          }
        });
      }
    });
  }

  /**
  * List batch application summary
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listApplicationSummary(options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing batch applications summary');
    var batchOptions = {};
    batchOptions.applicationListOptions = batchUtil.getBatchOperationDefaultOption();

    var applications = [];
    startProgress(tips);

    try {
      var result = client.application.list(batchOptions, _);
      result.forEach(function (app) {
        applications.push(app);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.applicationListOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.application.listNext(nextLink, batchOptions, _);
        result.forEach(function (app) {
          applications.push(app);
        });
        nextLink = result.odatanextLink;
      }
    } catch (err) {
      if (err.message) {
        if (typeof err.message === 'object') {
          err.message = err.message.value;
        }
      }
      
      throw err;
    } finally {
      endProgress();
    }

    cli.interaction.formatOutput(applications, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No application found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Application Id'), item.id);
          row.cell($('Display Name'), item.displayName);
          row.cell($('Versions'), JSON.stringify(item.versions));
        });
      }
    });
  }

  /**
   * Add batch application pacakge
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function addApplicationPkg(resourcegroup, accountName, applicationId, version, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);

    var tips = util.format($('Adding version %s to application %s'), version, applicationId);

    try {
      startProgress(tips);
      service.applicationOperations.addApplicationPackage(options.resourceGroup, options.accountName, options.applicationId, options.version, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Version %s has been added to application %s successfully'), version, applicationId));
  }

  /**
   * Update batch application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function activateApplicationPkg(resourcegroup, accountName, applicationId, version, format, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);
    if (!format) {
      format = options.options;
    }
    format = cli.interaction.promptIfNotGiven($('Format: '), format, _);

    var tips = util.format($('Activate application version %s'), version);

    try {
      startProgress(tips);
      service.applicationOperations.activateApplicationPackage(options.resourceGroup, options.accountName, options.applicationId, options.version, format, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Version %s has been activated at application %s successfully'), version, applicationId));
  }

  /**
   * Delete the specified application package
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteApplicationPkg(resourcegroup, accountName, applicationId, version, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete application version %s? '), version), _)) {
        return;
      }
    }

    var tips = util.format($('Deleting application version %s'), version);
    try {
      startProgress(tips);
      service.applicationOperations.deleteApplicationPackage(options.resourceGroup, options.accountName, options.applicationId, options.version, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Version %s has been deleted from application %s successfully'), version, applicationId));
  }

  /**
   * Show the details of the specified application package
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function showApplicationPkg(resourcegroup, accountName, applicationId, version, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);
    var tips = $('Getting Batch application package information');

    var applicaiton = null;
    try {
      startProgress(tips);
      applicaiton = service.applicationOperations.getApplicationPackage(options.resourceGroup, options.accountName, options.applicationId, options.version, _);
    } finally {
      endProgress();
    }

    batchShowUtil.showAppPackage(applicaiton, cli.output);
  }
};
