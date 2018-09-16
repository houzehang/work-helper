var fs = require('fs');
var path = require('path');
var __abortSymbol = false;
var spawn = require('child_process').spawn;
var ffmpeg_path = path.resolve(__dirname, "ffmpeg.exe");
var tools_path = path.resolve(__dirname, "tools.js");
var Tools = require(tools_path);

var AudioLenGetter = {
	start: function(fromPath, toPath, talker) {

		console.log(__dirname);
		__abortSymbol = false;

		////======== 数量计数、时间参数 ========
		var __totalCount = 0,
			__delayBoforeStart = 2;

		////======== 播报员 ========
		talker = talker || function() {};

		////======== fromPath判空 ========
		if (!fromPath || fromPath == '') {
			talker("资源路径不可为空", 1);
			return;
		}

		////======== toPath判空 ========
		if (!toPath || toPath == '') {
			talker("请选择导出路径", 1);
			return;
		}

		////======== 正式开始 ========
		talker("战斗即将开始...");

		////======== 1.收集路径任务 ========
		var pathArr = [];
		var timerId;
		//解析需要遍历的文件夹
		var filePath = path.resolve(fromPath);
		// //调用文件遍历方法
		fileDisplay(filePath);

		function fileDisplay(filePath) {
			//根据文件路径读取文件，返回文件列表
			fs.readdir(filePath, function(err, files) {
				if (err) {
					console.warn('readdir err:' + err)
					talker(err.toString(),1)
				} else {
					// console.log(files.length);
					//遍历读取到的文件列表
					files.forEach(function(filename) {
						//获取当前文件的绝对路径
						var filedir = path.join(filePath, filename);
						//根据文件路径获取文件信息，返回一个fs.Stats对象
						fs.stat(filedir, function(eror, stats) {
							if (pathArr.length == 0) {
								talker("暂未发现相关格式的资源,正在继续寻找...");
							}
							if (eror) {
								console.warn('获取文件stats失败');
							} else {
								var isFile = stats.isFile(); //是文件
								var isDir = stats.isDirectory(); //是文件夹
								if (isFile && /[.]mp3$|[.]mav$/.test(filedir)) {
									let _filedir = filedir;
									__totalCount++;
									console.log(_filedir);
									pathArr.push(_filedir);
									__delayBoforeStart += Math.floor(__totalCount / 1000);
									talker("共发现了" + __totalCount + "个音频文件," + __delayBoforeStart + "秒后开始获取时长");

									timerId != undefined && clearTimeout(timerId);
									timerId = setTimeout(() => {
										clearTimeout(timerId);
										talker("已完成0%");
										startTask(pathArr);
									}, __delayBoforeStart * 1000);
								}
								if (isDir) {
									fileDisplay(filedir); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
								}
							}
						})
					});
				}
			});
		}

		function startTask(fromPathArr) {
			fromPathArr = fromPathArr.sort((item1, item2) => {
				item1 = item1.substring(0, item1.lastIndexOf('.')).substring(item1.lastIndexOf('\\') + 1).substring(item1.lastIndexOf('/') + 1);
				item2 = item2.substring(0, item2.lastIndexOf('.')).substring(item2.lastIndexOf('\\') + 1).substring(item2.lastIndexOf('/') + 1);
				return Number(item1) > Number(item2) ? 1 : -1;
			});
			console.log("fromPathArr\n" + fromPathArr);

			let _curIndex = 0;
			let result = [];
			let count = fromPathArr.length;
			getLen(_curIndex);

			function getLen(_index) {
				let _from = fromPathArr[_index];
				spawn(ffmpeg_path, ['-i', fromPathArr[_index]]).stderr.on('data', function(data) {
					data = data.toString();
					let _startIdx = data.indexOf('Duration:') + 9;
					let _timeStr = data.substring(_startIdx).split(',')[0]
					_timeStr = _timeStr.replace(/ /g, '');
					let valid = /^(20|21|22|23|[0-1]\d):[0-5]\d:[0-5]\d/.test(_timeStr);

					if (valid) {
						let separateArr = _timeStr.split(':');
						let hour = separateArr[0];
						let min = separateArr[1];
						let sec = separateArr[2]
						let _totalLen = Number(hour) * 60 * 60 + Number(min) * 60 + Number(sec);
						// console.log("_totalLen:" + _totalLen + '\n');
						result.push(_from.replace(/\\/g, '/') + " - " + _totalLen);

						let progress = 100 * (_index + 1) / count;
						talker("已完成" + progress.toFixed(0) + "%[" + (_index + 1) + "/" + count + "]");

						if (fromPathArr[++_index]) {
							getLen(_index);
						} else {
							console.log("over:" + result);
							Tools.FS.write(toPath, result.join('\n'), function() {
								talker('已完成');
							});
						}
					}
				});
			}
			// console.log('result = \n' + result.length);
		}
	},
	stop: function() {
		__abortSymbol = true;
	}
}
module.exports = AudioLenGetter;