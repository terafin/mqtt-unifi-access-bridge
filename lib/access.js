const _ = require('lodash')
const logging = require('homeautomation-js-lib/logging.js')
const authentication = require('./auth.js')
const utils = require('./utils.js')
const got = require('got')
const API_LOG_SUFFIX = '/proxy/access/api/v2/dashboard/timeline'
    // https://unifi.siliconspirit.net/proxy/access/api/v2/dashboard/timeline?event_line_size=8&timestamp=1618277999&interval=20&scale_time=5
    // https://unifi.siliconspirit.net/proxy/access/api/v2/dashboard/timeline?event_line_size=8&interval=20&scale_time=5

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

var lastQueryTime = null

const formatDate = function(date) {
    if (_.isNil(date)) return ''

    // '2020-08-10T17:54:07-07:00'
    // logging.info('request to format date: ' + date)
    var formattedDate = date.getFullYear() +
        '-' + (date.getMonth() + 1) +
        '-' + date.getDate() +
        'T' +
        '' + date.getHours() +
        ':' + date.getMinutes() +
        ':' + date.getSeconds() +
        '' + date.getTimezoneOffset() +
        ':00' +
        ''

    // logging.info('formatted date: ' + date + '   result: ' + formattedDate)
    return formattedDate
}

// https://unifi.siliconspirit.net/proxy/access/api/v2/dashboard/timeline?event_line_size=8&timestamp=1618277999&interval=20&scale_time=5

async function queryLogs(since) {
    await authentication.authenticateifNeeded()
    const logURL = utils.generateURL(API_LOG_SUFFIX + '?event_line_size=8&interval=20&scale_time=5')

    var log_body = null
    var json_body = { filter: 'event.type sw "resource.da.open"' }
    if (!_.isNil(since)) {
        json_body[since] = formatDate(since)
    }

    logging.debug('log url: ' + logURL)
    try {
        const log_response = await got.get(logURL, {
            headers: {
                ...authentication.cachedAuthHeaders()
            }
        })

        logging.debug('log body: ' + log_response.body)
        log_body = JSON.parse(log_response.body)
    } catch (error) {
        logging.error('get logs failed: ' + error)
        throw ('queryLogs error ' + error)
    }

    return log_body
}

module.exports.queryLogs = queryLogs