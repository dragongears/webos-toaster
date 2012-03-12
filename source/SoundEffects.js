enyo.kind({
	name:"Centurion.SoundEffects",
	kind:"Control",
	components:[
		{ kind:"Sound", name: "byc", src: "sounds/byc.wav", preload: true},
		{ kind:"Sound", name: "eye", src: "sounds/eye.wav", preload: true},
		{ kind:"Sound", name: "done", src: "sounds/itisdone.wav", preload: true}
	],

	init: function() {
		this.$.byc.audio.newvar = this;
		this.$.byc.audio.addEventListener(
						'ended', function () {
							this.newvar.$.eye.play();
						}, false);

		this.$.eye.audio.newvar = this;
		this.$.eye.audio.countdown = -1;
		this.$.eye.audio.addEventListener(
						'ended', function () {
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

	activate: function() {
		if (this.$.eye.audio.countdown == -1) {
			this.$.eye.audio.countdown = 3;
			this.$.eye.play();
		}

	},

	deactivate: function() {
		this.$.eye.audio.countdown = -1;
		this.$.done.play();
	}
});