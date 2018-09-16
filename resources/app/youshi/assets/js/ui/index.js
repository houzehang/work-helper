var path = require('path');
var Tools = require(path.resolve(__dirname, "..", "tools/tools.js"));
var TinyPng = require(path.resolve(__dirname, "..", "tools/tiny-png.js"));
var AudioLenGetter = require(path.resolve(__dirname, "..", "tools/audio-len-getter.js"));
var md5MapPath = path.resolve(__dirname, "./cache", "tinyMd5.js");
var md5Map = {
};

var Common = {
	CHECKED_REPLACE: true,
	CHECKED_MD5_VERIFY: true,
	ALREADY_START: false,
	isInFsWriting: false,
};

(function($) {

	let talker = function(context) {
		console.log('talker->context = ' + context);
		$("#talker").html(context);
	}
	let talker2 = function(context) {
		console.log('talker2->context = ' + context);
		$("#talker2").html(context);
	}

	let saveMd5 = function() {
		Common.isInFsWriting = true;
		Tools.FS.write(md5MapPath, JSON.stringify(md5Map), function() {
			Common.isInFsWriting = false;
		});
	}

	////======== 数据 ========
	Tools.FS.read(md5MapPath, (context) => {
		console.log("md5 context  = " + context);
		if (context && context.length > 0) {
			if (Tools.isJson(context)) {
				console.log('is JSON!!!');
				md5Map = JSON.parse(context);
			}
		}
	});

	////======== TinyPng ========

	$._refreshView = function() {
		$("#multiplecheckboxesinline-0-0").attr("checked", !!Common.CHECKED_REPLACE);
		$("#multiplecheckboxesinline-0-1").attr("checked", !!Common.CHECKED_MD5_VERIFY);
		$("#appendedtext-1").attr("disabled", !!Common.CHECKED_REPLACE);
		$("#doublebutton-1").attr("disabled", !!Common.CHECKED_REPLACE);

		$('#singlebutton-0').attr("disabled", !!Common.ALREADY_START);
		$('#doublebutton2-0').attr("disabled", !Common.ALREADY_START);
	}

	$._refreshView();

	$("#doublebutton-0").click(function() {
		var _resourcePath = dialog.showOpenDialog({
			"title": "选择资源目录",
			"properties": ["openDirectory"]
		});
		$("#appendedtext-0").val(_resourcePath);
		// Tools.FS.isDir(String.raw `D:`, function(isDir) {
		// 	console.log('test' + isDir);
		// });
		// Common.isInFsWriting = true;
		// Tools.FS.write(md5MapPath, JSON.stringify(md5Map), function() {
		// 	Common.isInFsWriting = false;
		// });
	});

	$("#doublebutton-1").click(function() {
		if (!!Common.CHECKED_REPLACE) {
			return;
		}
		var _resourcePath = dialog.showOpenDialog({
			"title": "选择导出目录",
			"properties": ["openDirectory"]
		});
		$("#appendedtext-1").val(_resourcePath);
	});

	$(".checkbox").change(function() {
		Common.CHECKED_REPLACE = $("#multiplecheckboxesinline-0-0").attr("checked");
		Common.CHECKED_MD5_VERIFY = $("#multiplecheckboxesinline-0-1").attr("checked");

		$._refreshView();
	});

	$("#singlebutton-0").click(function() {
		if (Common.ALREADY_START) {
			return;
		}
		let fromPath = $("#appendedtext-0").val();
		let toPath = $("#appendedtext-1").val();
		let formatInfo = {
			png: $("#multiplecheckboxesinline-0-2").attr("checked"),
			jpg: $("#multiplecheckboxesinline-0-3").attr("checked"),
		}
		let batchcount = $("#batchcount").val();
		let start = function() {
			Common.ALREADY_START = true;
			$._refreshView();
		}
		let over = function() {
			Common.ALREADY_START = false;
			$._refreshView();
		}
		TinyPng.start(fromPath, toPath, formatInfo, talker, md5Map, saveMd5, !!Common.CHECKED_MD5_VERIFY, batchcount, start, over);
	});

	$("#doublebutton2-0").click(function() {
		if (!Common.ALREADY_START) {
			return;
		}
		talker("已终止");
		TinyPng.stop();
		Common.ALREADY_START = false;
		$._refreshView();
	});


	////======== 音频时长获取 ========

	$("#doublebutton-2").click(function() {
		var _resourcePath = dialog.showOpenDialog({
			"title": "选择音频目录",
			"properties": ["openDirectory"]
		});
		$("#appendedtext-2").val(_resourcePath);
	});


	$("#doublebutton-3").click(function() {
		var _resourcePath = dialog.showOpenDialog({
			"title": "选择导出文件",
			// "properties": ["openDirectory"]
		});
		$("#appendedtext-3").val(_resourcePath);
	});

	$("#singlebutton-2").click(function() {
		if (Common.ALREADY_START) {
			return;
		}
		let fromPath = $("#appendedtext-2").val();
		let toPath = $("#appendedtext-3").val();
		AudioLenGetter.start(fromPath, toPath, talker2);
	});

})(jQuery);
