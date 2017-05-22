# homebridge-radiothermostatfan

Supports Radio Thermostat HVAC Fan control on the HomeBridge Platform. It was designed around the CT50. More info at http://www.radiothermostat.com/

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-radiothermostat
3. Update your configuration file. See bellow for a sample.

# Configuration

Configuration sample:

 ```
    {
        "bridge": {
            ...
        },

        "description": "...",

        "accessories": [
            {
                "accessory": "RadioThermostatFan",
                "name": "HVAC Fan",
                "apiroute": "http://x.x.x.x",
            }
        ],

        "platforms":[]
    }

# Credits

Thanks to fordracerguy as his code was used as a template to build this.