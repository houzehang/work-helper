var fs = require('fs');
var path = require('path');
var tinyPng = require('gulp-tinypng');
var gulp = require('gulp');
var __abortSymbol = false;
var crypto = require('crypto');
var timerIdHash = [];

function md5File(path, callback) {
	fs.readFile(path, function(err, data) {
		if (err) return;
		var md5Value = crypto.createHash('md5').update(data, 'utf8').digest('hex');
		callback(md5Value);
	});
}
var TinyPng = {
	start: function(fromPath, toPath, formatInfo, apikey, talker, md5Map, saveMd5, needMd5Verify, batchcount, startYet, over) {
		__abortSymbol = false;

		////======== 数量计数、时间参数 ========
		var __totalCount = 0,
			__tinyCount = 0,
			__delayBoforeStart = 3;

		////======== 播报员 ========
		talker = talker || function() {};
		over = over || function() {};

		////======== 路径判空 ========
		if (!fromPath || fromPath == '') {
			talker("资源路径不可为空", 1);
			return;
		}
		////======== apikey判空 ========
		if (!apikey || apikey == '') {
			talker("请填写TinypngApiKey", 1);
			return;
		}

		////======== 过滤文件格式 ========
		formatInfo = formatInfo || {}
		var _formatRegExpStr = formatInfo.png ? "[.]png$" : "";
		_formatRegExpStr = formatInfo.jpg ? (_formatRegExpStr == "" ? "[.]jpg$" : _formatRegExpStr + "|[.]jpg$") : _formatRegExpStr;
		console.log("_formatRegExpStr" + _formatRegExpStr);
		if (_formatRegExpStr == '') {
			talker("请选择一种需要压缩的图片格式", 1);
			return;
		}
		var _formatRegExp = new RegExp(_formatRegExpStr);


		////======== 清除临时文件夹 ========
		tinyPng.cleanTemp();


		////======== 清除之前的定时器 ========
		timerIdHash.map((timerId) => {
			timerId != undefined && clearTimeout(timerId);
		});
		timerIdHash = [];

		////======== 正式开始 ========
		talker("战斗即将开始...");
		startYet && startYet();

		////======== 1.收集路径任务 ========
		var pathArr = [];
		var pathParentArr = [];

		//解析需要遍历的文件夹
		var filePath = path.resolve(fromPath);
		// //调用文件遍历方法
		fileDisplay(filePath);
		var timerId;

		function fileDisplay(filePath) {
			//根据文件路径读取文件，返回文件列表
			fs.readdir(filePath, function(err, files) {
				if (err) {
					console.warn('readdir err:' + err)
					talker(err.toString(), 1)
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
								if (isFile && _formatRegExp.test(filedir)) {
									let _filedir = filedir;
									md5File(_filedir, (md5) => {
										__totalCount++;
										if (needMd5Verify && md5Map[_filedir] == md5) {
											// console.log('md5 相同，无须压缩');
										} else {
											console.log(_filedir);
											__tinyCount++;
											pathArr.push(_filedir);
											pathParentArr.push(_filedir.substring(0, _filedir.lastIndexOf('\\')));
										}
										__delayBoforeStart = 2 + Math.floor(__totalCount / 1000);
										talker("共发现了" + __totalCount + "个图片文件，其中" + __tinyCount + "个文件需要压缩。" + __delayBoforeStart + "秒后开始压缩");

										timerId != undefined && clearTimeout(timerId);
										timerId = setTimeout(() => {
											clearTimeout(timerId);
											talker("已完成0%");
											startTask();
											// console.log(JSON.stringify(md5Map));
										}, __delayBoforeStart * 1000);
									});
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

		let curProgress = 0;
		let addInt = 0;
		let overTimeCount = 0;
		let BATCHCOUNT = Number(batchcount);
		let isInWorking = false;
		let overTimeMap = {};

		function startTask(from = 0, to = BATCHCOUNT) {
			if (__abortSymbol) {
				talker("已终止", 2);
				return;
			}
			if (pathArr.length == 0) {
				isInWorking = false;
				console.log('no file');
				talker("没有要需要压缩的文件", 2);
				over();
				__abortSymbol = true;
				return;
			}
			pathArr.map((path, index) => {
				if (index >= from && index < to) {
					let _index = index;
					let _fromPath = pathArr[_index];
					let _goOn = (truely) => {
						if (__abortSymbol) {
							return;
						}
						if (truely && overTimeMap[_fromPath]) {
							overTimeMap[_fromPath] = false;
							console.log(_fromPath + "對不起, 我來晚啦~~~~~~~~~~~~~~~~~~~~~~~~~~~");
							overTimeCount--;
						} else {
							curProgress++;
						}

						if (curProgress == BATCHCOUNT) {
							saveMd5 && saveMd5();
							curProgress = 0;
							addInt = addInt + BATCHCOUNT;
							startTask(addInt, addInt + BATCHCOUNT);
						}
						let progress = 100 * (addInt + curProgress - overTimeCount) / pathArr.length;
						talker("已完成" + progress.toFixed(0) + "%[" + (addInt + curProgress - overTimeCount) + "/" + pathArr.length + "]");
						if (progress == 100) {
							saveMd5 && saveMd5();
							isInWorking = false;
							over();
						}
					}
					let _timerId = setTimeout(() => {
						console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~7秒超时, 不再等待_fromPath = ' + _fromPath);
						overTimeCount++;
						overTimeMap[_fromPath] = true;
						_goOn();
					}, 7000);
					timerIdHash.push(_timerId);
					gulp.src(_fromPath)
						.pipe(tinyPng.gulpPrefixer(apikey || '', function(err) {
							err && console.log('test' + err);
							if (/Credentials|limit/.test(err)) {
								talker("TinyPng ApiKey无效，请更换", 1);
							} else {
								talker(err, 1);
							}
							__abortSymbol = true;
						}))
						.pipe(gulp.dest(pathParentArr[_index])).on('end', function() {
							if (__abortSymbol) {
								return;
							}

							md5File(_fromPath, (md5) => {
								md5Map[_fromPath] = md5;
								if (_timerId != undefined) {
									clearTimeout(_timerId);
								}
								_goOn(true);
							});

						});
				}
			});
		}
	},
	stop: function() {
		__abortSymbol = true;
	}
}
module.exports = TinyPng;