enyo.kind({
	name:"Main.Centurion",
	kind:"VFlexBox",
	className: "logo",
	components:[
		{ kind:"Sound", name: "byc", src: "sounds/byc.wav", preload: true},
		{ kind:"Sound", name: "eye", src: "sounds/eye.wav", preload: true},
		{ kind:"PalmService", name:"sppSubscription", subscribe:true},
		{ kind:"PalmService", name:"sppService"},
		{ kind:"PageHeader", content:"Centurion", flex:0 },
		{ kind:"RichText", name:"outputData", flex:1, allowHtml:true, maxTextHeight: 100 },
		{ kind:"Button", name:"activate", caption:"Activate", onclick: "activateButton", disabled: true, style: "margin: 0 200px 20px 200px"}
	],

	activateButton: function() {
		if (this.$.activate.getCaption() == "Activate") {
			console.log("Activate");
			this.$.activate.setCaption("Deactivate");
			this.$.eye.audio.countdown = 3;
			this.$.eye.play();
		} else {
			this.$.eye.audio.countdown = -1;
			this.$.activate.setCaption("Activate");
		}
		enyo.job("writePort", enyo.bind(this, "writePort"), 100);
	},
	
	buttonToggle: function(inSender, inState) {
    console.log("Toggled to state" + inState);
		enyo.job("writePort", enyo.bind(this, "writePort"), 100);
	},

	create:function () {
		this.inherited(arguments);

		// SPP connection instanceId
		this.instanceId = 0;

		// logInfo method will print logs to device screen
		console.log("Starting Service");

		// Retrieve list of trusted bluetooth devices
		this.$.sppService.call({}, {
			service:"palm://com.palm.bluetooth/gap/",
			method:"gettrusteddevices",
			onResponse:"getDevicesResponse"
		});
	},

	rendered: function() {
		this.$.byc.audio.newvar = this;
		this.$.byc.audio.addEventListener(
			 'ended', function(){
					this.newvar.$.eye.play();
			 }, false);

		this.$.eye.audio.newvar = this;
		this.$.eye.audio.addEventListener(
			 'ended', function(){
					if (this.countdown != -1) {
						if (this.countdown != 1) {
							this.newvar.$.eye.play();
						} else {
							this.newvar.$.byc.play();
						}
						if (this.countdown > 0)
							this.countdown--;
					}
			 }, false);

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
		//this.$.outputData.addContent("<br/> Open Success.");
		this.$.outputData.setValue(this.$.outputData.getValue() + "<br/> Open Success.");

		// Set interval (2500 ms) to call readPort
//		enyo.job("readPort", enyo.bind(this, "readPort"), 2500);
//		enyo.job("writePort", enyo.bind(this, "writePort"), 4500);
		this.$.activate.setDisabled(false);
	},
	
	openSPPFail:function (inSender, inReponse) {
		console.log("openSPPFail");
	},
	
	readPort:function (inSender, inReponse) {
		console.log("SPP Read Port:");

		// Read port
		this.$.sppService.call({
							"instanceId":this.instanceId,
							"dataLength":1024
						},
						{
							service:"palm://com.palm.service.bluetooth.spp/",
							method:"read",
							onSuccess:"readPortSuccess",
							onFailure:"readPortFailure"
						});
	},
	
	writePort:function (inSender, inReponse) {
		console.log("SPP Write Port:");

		var state = "0";

		if (this.$.activate.getCaption() == "Activate") {
			state = "0";
		} else {
			state = "1"
		}

		// Write port
		this.$.sppService.call({
							"instanceId":this.instanceId,
							"data": state,
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
		console.log("Read Success: " + inReponse.returnValue + " Data Length: " + inReponse.dataLength);

		/* Get the NMEA text output and parse - see NMEA specs online for more deatails*/
		if (inReponse.returnValue === true) {
		} else {
			this.$.outputData.setValue(this.$.outputData.getValue() + "<br/> Unable to read from SPP Port. Unknown error.");
		}

		this.openSPPReady(this, {"returnValue":true});
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
		this.$.outputData.setValue(this.$.outputData.getValue() + "<br/> SPP Notify. " + enyo.json.stringify(inResponse));

		// SPP connection instanceId
		this.instanceId = inResponse.instanceId;

		for (var key in inResponse) {
			if (key === "notification") {
				switch (inResponse.notification) {
					case "notifnservicenames":
						console.log("SPP service name: " + inResponse.services[0]);

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
						console.log("SPP Connected");
						this.$.outputData.setValue(this.$.outputData.getValue() + "<br/> SPP Connected.");

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
						console.log("Device has terminated the connection or is out of range...");
						this.$.outputData.setValue(this.$.outputData.getValue() + "<br/> Device has terminated the connection or is out of range...");
						break;

					default:
						break;
				}
			}
		}

	},
	
	trustedDevicesFound:function (objData) {
		this.$.outputData.setValue(this.$.outputData.getValue() + "<br/> Trusted Devices Found.");

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
	},
	
	unloadHandler:function () {
		/* unloadHandler() - Disconnect SPP Device
		 * Called when application is dismissed/closed
		 */
		//make sure to disconnect from the SPP SERVICE!
		this.disconnectSPP();
	}
});
