 var _ = require('lodash')
var FileSaver = require('file-saver');

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
        var numberOfEntries = 0
        var deviceSerial = (window.location.href).split('/').pop();
        
        scope.started = checkLoggerServiceStatus(true)
        
        function checkLoggerServiceStatus(loadLogs=false) {
          var collectedLogs = []

          //LogcatService.entries
          // Newly added by luze
          if (Object.keys(LogcatService.luzeEntries).indexOf(deviceSerial) > -1) {
            collectedLogs =  LogcatService.luzeEntries[deviceSerial].logs
          }
          
          for (var logLine = 0 ; logLine < collectedLogs.length; logLine++) {
            if ( deviceSerial.indexOf(collectedLogs[logLine].serial) > -1 ) {
              if (loadLogs) {
                restoreLogs(collectedLogs)
              }
              return LogcatService.luzeEntries[deviceSerial].started
            }
          }
          return false
        }

        function incrementNumberEntry() {
          if ( element.find('tbody')[0].rows.length > maxEntriesBuffer) {
            myDeleteFunction()
          }
        }

        function myDeleteFunction() {
          element.find('tbody')[0].deleteRow(0);
        }

        LogcatService.addEntryListener = function(entry) {
          
          scope.started =( (deviceSerial.indexOf(entry.serial) > -1) ? true : false )
          console.log(entry.logsSerial)
          if ( deviceSerial.indexOf(entry.serial) > -1 ) {
            incrementNumberEntry()
            addRow(body, entry)
          }
        }

        LogcatService.addFilteredEntriesListener = function(entries) {
          //clearTable()
          checkLoggerServiceStatus()
          //_.each(entries, function(entry) {
          // TODO: This is not adding all the entries after first scope creation
          //   incrementNumberEntry()
          //  addRow(body, entry, true)
          //})
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
          numberOfEntries = 0
          clearTable()
        }

        function restoreLogs(collectedLogs) {
          if (scope.filters.priority !== scope.filters.levelNumbers[LogcatService.luzeEntries[deviceSerial].selectedLogLevel - 2]) { 
            if (LogcatService.luzeEntries[deviceSerial].selectedLogLevel - 2 >= 0 ) {
              scope.filters.priority = scope.filters.levelNumbers[LogcatService.luzeEntries[deviceSerial].selectedLogLevel - 2];
            }
          }
          
          clearTable()
          for (var logLine = 0 ; logLine < collectedLogs.length; logLine++) {
            if ( deviceSerial.indexOf(collectedLogs[logLine].serial) > -1 ) {
              addRow(body, collectedLogs[logLine], true)
            }
          }
        }

        scope.saveLogs =  function(){
          var matches = document.querySelectorAll('[title="Save Logs"]');
          var filename = deviceSerial + "_logs.log"
          var a = matches[0];
          var logsArray = []

          //LogcatService.entries
          if (Object.keys(LogcatService.luzeEntries).indexOf(deviceSerial) > -1) {
            collectedLogs =  LogcatService.luzeEntries[deviceSerial].logs
          }
          var toSave = ""
          if (logsArray.length > 0) {
            toSave = {"deviceOS": logsArray[0].deviceLabel,
                          "serial": logsArray[0].serial,
                          "logs": []}
            for (var line = 0 ; line < logsArray.length; line ++) {
              toSave.logs.push({"date": logsArray[line].date,
                              "pid": logsArray[line].pid,
                              "tag": logsArray[line].tag,
                              "priorityLabel": logsArray[line].priorityLabel,
                              "message": logsArray[line].message})
            }
          }
          var blob = new Blob([JSON.stringify(toSave)], {type: "application/json;charset=utf-8"});
          FileSaver.saveAs(blob, deviceSerial + "_logs.json");
        }

        scope.$on('$destroy', function() {
          parent.removeEventListener('scroll', throttledScrollListener)
        })
      }
    }
  }
