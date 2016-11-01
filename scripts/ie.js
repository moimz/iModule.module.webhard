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
	
	var fixedHeight = function() {
		var $container = $("div[data-module=webhard]");
		$container.hide();
		var $form = $("#ModuleWebhardExplorerForm");
		var height = $container.parent().height();
		console.log(height);
		$container.height(height);
		$form.height(height);
		$container.show();

		var $panel = $("div[data-role=panel]");
		$panel.hide();
		console.log($("section[data-role=container]").height());
		$panel.height($("section[data-role=container]").height());
		$panel.show();
	};
	
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
	
	fixedHeight();
	
	$(window).on("resize",function() {
		fixedHeight();
	});
});
