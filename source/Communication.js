enyo.kind({
	name:"Centurion.Communication",
	kind:"Component",

	published:{
		command:''
	},

	events:{
		onOpenReady:"",
		onReadCommand:""
	},

	components:[
		{ kind:"PalmService", name:"sppSubscription", subscribe:true},
		{ kind:"PalmService", name:"sppService"}
	],

	open:function() {
		// SPP connection instanceId
		this.instanceId = 0;

		this.$.sppService.call({}, {
			service:"palm://com.palm.bluetooth/gap/",
			method:"gettrusteddevices",
			onResponse:"getDevicesResponse"
		});
	},

	close:function() {
		this.disconnectSPP();
	},

	write:function(cmd) {
		this.command = cmd;
		enyo.job("writePort", enyo.bind(this, "writePort"), 100);
	},

	getDevicesResponse:function (inSender, inResponse) {

		// If we found trusted device(s)...
		if (inResponse.returnValue) {
			console.log("gettrusteddevices: " + inResponse.returnValue);
			this.trustedDevicesFound(inResponse);
		} else {
			this.trustedDevicesNotFound(inResponse);
		}

	},

	openSPPReady:function (inSender, inReponse) {
		console.log("openSuccess: " + enyo.json.stringify(inReponse));

		// Set interval (2500 ms) to call readPort
		enyo.job("readPort", enyo.bind(this, "readPort"), 250);
//		enyo.job("writePort", enyo.bind(this, "writePort"), 4500);

		this.doOpenReady();
	},

	openSPPFail:function (inSender, inReponse) {
		console.log("openSPPFail");
	},

	readPort:function (inSender, inReponse) {
		console.log("SPP Read Port:");

		// Read port
		this.$.sppService.call({
							"instanceId":this.instanceId,
							"dataLength":1
						},
						{
							service:"palm://com.palm.service.bluetooth.spp/",
							method:"read",
							onSuccess:"readPortSuccess",
							onFailure:"readPortFailure"
						});
	},

	writePort:function (inSender, inReponse) {
		console.log("SPP Write Port: " + this.command);

		// Write port
		this.$.sppService.call({
							"instanceId":this.instanceId,
							"data":this.command,
							"dataLength":1
						},
						{
							service:"palm://com.palm.service.bluetooth.spp/",
							method:"write",
							onSuccess:"writePortSuccess",
							onFailure:"writePortFailure"
						});
	},

	writePortSuccess:function (inSender, inReponse) {
		console.log("Write Success!");
	},

	readPortSuccess:function (inSender, inReponse) {
		console.log("Read Success: " + inReponse.returnValue + " Data Length: " + inReponse.dataLength + " Data: " + inReponse.data);

		/* Get the NMEA text output and parse - see NMEA specs online for more deatails*/
		if (inReponse.returnValue === true) {
			console.log("Read command: " + inReponse.data);
			this.setCommand(inReponse.data);
			this.doReadCommand();
		} else {
			console.log("Unable to read from SPP Port. Unknown error.");
		}

		enyo.job("readPort", enyo.bind(this, "readPort"), 250);
	},

	readPortFailure:function (inSender, inReponse) {
		console.log("readPortFailure");
	},

	writePortFailure:function (inSender, inReponse) {
		console.log("writePortFailure");
	},

	selectServiceResponse:function (inSender, inResponse) {
		console.log("selectServiceResponse - " + enyo.json.stringify(inResponse));
	},

	sppNotify:function (inSender, inResponse) {
		console.log("sppNotify: " + enyo.json.stringify(inResponse));

		// SPP connection instanceId
		this.instanceId = inResponse.instanceId;

		for (var key in inResponse) {
			if (key === "notification") {
				switch (inResponse.notification) {
					case "notifnservicenames":
						console.log("notifnservicenames: SPP service name: " + inResponse.services[0]);

						// Send select service response - When successful, this is when device flashes "connected to palm gps" message
						this.$.sppService.call(
										{
											"instanceId":this.instanceId,
											"servicename":inResponse.services[0]
										},
										{
											service:"palm://com.palm.bluetooth/spp/",
											method:"selectservice",
											onResponse:"selectServiceResponse"
										}
						);

						return;
						break;

					case "notifnconnected":
						console.log("notifnconnected: SPP Connected");

						if (inResponse.error === 0) {

							this.$.sppService.call({
												"instanceId":this.instanceId
											},
											{
												service:"palm://com.palm.service.bluetooth.spp/",
												method:"open",
												onSuccess:"openSPPReady",
												onFailure:"openSPPFail"
											});

						}
						return;

						break;

					case "notifndisconnected":
						console.log("notifndisconnected: Device has terminated the connection or is out of range...");
						break;

					default:
						console.log(inResponse.notification + ": not handled");
						break;
				}
			}
		}

	},

	trustedDevicesFound:function (objData) {
		console.log(">>>> Trusted Devices Found.");

		// Address of our bluetooth device
		this.targetAddress = "";

		// Are there any trusted devices containing 'GPS' || 'gps' with name - Change this based on your device id
		var targetDevice = /049C/i;

		if (objData.trusteddevices) {
			for (i = 0; i < objData.trusteddevices.length; i++) {

				//assumes "GPS" is within the name of the bluetooth device
				if (objData.trusteddevices[i].name.search(targetDevice) > -1) {
					console.log("Found: " + objData.trusteddevices[i].address);
					this.targetAddress = objData.trusteddevices[i].address;
				}
			}

			// Call & subscribe to spp service
			this.$.sppSubscription.call({}, {
				service:"palm://com.palm.bluetooth/spp/",
				method:"subscribenotifications",
				onResponse:"sppNotify"
			});

			// If bluetooth target address exists
			if (this.targetAddress !== "") {

				// Connect to our bluetooth device
				this.$.sppService.call({
					"address":this.targetAddress
				}, {
					service:"palm://com.palm.bluetooth/spp/",
					method:"connect"
				});
			}

		}

	},

	trustedDevicesNotFound:function (objData) {
		console.log("No Trusted Bluetooth Devices Found: " + enyo.json.stringify(objData));
	},

	// === Disconnect SPP when app closed

	sppDisconnectResponse:function () {
		console.log("sppDisconnectResponse");
	},

	sppDisconnectSuccess:function () {
		console.log("sppDisconnectSuccess");
	},
	sppDisconnectFailure:function () {
		console.log("sppDisconnectFailure");
	},

	closeFailure:function () {
		console.log("closeFailure");
	},

	closeSuccess:function () {
		console.log("closeSuccess");
	},

	disconnectSPP:function () {
		/* disconnectSPP() - Disconnect SPP Device
		 * !!!!Very Important!!!!
		 * Disconnect from the SPP device when exiting the application!
		 */

		// Clear the interval that requests our GPS data
		enyo.job.stop("readPort");
		enyo.job.stop("writePort");

		// Close our SPP connection
		this.$.sppService.call({
							"instanceId":this.instanceId
						},
						{
							service:"palm://com.palm.service.bluetooth.spp/",
							method:"close",
							onSuccess:"closeSuccess",
							onFailure:"closeFailure"
						});

		// Disconnect our SPP instance
		this.$.sppService.call(
						{
							"address":this.targetAddress,
							"instanceId":this.instanceId
						},
						{
							service:"palm://com.palm.bluetooth/spp/",
							method:"disconnect",
							onResponse:"sppDisconnectResponse",
							onSuccess:"sppDisconnectSuccess",
							onFailure:"sppDisconnectFailure"
						}
		);
	}

});