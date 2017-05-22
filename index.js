var Service, Characteristic;
var request = require('request');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-ftfan', 'RadioThermostatFan', ThermostatFan);
};

function stamp() {
    return parseInt(new Date() / 1000);
}

function ThermostatFan(log, config) {
    this.log = log;
    this.name = config.name;
    this.apiroute = config.apiroute || 'apiroute';
    this.log(this.name, this.apiroute);

    this.fmode = 0;
    this.lastUpdate = 0;
    this.querying = false;
    this.lastJson = '';

    this.fanMode = 0; // off 

    
    this.service = new Service.Fan(this.name);
}

ThermostatFan.prototype = {
    requestWrapper: function (uri, fields, callback) {
        var method = (fields) ? 'POST' : 'GET';
        var commonQuery = (uri == 'tstat' && method == 'GET');

        if (this.querying && commonQuery) {
            // we have another query in progress, let's wait until that one finishes
            setTimeout(function (parm) {
                parm.requestWrapper(uri, fields, callback);
            }, 500, this);
        } else if (commonQuery && this.lastUpdate > stamp() - 15) {
            // use existing data if available - speeds up communication significantly
            callback(null, this.lastJson)
        } else {
            if (commonQuery) this.querying = true;
            if (method == 'POST') this.log(JSON.stringify(fields));

            request({
                method: method,
                url: this.apiroute + '/' + uri,
                form: JSON.stringify(fields)
            }, function (error, response, body) {
                this.querying = false;

                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);

                    if (commonQuery) {
                        this.lastJson = json;
                        this.lastUpdate = stamp();
                    }

                    callback(null, json)
                } else {
                    callback(error, body)
                }
            }.bind(this));
        }
    },
        
    getOn: function (callback) {
        this.log('getOn from:', this.apiroute + '/tstat');

        this.requestWrapper('tstat', null, function (error, json) {
            if (error) {
                this.log('getOn error: %s', error);
                callback(error);
            } else {
                if (json.fmode === 0) { 
                    this.fmode = 0;
                }
                else {
                    this.fmode = 1;
                }

                this.log('Target mode is %s', this.fmode);
                callback(null, this.fmode);
            }
        }.bind(this));
    },

    setOn: function (value, callback) {
        this.log('setOn from:', this.apiroute + '/tstat - ' + value);
               
        var fields = {};
        //    if (this.targetHeatingCoolingState == 1) {
        //      fields['t_heat'] = value;
        //    } else if (this.targetHeatingCoolingState == 2) {
        //      fields['t_cool'] = value;
        //    } else {
        fields['fmode'] = value === 0 ? 0 : 2;
        
        //    }

        this.requestWrapper('tstat', fields, function (error, json) {
            if (error) {
                this.log('setOn error: %s', err);
                callback(err);
            } else {
                callback(null);
            }
        }.bind(this));
    },

    getName: function (callback) {
        this.log("getName :", this.name);
        callback(null, this.name);
    },

    getServices: function () {
        // you can OPTIONALLY create an information service if you wish to override the default values for things like serial number, model, etc.
        var informationService = new Service.AccessoryInformation();
        informationService.setCharacteristic(Characteristic.Manufacturer, "RT").setCharacteristic(Characteristic.Model, "Virtual Model Fan").setCharacteristic(Characteristic.SerialNumber, "1");

        // required characteristics        
        this.service.getCharacteristic(Characteristic.On).on('get', this.getOn.bind(this)).on('set', this.setOn.bind(this));       
        this.service.getCharacteristic(Characteristic.Name).on('get', this.getName.bind(this));
       
        return [informationService, this.service];
    }
};