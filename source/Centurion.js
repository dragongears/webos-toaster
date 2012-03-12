enyo.kind({
	name:"Centurion",
	kind:"VFlexBox",
	className:"centurion-logo",
	components:[
		{ kind:"ApplicationEvents", onUnload:"unloadHandler"},
		{ kind:"PageHeader", content:"Project Centurion: webOS Toaster", flex:0 },
		{ kind:"Centurion.ControlPanel", name:"cp", onButtonChange:"cpButtonChangeHandler"},
		{ kind:"Centurion.Communication", name:"com", onOpenReady:"openReadyHandler", onReadCommand:"readCommandHandler"}
	],

	command:'',

	create:function () {
		this.inherited(arguments);

		console.log("Starting communication");
		this.$.com.open();
	},

	cpButtonChangeHandler:function (inSender) {
		// Send command from control panel to toaster
		this.command = inSender.getCommand();
		this.$.com.write(this.command);
	},

	openReadyHandler:function() {
		// Reset control panel
		this.$.cp.changeState('x');
		// Request toast shade knob level from toaster
		this.$.com.write('s');
	},

	readCommandHandler:function(inSender) {
		// Change control panel based on command from toaster
		this.$.cp.changeState(inSender.getCommand());
	},

	unloadHandler:function () {
		console.log("Closing communication");
		this.$.com.close();
	}
});
