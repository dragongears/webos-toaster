enyo.kind({
	name:"Centurion.ControlPanel",
	kind:enyo.VFlexBox,

	published:{
		command:''
	},

	events:{
		onButtonChange:""
	},

	components:[
		{ kind:"Centurion.SoundEffects", name:"se"},
		{kind:"HFlexBox", align:"center", tapHighlight:false, style:"margin-bottom:40px", components:[
			{kind:"Spacer"},
			{kind: "Image", name:"status", src: "images/no_connection.png"},
			{kind:"Spacer"}
		]},
		{kind:"Group", caption:"Shade", style:"margin: 0 200px 20px 200px", components:[
			{kind:"HFlexBox", align:"center", tapHighlight:false, style:"margin:0 20px", components:[
				{kind: "RadioGroup", name:"shade", value:7, flex:1, onChange: "shadeSelected", components: [
					{name:"shade1", caption: "1", value:"1", disabled:true},
					{name:"shade2", caption: "2", value:"2", disabled:true},
					{name:"shade3", caption: "3", value:"3", disabled:true},
					{name:"shade4", caption: "4", value:"4", disabled:true},
					{name:"shade5", caption: "5", value:"5", disabled:true},
			    {name:"shade6", caption: "6", value:"6", disabled:true},
			    {name:"shade7", caption: "7", value:"7", disabled:true}
				]}
			]},
			{kind: "HFlexBox", style:"margin:0 20px 12px 20px", components: [
			    {content: "Light"},
			    {kind: "Spacer"},
			    {content: "Dark"}
			]}
		]},
		{kind:"RowGroup", style:"margin: 0 200px 20px 200px", components:[
			{kind:"HFlexBox", align:"center", tapHighlight:false, components:[
				{kind:"CheckBox", name:"warm", command:"k", disabled:true, checked:false, style:"margin-right:10px", onChange:"checkboxHandler"},
				{content:"Keep Warm"}
			]},
			{kind:"HFlexBox", align:"center", tapHighlight:false, components:[
				{kind:"CheckBox", name:"bagel", command:"b", disabled:true, checked:false, style:"margin-right:10px", onChange:"checkboxHandler"},
				{content:"Bagel"}
			]},
			{kind:"HFlexBox", align:"center", tapHighlight:false, components:[
				{kind:"CheckBox", name:"defrost", command:"d", disabled:true, checked:false, style:"margin-right:10px", onChange:"checkboxHandler"},
				{content:"Defrost"}
			]},
			{kind:"HFlexBox", align:"center", tapHighlight:false, components:[
				{kind:"CheckBox", name:"reheat", command:"r", disabled:true, checked:false, style:"margin-right:10px", onChange:"checkboxHandler"},
				{content:"Reheat"}
			]}
		]},
		{ kind:"Button", name:"activate", command:"t", caption:"Activate", onclick:"activateButton", disabled:true, style:"margin: 0 200px 20px 200px"}
	],

	create:function () {
		this.inherited(arguments);
	},

	rendered: function() {
		// Initialize sound effects
		this.$.se.init();
	},

	/* Set control panel to show that the toaster is toasting
	 * 	Change button caption
	 * 	Change icon image
	 * 	Start sound effects
	 */
	activate:function() {
		this.$.activate.setCaption("Deactivate");
		this.$.status.setSrc("images/toast_down.png");
		this.$.se.activate();
	},

	/* Set control panel to show that the toaster is not toasting
	 * 	Change button caption
	 * 	Change icon image
	 * 	Stop sound effects
	 */
	deactivate:function() {
		this.$.activate.setCaption("Activate");
		this.$.status.setSrc("images/toast_up.png");
		this.$.se.deactivate();
		this.$.warm.setChecked(false);
		this.$.bagel.setChecked(false);
		this.$.reheat.setChecked(false);
		this.$.defrost.setChecked(false);
	},

	/* Toggle a checkbox */
	toggle:function(checkbox) {
		checkbox.setChecked(!checkbox.getChecked());
	},

	/* Change the state of the contol panel based on a command
	 * 	Toggle the appropriate checkbox if not coming from a checkbox onCommand event
	 */
	changeState:function (state, onchange) {
		console.log(">>>>> Control Panel: Change State " + state);
		switch (state) {
			case 'x' :
				console.log(">>>>> Control Panel: Reset");
				this.$.status.setSrc("images/toast_up.png");
				this.$.shade1.setDisabled(false);
				this.$.shade2.setDisabled(false);
				this.$.shade3.setDisabled(false);
				this.$.shade4.setDisabled(false);
				this.$.shade5.setDisabled(false);
				this.$.shade6.setDisabled(false);
				this.$.shade7.setDisabled(false);
				this.$.warm.setDisabled(false);
				this.$.bagel.setDisabled(false);
				this.$.reheat.setDisabled(false);
				this.$.defrost.setDisabled(false);
				this.$.activate.setDisabled(false);
				this.$.warm.setChecked(false);
				this.$.bagel.setChecked(false);
				this.$.reheat.setChecked(false);
				this.$.defrost.setChecked(false);
				break;

			case 't':
				console.log(">>>>> Control Panel: Toast");
				if (this.$.activate.getCaption() == "Activate") {
					this.activate();
				} else {
					this.deactivate();
				}
				break;

			case '+':
				console.log(">>>>> Control Panel: Toast Down");
				this.activate();
				break;

			case '-':
				console.log(">>>>> Control Panel: Toast Up");
				this.deactivate();
				break;

			case 'k':
				console.log(">>>>> Control Panel: Keep Warm");
				if (!onchange) {
					this.toggle(this.$.warm);
				}
				if (this.$.warm.getChecked()) {
					this.$.bagel.setChecked(false);
					this.$.reheat.setChecked(false);
					this.$.defrost.setChecked(false);
				}
				break;

			case 'b':
				console.log(">>>>> Control Panel: Bagel");
				if (!onchange) {
					this.toggle(this.$.bagel);
				}
				if (this.$.bagel.getChecked()) {
					this.$.warm.setChecked(false);
				}
				break;

			case 'r':
				console.log(">>>>> Control Panel: Reheat");
				if (!onchange) {
					this.toggle(this.$.reheat);
				}
				if (this.$.reheat.getChecked()) {
					this.$.warm.setChecked(false);
					this.$.defrost.setChecked(false);
				}
				break;

			case 'd':
				console.log(">>>>> Control Panel: Defrost");
				if (!onchange) {
					this.toggle(this.$.defrost);
				}
				if (this.$.defrost.getChecked()) {
					this.$.warm.setChecked(false);
					this.$.reheat.setChecked(false);
				}
				break;

			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
				console.log(">>>>> Control Panel: Shade " + state);
				this.$.shade.setValue(state);
				break;
		}
	},

	/* Handle shade radio buttons */
	shadeSelected: function (inSender) {
		var cmd = inSender.getValue();
		this.setCommand(cmd);
		this.doButtonChange();
	},

	/* Handle checkboxes */
	checkboxHandler:function (inSender) {
		var cmd = inSender.command;
		this.changeState(cmd, true);
		this.setCommand(cmd);
		this.doButtonChange();
	},


	/* Handle activate (toast/cancel) button */
	activateButton:function (inSender) {
		var cmd = inSender.command;
		this.changeState(cmd);
		this.setCommand(cmd);
		this.doButtonChange();
	}

});
