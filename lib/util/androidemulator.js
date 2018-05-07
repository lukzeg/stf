var cmdExec = require('node-cmd')
var os = require('os')
var fs = require('fs')
var connect = require('net')
var shell = require('shelljs')
var q = require('q')

var devutil = require('./devutil')

var androidEmulator = module.exports = Object.create(null)

androidEmulator.getEmulatorNames = function() {
  var defer = Q.defer(),
             cmd = 'android list avd';
             shell.exec(cmd, {
             silent: true
             }, function(code, output) {
              var emulatedDeviceInfo = Object.create(null)
              if (code === 0) {
                var cmdOutput = output.toString().split('Android Virtual' +
                  ' Devices:').pop(-1).split('---------')
                for (var i = 0; i < cmdOutput.length; i++) {
                  var emulatorDetail = cmdOutput[i].split('\n')
                  emulatedDeviceInfo = Object.create(null)
                  for (var line = 0; line < emulatorDetail.length; line++) {
                    var tmpArray = emulatorDetail[line].split(':')
                    if (typeof tmpArray[1] === 'undefined') {
                      emulatedDeviceInfo[tmpArray[0].replace(/\s/g, '')] = tmpArray[1]
                    }
                    else {
                      emulatedDeviceInfo[tmpArray[0].replace(/\s/g, '')] = tmpArray[1].replace(/\s/g, '')
                    }
                  }
                }
                defer.resolve(deviceArrayCollectedFromCallListAVD.push(emulatedDeviceInfo))
              }
              else {
                console.error('emulator.create: error occured running', cmd);
                defer.reject(emulatedDeviceInfo);
              }
              });
  return defer.promise;
}

androidEmulator.stopEmulator = function(port) {
  var cmd = 'kill\r\nexit\r'
  var client = new connect.Socket()
  client.connect(port, 'localhost', () => {
    client.write(cmd)
  })
}

androidEmulator.startEmulator = function(name, port, execArgs) {

  var binaryOSName = 'emulator'
  if (os.type() === 'Windows_NT') {
    binaryOSName = 'emulator.exe'
  }

  var androidSdkPath = './'

  /* We need to point to correct location of .android folder
    where are storred informations about android emulators
  */
  if (devutil.androidSDKFileSexists(process.env.ANDROID_HOME + '/tools/' +
      binaryOSName) === true) {
      var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
  }

  var cmd = androidSdkPath + binaryOSName +' @' + name +
            ' -port ' + port + ' ' + execArgs

  var defer = Q.defer(),
              shell.exec(cmd, {
              silent: true
              }, function(code, output) {
               var data = Object.create(null)
                   data.emulatorName = name
                   data.port = port
                   data.startArgs = execArgs
               if (code === 0) {
                  data.status = 'started'
                  defer.resolve(data)
               }
               else {
                console.error('emulator.create: error occured running', cmd);
                defer.reject(output);
              }
              });

  return defer.promise;
}

androidEmulator.restartEmulatorByName = function(emuName, port, execArgs) {
  var binaryOSName = 'emulator'
  if (os.type() === 'Windows_NT') {
    binaryOSName = 'emulator.exe'
  }

  if (devutil.androidSDKFileSexists(process.env.ANDROID_HOME + '/tools/' +
      binaryOSName) === true) {
    var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
    deviceutil.startEmulator(androidSdkPath, binaryOSName, emuName, port, execArgs)
  }
}

androidEmulator.killSelectedEmulator = function(port) {
  var cmd = 'kill\r\nexit\r'
  var client = new connect.Socket()
  client.connect(port, 'localhost', () => {
    client.write(cmd)
  })
}

/*
  Info STF:
  To make emulator fully rotatatable it is needed to set emulator in reversed
  portrait mode.
  So at beginning when we create emulator it is good to call twice RotateEmulator
*/

androidEmulator.RotateEmulator = function(port) {
  var cmd = 'rotate\r\nexit\r'
  var client = new connect.Socket()
  client.connect(port, 'localhost', () => {
    client.write(cmd)
  })
}

androidEmulator.getRunningEmulatorName = function(serial, provider) {
  var cmd = 'avd name\r\nexit\r\n'
  var client = new connect.Socket()
  var emulatorSerial = serial
  client.connect(emulatorSerial.split('-')[1], 'localhost', () => {
    log.info('Connected to server')
    client.write(cmd)
  })

  client.on('data', (data) => {
    var emuName = data.toString().split('\n')[2].replace('\r', '')
    log.info('[' + emulatorSerial + '] emulator has name: ' + emuName)
    if (emuName.length > 0) {
      if (emulatorSerial.indexOf('-') !== -1) {
        emulatorSerial = provider + '-' + emulatorSerial.split('-').pop(-1)
        log.info('New serial is :' + emulatorSerial)
      }
      dbapi.setDeviceEmulatorName(emulatorSerial, emuName.replace(/\s/g, ''))
      }
    return emuName
  })
}

androidEmulator.createEmulator= function(emulatorUserArgs) {
  var cmd = 'android create avd ' + emulatorUserArgs
  var client = new connect.Socket()
  var cmdExec = require('node-cmd')
      var cmd = sdkPath + binaryOSName + ' -avd ' + name +
                ' -port ' + port + ' ' + execArgs
  cmdExec.get( cmd,
        function(err, data, stderr) {
          try{
            log.info('Err:' + err.toString())
          }
          catch (err) {
            return true
          }
        }
      )
}
