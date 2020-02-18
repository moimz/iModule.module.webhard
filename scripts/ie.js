/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 *
 * IE관련 오류를 수정한다.
 * 
 * @file /modules/webhard/scripts/ie.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
$(document).ready(function() {
	var getInternetExplorerVersion = function() {
		var rv = -1;
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ua = navigator.userAgent;
			var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
			if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
		}
		return rv;
	}
	
	if (getInternetExplorerVersion() <= 9) {
		var originalAddClassMethod = jQuery.fn.addClass;
		var originalRemoveClassMethod = jQuery.fn.removeClass;

		jQuery.fn.addClass = function() {
			var result = originalAddClassMethod.apply(this,arguments);
			
			if (arguments[0] == "dragging") {
				$("*").attr("unselectable","on");
			}
			return result;
		};
		
		jQuery.fn.removeClass = function() {
			var result = originalRemoveClassMethod.apply(this,arguments);
			
			if (arguments[0] == "dragging") {
				$("*").attr("unselectable",null);
			}
			return result;
		};
	}
});
