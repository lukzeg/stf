var _ = require('lodash')
var FileSaver = require('file-saver')

module.exports =
  function logcatTableDirective($rootScope, $timeout, LogcatService) {
    return {
      restrict: 'E',
      replace: true,
      template: require('./logcat-table.pug'),
      link: function(scope, element) {
        var autoScroll = true
        var autoScrollDependingOnScrollPosition = true
        var scrollPosition = 0
        var scrollHeight = 0
        var parent = element[0]
        var body = element.find('tbody')[0]
        var maxEntriesBuffer = 3000
        var maxVisibleEntries = 100
        var deviceSerial = (window.location.href).split('/').pop()
        
        scope.allowClean = true

        scope.started = checkLoggerServiceStatus(true)
        console.log('logcatTableDirective', $rootScope)
        function checkLoggerServiceStatus(loadLogs = false) {
          var collectedLogs = []

          if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            collectedLogs = LogcatService.deviceEntries[deviceSerial].logs
          }
          
          for (var logLine = 0; logLine < collectedLogs.length; logLine++) {
            if (deviceSerial === collectedLogs[logLine].serial) {
              if (loadLogs) {
                restoreLogs(collectedLogs)
              }
              return LogcatService.deviceEntries[deviceSerial].started
            }
          }
          return false
        }

        function incrementNumberEntry() {
          if (element.find('tbody')[0].rows.length > maxVisibleEntries) {
            myDeleteFunction()
          }
        }

        function myDeleteFunction() {
          element.find('tbody')[0].deleteRow(0)
        }

        LogcatService.addEntryListener = function(entry) {
          if (deviceSerial === entry.serial) {
            incrementNumberEntry()
            addRow(body, entry)
          }
        }

        LogcatService.addFilteredEntriesListener = function(entries) {
          checkLoggerServiceStatus()
        }

        function shouldAutoScroll() {
          if (autoScrollDependingOnScrollPosition) {
            return scrollPosition === scrollHeight
          } else {
            return true
          }
        }

        function scrollListener(event) {
          scrollPosition = event.target.scrollTop + event.target.clientHeight
          scrollHeight = event.target.scrollHeight
        }

        var throttledScrollListener = _.throttle(scrollListener, 100)
        parent.addEventListener('scroll', throttledScrollListener, false)

        function scrollToBottom() {
          parent.scrollTop = parent.scrollHeight + 20
          $timeout(function() {
            parent.scrollTop = parent.scrollHeight
          }, 10)
        }

        function addRow(rowParent, data, batchRequest) {
          var newRow = rowParent.insertRow(-1)

          newRow.classList.add('log-' + data.priorityLabel)
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.priorityLabel))
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.dateLabel))
          if ($rootScope.platform === 'native') {
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.pid))
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.tid))
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.tag))
          }
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.message))

          if (autoScroll && shouldAutoScroll() && !batchRequest) {
            _.throttle(scrollToBottom, 30)()
          }
        }

        function clearTable() {
          var oldBody = body
          var newBody = document.createElement('tbody')
          oldBody.parentNode.replaceChild(newBody, oldBody)
          body = newBody
        }

        scope.clearTable = function() {
          LogcatService.clear()
          clearTable()
        }

        function restoreLogs(collectedLogs) {
          clearTable()

          var startFrom = 0
          if (collectedLogs.length - maxEntriesBuffer >= 0) {
            startFrom = collectedLogs.length - maxEntriesBuffer
          }
          
          for (var logLine = startFrom; logLine < collectedLogs.length; logLine++) {
            if (deviceSerial === collectedLogs[logLine].serial) {
              addRow(body, collectedLogs[logLine], true)
            }
          }
        }

        /**
           * Validate filter.data object value and assign bordercolor to red if value
           * doesn't match regex(pattern):
           * - HH:mm:ss.SSS
           * - H:mm:ss.SSS
           * - :mm:SS.SSS
           * - mm:ss.SSS
           * - m:ss.SSS
           * -... combinations
           *  in other case colour will be set to default.
           *
           * @param {event} event object
           */
        scope.validateDate = function(e) {
          var pattern = ['^(?:(?:([0-1]?\\d|2[0-3]):)?(:[0-5]\\d|[0-5]\\d):|\\d)',
            '?(:[0-5]\\d|[0-5]\\d{1,2})?(\\.[0-9]?\\d{0,2}|:[0-5]?\\d{0,1})|(\\d{0,2})'].join([])
          var regex = new RegExp(pattern, 'g')
          var inputValue = event.srcElement.value
          var matchArray = inputValue.match(regex)
          var isTextValid = false
          if (matchArray) {
            matchArray.forEach(function(item, index) {
              if (item === inputValue) {
                isTextValid = true
                event.srcElement.style.borderColor = ''
              }
            })
          }

          if (isTextValid === false) {
            event.srcElement.style.borderColor = 'red'
          }
        }

        scope.saveLogs = function() {
          var matches = document.querySelectorAll('[title="Save Logs"]')
          var filename = deviceSerial + '_logs.log'
          var a = matches[0]
          var collectedLogs = []

          if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            collectedLogs = LogcatService.deviceEntries[deviceSerial].logs
          }
         
          var toSave = ''
          if (collectedLogs.length > 0) {
            toSave = {'deviceOS': collectedLogs[0].deviceLabel,
                      'serial': collectedLogs[0].serial,
                      'logs': []}
            for (var line = 0; line < collectedLogs.length; line++) {
              toSave.logs.push({'date': collectedLogs[line].date,
                                'pid': collectedLogs[line].pid,
                                'tag': collectedLogs[line].tag,
                                'priorityLabel': collectedLogs[line].priorityLabel,
                                'message': collectedLogs[line].message})
            }
          }
          var blob = new Blob([JSON.stringify(toSave)], {type: 'application/json;charset=utf-8'})
          FileSaver.saveAs(blob, deviceSerial + '_logs.json')
        }

        scope.$on('$destroy', function() {
          parent.removeEventListener('scroll', throttledScrollListener)
        })
      }
    }
  }
