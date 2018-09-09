var Tools = {
	FS: require(path.resolve(__dirname, "node_fs.js")),
	isJson: function(str) {
		if (typeof str == 'string') {
			try {
				JSON.parse(str);
				return true;
			} catch (e) {
				console.log("erro !!!" + e);
				return false;
			}
		} else {
			console.log(typeof str);
			return false;
		}
	}
};
module.exports = Tools;