module.exports = function LogsCtrl($scope, LogcatService) {

  var deviceSerial = (window.location.href).split('/').pop();

  $scope.started = LogcatService.started

  $scope.filters = {}

  $scope.filters.levelNumbers = LogcatService.filters.levelNumbers

  LogcatService.filters.filterLines()

  $scope.$watch('started', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      LogcatService.started = newValue
      
      if (Object.keys(LogcatService.luzeEntries).indexOf(deviceSerial) > 0){
        LogcatService.started = LogcatService.luzeEntries[deviceSerial].started
        $scope.device.logs_enabled = started;
      }

      if (LogcatService.started) {
        $scope.control.startLogcat([]).then(function() {
        })

        if (typeof $scope.filters.priority == 'undefined') {
          if (LogcatService.started) {
            if (Object.keys(LogcatService.luzeEntries).indexOf(deviceSerial) <0){
              LogcatService.luzeEntries[deviceSerial]={logs : [], selectedLogLevel : 2 , started: true }
              $scope.device.logs_enabled = true
            }
            $scope.filters.priority = $scope.filters.levelNumbers[0]
          } 
        }
      } else {
        
        if (Object.keys(LogcatService.luzeEntries).indexOf(deviceSerial) > -1){
          LogcatService.luzeEntries[deviceSerial].started = false;
        }
        $scope.control.stopLogcat()
      }
    }
  })

  window.onbeforeunload = function() {
    if ($scope.control) {
      LogcatService.luzeEntries[deviceSerial].started = false;
      LogcatService.luzeEntries[deviceSerial].logs = [];
      $scope.control.stopLogcat()
    }
  }

  $scope.clear = function() {
    var deviceSerial = (window.location.href).split('/').pop();
    if (LogcatService.deviceSerial.indexOf(deviceSerial)> -1) {
      for (var i = LogcatService.deviceSerial.length - 1; i >= 0 ; i++ ) {
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
          var deviceSerial = (window.location.href).split('/').pop();
          LogcatService.filters[prop] = newValue
          LogcatService.luzeEntries[deviceSerial].selectedLogLevel= newValue.number
          if ($scope.filters.priority !== scope.filters.levelNumbers[LogcatService.luzeEntries[deviceSerial].selectedLogLevel - 2]) { 
            if (LogcatService.luzeEntries[deviceSerial].selectedLogLevel - 2 >= 0 ) {
              $scope.filters.priority = scope.filters.levelNumbers[LogcatService.luzeEntries[deviceSerial].selectedLogLevel - 2];
            }
          }
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
