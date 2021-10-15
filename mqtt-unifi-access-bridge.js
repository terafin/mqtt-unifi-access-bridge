// Requirements
const mqtt = require('mqtt')
const _ = require('lodash')
const logging = require('homeautomation-js-lib/logging.js')
const health = require('homeautomation-js-lib/health.js')
const mqtt_helpers = require('homeautomation-js-lib/mqtt_helpers.js')
const got = require('got')
const interval = require('interval-promise')
const authentication = require('./lib/auth.js')
const access = require('./lib/access.js')
const utils = require('./lib/utils.js')

const username = process.env.USERNAME
const password = process.env.PASSWORD

authentication.setAccount(username, password)

var authenticate_poll_time = process.env.AUTH_POLL_FREQUENCY

if (_.isNil(authenticate_poll_time)) {
    authenticate_poll_time = 60 * 60
}

var pollTime = process.env.POLL_FREQUENCY

if (_.isNil(pollTime)) {
    pollTime = 1
}

var shouldRetain = process.env.MQTT_RETAIN

if (_.isNil(shouldRetain)) {
    shouldRetain = false
}

var mqttOptions = { qos: 1 }

if (!_.isNil(shouldRetain)) {
    mqttOptions['retain'] = shouldRetain
}

// Config
const baseTopic = process.env.TOPIC_PREFIX

if (_.isNil(baseTopic)) {
    logging.warn('TOPIC_PREFIX not set, not starting')
    process.abort()
}

var connectedEvent = function() {
    health.healthyEvent()
}

var disconnectedEvent = function() {
    health.unhealthyEvent()
}


// Setup MQTT
var client = mqtt_helpers.setupClient(connectedEvent, disconnectedEvent)

var lastPollTime = null

var lastPublishTimeMap = {}
const timeToWaitForSlowLogs = 10

async function poll() {
    try {
        const logs = await access.queryLogs(lastPollTime)
        logging.debug('logs: ' + JSON.stringify(logs))
        const data = logs.data
        if (!_.isNil(data)) {
            const now = new Date()

            data.event.forEach(event => {
                const events = event.events
                if (!_.isNil(events)) {
                    events.forEach(actual_event => {

                        logging.debug('actual_event: ' + JSON.stringify(actual_event))
                        const name = actual_event.name
                        const result = actual_event.result
                        const time = Number(actual_event.event_time) * 1000
                        const type = actual_event.door_entry_method
                        const user_id = actual_event.user_id
                        const location = actual_event.location
                        const event_date = Date(time)
                        const event_date_diff_in_seconds = (now.getTime() - time) / 1000

                        if (!_.isNil(type) && !_.isNil(time) && !_.isNil(result) && !_.isNil(name)) {
                            if (result == 'ACCESS') {

                                const lastPublished = lastPublishTimeMap[user_id]
                                logging.debug('  => event_date: ' + event_date + '   lastPublished: ' + lastPublished)
                                if (!_.isNil(lastPublished) && (time == lastPublished)) {
                                    logging.debug('  => same event, skipping time: ' + time + '   lastPublished: ' + lastPublished)

                                } else if (event_date_diff_in_seconds < timeToWaitForSlowLogs) {
                                    logging.info(' => Sending unlock for: ' + location + '   topic: ' + mqtt_helpers.generateTopic(baseTopic, location, 'unlocked') + '   name: ' + mqtt_helpers.generateTopic(name))

                                    lastPublishTimeMap[user_id] = time
                                    client.publish(mqtt_helpers.generateTopic(baseTopic, location, 'unlocked'), mqtt_helpers.generateTopic(name), mqttOptions)
                                } else {
                                    logging.debug('  => EVENT IS OLD, based on no poll time, and out of ' + timeToWaitForSlowLogs + 's')
                                }

                                lastPollTime = now
                            }
                        }
                    })
                }
            })
        }
    } catch (error) {
        logging.error('Failed to poll: ' + error)
        throw (error)
    }
}

async function startWatching() {
    logging.info('starting poll')
    try {
        await authentication.authenticateifNeeded()
    } catch (error) {
        logging.error('failed authentication: ' + error)
    }

    interval(async() => {
        try {
            poll()
        } catch (error) {
            logging.error('error polling: ' + error)
        }
    }, pollTime * 1000)

    interval(async() => {
        logging.info(' => polling auth')
        await authentication.authenticate()
    }, authenticate_poll_time * 1000)
}


startWatching()