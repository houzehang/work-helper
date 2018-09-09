////======== 2018/9/9/houzehang ========

var fs = require('fs');

var myfs = {
	isDir: function(_path, callback) {
		if (callback) {
			fs.stat(_path, function(error, stats) {
				// if (error) return console.error("node_fs.js->isDir error:" + error.message);
				callback(!!stats && stats.isDirectory());
			})
		}
	},
	isFile: function(_path, callback) {
		if (callback) {
			fs.stat(_path, function(error, stats) {
				// if (error) console.error("node_fs.js->isFile error:" + error.message);
				callback(!!stats && stats.isFile());
			})
		}
	},
	read: function(_path, callback) {
		if (callback) {
			fs.readFile(_path, function(error, data) {
				// if (error) return console.error("node_fs.js->read error:" + error.message);
				callback(data && data.toString());
			});
		} else {
			let data = fs.readFileSync(_path);
			return data && data.toString();
		}

	},
	write: function(_path, context, callback) {
		if (callback) {
			fs.writeFile(_path, context, function(error) {
				// if (error) return console.error("node_fs.js->write error:" + error.message);
				callback();
			});
		} else {
			fs.writeFileSync(_path, context);
		}
	},
	append: function(_path, context, callback) {
		if (callback) {
			fs.appendFile(_path, context, (error) => {
				// if (error) return console.error("node_fs.js->append error:" + error.message);
				callback();
			});
		} else {
			fs.appendFileSync(_path, context);
		}

	}
}
module.exports = myfs;