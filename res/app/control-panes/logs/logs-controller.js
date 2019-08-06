module.exports = function LogsCtrl($scope, $routeParams, LogcatService) {

  var deviceSerial = $routeParams.serial
  var routeState = $routeParams.restoreFilters
  console.log('routParams.cleanup', $routeParams.cleanUp)
  console.log(' LogcatService.allowCleanUp',  LogcatService.allowCleanUp)
  var cleanDevice =  (window.location.href).split('/').pop()
  console.log('deviceSerial', deviceSerial)
  cleanDeviceSettings()

  $scope.started = checkLogBtnStatus() === null ? LogcatService.started : checkLogBtnStatus

  $scope.filters = {}

  $scope.filters.levelNumbers = LogcatService.filters.levelNumbers

  LogcatService.filters.filterLines()

  restoreFilters()
  setFiltersPriority()

  function cleanDeviceSettings() {
    console.log('cleanDevice', cleanDevice)
    console.log('deviceSerial', deviceSerial)
    console.log('eqals?', cleanDevice === deviceSerial)
    if ($routeParams.cleanUp && LogcatService.allowCleanUp) {
      console.log(Object.keys(LogcatService.deviceEntries).includes(deviceSerial))
      console.log(LogcatService.deviceEntries)
      if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {        
        delete LogcatService.deviceEntries[deviceSerial]
        
        console.log('deviceSerial', deviceSerial)
        console.log(LogcatService.deviceEntries)
        console.log('Device was cleaned')
        LogcatService.allowCleanUp = false
        console.log(' LogcatService.allowCleanUp', LogcatService.allowCleanUp)
      }
    } else if(!$routeParams.cleanUp) {
      LogcatService.allowCleanUp = true
      console.log('scope.cleanup chaging status', LogcatService.allowCleanUp)
    }
  }

  function setFiltersPriority() {
    if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
      $scope.filters.priority = $scope.filters.levelNumbers[
        LogcatService.deviceEntries[deviceSerial].selectedLogLevel - 2]
    } else {
      if ($scope.started) {
        $scope.filters.priority = $scope.filters.levelNumbers[0]
      }
    }
  }

  function restoreFilters() {
    if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
      Object.keys(LogcatService.deviceEntries[deviceSerial].filters).forEach(function(entry) {
        if ('filter.' + entry !== 'filter.priority') {
          $scope.filters[entry] = LogcatService.deviceEntries[deviceSerial].filters[entry]
        } else {
          setFiltersPriority()
        }
      })
    }
  }

  function checkLogBtnStatus() {
    if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
      if ($scope !== null && $scope.device !== null) {
        if($scope.device.logs_enabled && LogcatService.deviceEntries[deviceSerial].started) {
          return LogcatService.deviceEntries[deviceSerial].started
        }
      }
    }
    return null
  }

  $scope.$watch('started', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      LogcatService.started = newValue
      
      if (LogcatService.started) {
        $scope.control.startLogcat([]).then(function() {
        })

        if (typeof $scope.filters.priority == 'undefined') {
          if (!Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            LogcatService.deviceEntries[deviceSerial] = {logs: [], selectedLogLevel: 2, started: true,
              filters: {
                'message': '',
                'pid': '',
                'tid': '',
                'dateLabel': '',
                'date': '',
                'tag': '',
                'priority': '',
              }
            }
          }
        }

        LogcatService.deviceEntries[deviceSerial].started = true
        $scope.device.logs_enabled = true
        setFiltersPriority()

      } else {
        if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
          LogcatService.deviceEntries[deviceSerial].started = false
        }

        LogcatService.started = false
        $scope.device.logs_enabled = false
        $scope.control.stopLogcat()
      }
    }
  })

  window.onbeforeunload = function() {
    if ($scope.control) {
      for(var i = 0; i < LogcatService.deviceEntries.length; i++) {
        if(LogcatService.deviceEntries[i] === deviceSerial) {
          LogcatService.deviceEntries.splice(i, 1)
        }
      }
      LogcatService.started = false
      $scope.control.stopLogcat()
      console.log('onbeforeunload scope.cleanup', LogcatService.allowCleanUp)
    }
  }

  $scope.clear = function() {
    var deviceSerial = (window.location.href).split('/').pop()
    if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
      for (var i = LogcatService.deviceSerial.length - 1; i >= 0; i++) {
        if (LogcatService.deviceSerial[i] === deviceSerial) {
          LogcatService.deviceSerial.splice(i, 1)
        }
      }
    }
  }

  function defineFilterWatchers(props) {
    angular.forEach(props, function(prop) {
      $scope.$watch('filters.' + prop, function(newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
          var deviceSerial = (window.location.href).split('/').pop()
          LogcatService.filters[prop] = newValue
          if (!Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            LogcatService.initDeviceLogCollector(deviceSerial)
          }

          var transformedInput = ''
          switch('filters.' + prop) {
            case 'filters.priority':
            case 'filters.levelNumber':
              if (newValue !== null && !isNaN(newValue.number)) {
                LogcatService.deviceEntries[deviceSerial].selectedLogLevel = newValue.number
                $scope.filters.priority = $scope.filters.levelNumbers[
                  LogcatService.deviceEntries[deviceSerial].selectedLogLevel - 2]
              }
              break
            case 'filters.pid':
              transformedInput = newValue.replace(/[^0-9:]/g, '')
              if (transformedInput !== newValue) {
                $scope.filters.pid = transformedInput
              }
              break
            case 'filters.tid':
              transformedInput = newValue.replace(/[^0-9]/g, '')
              if (transformedInput !== newValue) {
                $scope.filters.tid = transformedInput
              }
              break

            default:
              transformedInput = newValue
          }

          // Exclude Debug Level info
          if (prop !== 'levelNumber' && prop !== 'priority') {
            LogcatService.deviceEntries[deviceSerial].filters[prop] = transformedInput
          }

          LogcatService.filters[prop] = transformedInput

          // Check if scope is defined
          if ($scope !== 'undefined') {
            setFiltersPriority()
          }
          LogcatService.allowCleanUp = false
        }
      })
    })
  }

  defineFilterWatchers([
    'levelNumber',
    'message',
    'pid',
    'tid',
    'dateLabel',
    'date',
    'tag',
    'priority'
  ])
}
