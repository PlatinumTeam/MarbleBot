//Most of this file is straight out of Webchat utils.js

//http://stackoverflow.com/a/14760377
String.prototype.paddingLeft = function (paddingValue) {
	return String(paddingValue + this).slice(-paddingValue.length);
};

module.exports = {
	//Horde of Torque methods and other helpers that are super useful
	getWord: function(text, word) {
		if (text === null) return text;
		return text.split(" ")[word];
	},
	getWordCount: function(text) {
		if (text === null) return text;
		return text.split(" ").length;
	},
	getWords: function(text, start, end) {
		if (text === null) return text;
		if (typeof(end) === "undefined")
			end = getWordCount(text);
		return text.split(" ").slice(start, end + 1).join(" ");
	},
	firstWord: function(text) {
		if (text === null) return text;
		return getWord(text, 0);
	},
	restWords: function(text) {
		if (text === null) return text;
		return getWords(text, 1, getWordCount(text));
	},
	decodeName: function(text) {
		if (text === null) return text;
		return text.replace(/-SPC-/g, " ").replace(/-TAB-/g, "\t").replace(/-NL-/g, "\n");
	},
	encodeName: function(text) {
		if (text === null) return text;
		return text.replace(/ /g, "-SPC-").replace(/\t/g, "-TAB-").replace(/\n/g, "-NL-");
	},
	htmlDecode: function(text) {
		if (text === null) return text;
		//The server replaces spaces with + symbols because of issues with spaces.
		// We also need to encode all bare % symbols (with no numbers following) because
		// decodeURIComponent() thinks that they are HTML entities.

		//Also replace all &lt; &gt; and &amp; with their originals because we replace them below.

		//Nasty regex that gets all % symbols without any following 0-9a-f and replaces them with %25
		let toDecode = text
			.replace(/\+/g, " ")
			.replace(/%(?=[^0-9a-fA-F]+)/g, "%25")
			.replace(/&gt;/g, ">")
			.replace(/&lt;/g, "<")
			.replace(/&amp;/g, "&");

		let decoded = decodeURIComponent(toDecode);
		//HTML characters that need to be escaped (&, <, >)
		decoded = decoded
			.replace(/&/g, "&amp;")
			.replace(/>/g, "&gt;")
			.replace(/</g, "&lt;");
		return decoded;
	},
	formatTime: function(time) {
		let isNeg = (time < 0);
		time = Math.abs(time);

		//xx:xx.xxx
		let millis  =            (time %  1000)        .toString().paddingLeft("000");
		let seconds = Math.floor((time % 60000) / 1000).toString().paddingLeft("00");
		let minutes = Math.floor( time / 60000)        .toString().paddingLeft("00");

		return minutes + ":" + seconds + "." + millis;
	},
	upperFirst: function(str) {
		if (str === null) return str;
		return str[0].toUpperCase() + str.substring(1);
	}
};