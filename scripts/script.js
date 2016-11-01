/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 *
 * 웹하드 관련 모든 기능을 제어한다.
 * 
 * @file /modules/webhard/ModuleWebhard.class.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160910
 */
var Webhard = {
	mode:"webhard",
	$form:null,
	$container:null,
	$sidebar:null,
	$tree:null,
	$explorer:null,
	$headerbar:null,
	$files:null,
	$detail:null,
	templet:null,
	/**
	 * 웹하드 탐색기를 초기화한다.
	 */
	init:function() {
		Webhard.mode = "webhard";
		Webhard.$form = $("#ModuleWebhardExplorerForm");
		Webhard.$container = $("div[data-module=webhard]");
		Webhard.$sidebar = $("nav[data-role=sidebar]",Webhard.$container);
		Webhard.$tree = $("ul[data-role=tree]",Webhard.$container);
		Webhard.$explorer = $("section[data-role=explorer]",Webhard.$container);
		Webhard.$headerbar = $("*[data-role=headerbar]",Webhard.$container);
		Webhard.$files = $("div[data-role=files]",Webhard.$explorer);
		Webhard.$detail = $("*[data-role=detail]",Webhard.$container);
		Webhard.templet = $("input[name=templet]",Webhard.$form).val();
		
		Webhard.loading(true);
		Webhard.ui.init();
		Webhard.tree.init();
		Webhard.explorer.init();
		
		Webhard.$container.on("init",function() {
			if (Webhard.tree.isInit == true && Webhard.explorer.isInit == true) Webhard.loading(false);
		});
		
		/**
		 * 단축키 이벤트 정의
		 */
		$(document).on("keydown",function(e) {
			if ($("#iModuleWindowDisabled").is(":visible") == false) {
				if ((e.ctrlKey == true || e.metaKey == true) && e.altKey == false) {
					if (e.keyCode == 65) {
						Webhard.explorer.selectAll();
						e.stopPropagation();
						e.preventDefault();
					}
					
					if (e.keyCode == 67) {
						Webhard.explorer.copy();
						e.stopPropagation();
						e.preventDefault();
					}
					
					if (e.keyCode == 88) {
						Webhard.explorer.crop();
						e.stopPropagation();
						e.preventDefault();
					}
					
					if (e.keyCode == 86) {
						Webhard.explorer.paste();
						e.stopPropagation();
						e.preventDefault();
					}
				}
				
				if (e.keyCode == 46 && Webhard.$container.attr("data-current") != "#trash" && Webhard.explorer.getSelected().length > 0) {
					Webhard.explorer.delete();
					e.stopPropagation();
					e.preventDefault();
				}
			}
		});
		
		$(document).on("click",function() {
			// @todo 메뉴숨기기
			console.log("메뉴 숨기기!");
		});
		
		$(document).on("dragenter",function(e) {
			if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0) {
				if ($("*[data-role=files]",$("#ModuleWebhardContainer")).attr("data-droppable") == "true") {
					$("#ModuleWebhardDropHelp").show();
				}
			}
		});
		
		$("#ModuleWebhardDropHelp").on("dragleave",function(e) {
			Webhard.upload.dragFiles = null;
			$("#ModuleWebhardDropHelp").hide();
		});
		
		$(document).on("drop",function(e) {
			//console.log("drop!!!!",e.originalEvent.dataTransfer.items[0].webkitGetAsEntry(),e.originalEvent.dataTransfer.types,e.originalEvent);

			if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0) {
				if ($("*[data-role=files]",$("#ModuleWebhardContainer")).attr("data-droppable") == "true") {
					Webhard.upload.select(e.originalEvent.dataTransfer.files);
					$("#ModuleWebhardDropHelp").hide();
				}
			}
			
			e.stopPropagation();
			e.preventDefault();
		});
		
		$(document).on("dragover",function(e) {
		});
		
		/**
		 * popstate 이벤트처리 (브라우저의 뒤로가기 / 앞으로가기시 해당하는 폴더내용을 불러온다.
		 */
		$(window).on("popstate",function(e) {
			if (e.originalEvent.state != null && e.originalEvent.state.view && e.originalEvent.state.path) {
				var view = e.originalEvent.state.view;
				var idx = e.originalEvent.state.idx;
				var path = e.originalEvent.state.idx;
				
				if (view == "folder") {
					Webhard.explorer.folder(idx,path,null,true);
				}
			} else {
				location.href = location.href;
			}
		});
	},
	loading:function(is_loading) {
		if (is_loading == true) {
			$("div[data-role=loading]").show();
		} else {
			$("div[data-role=loading]").hide();
		}
	},
	/**
	 * 웹하드 탐색기 UI 와 관련된 사항을 처리한다.
	 */
	ui:{
		/**
		 * 웹하드 UI 를 초기화한다.
		 */
		init:function() {
			if (Webhard.$container == null) return;
			
			/**
			 * 사이드바 리사이즈 UI 처리
			 */
			var $resizer = $("<div>").attr("data-role","resizer");
			Webhard.$sidebar.append($resizer);
			
			/**
			 * 리사이즈 드래그 시작
			 */
			$resizer.on("mousedown",function(e) {
				if (e.button != 0) return;
				Webhard.ui.mousedown($(this),e);
			});
			
			$resizer.on("click",function(e) {
				console.log("클릭이벤트가 발생한다.");
			});
			
			$("button[data-action=toggle-tree]",Webhard.$container).addClass("opened");
			Webhard.$tree.show();
			
			/**
			 * 폴더트리 토글버튼
			 */
			$("button[data-action=toggle-tree]",Webhard.$container).on("click",function() {
				if ($(this).hasClass("opened") == true) {
					Webhard.$tree.animate({height:0},"fast",function() {
						Webhard.$tree.hide();
					});
					$(this).removeClass("opened");
				} else {
					Webhard.$tree.show().height("auto");
					var height = Webhard.$tree.height();
					Webhard.$tree.height(0);
					Webhard.$tree.animate({height:height},"fast");
					$(this).addClass("opened");
				}
			});
			
			/**
			 * 항목을 드래그를 할때
			 */
			$(document).on("mousemove",function(e) {
				Webhard.ui.mousemove(e);
			});
			
			/**
			 * 항목을 드래그하여 놓았을 때
			 */
			$(document).on("mouseup",function(e) {
				Webhard.ui.mouseup(e);
			});
			
			/**
			 * 새폴더 만들기
			 */
			$("button[data-action=create]",Webhard.$container).on("click",function() {
				Webhard.explorer.create();
			});
		},
		/**
		 * 탐색기 경로가 바뀔때마다 UI를 업데이트한다.
		 */
		update:function() {
			var path = Webhard.explorer.getFolderPath().split("/");
			var pathIdx = Webhard.explorer.getFolderPathIdx().split("/");
			
			var $nbreadcrumb = $("section[data-role=nbreadcrumb]",Webhard.$container);
			var $path = $("span[data-role=path]",$nbreadcrumb);
			$path.empty();
			
			var $root = $("<button>").attr("type","button").html(path[0]);
			$root.on("click",function() {
				Webhard.explorer.folder(pathIdx[0],path[0]);
			});
			$path.append($root);
			
			if (Webhard.explorer.getView() == "folder") {
				for (var i=1, loop=path.length;i<loop;i++) {
					$path.append($("<i>").addClass("fa fa-angle-right"));
					var $folder = $("<button>").attr("type","button").attr("data-idx",pathIdx[i]).attr("data-path",path[i]).html(path[i]);
					$folder.on("click",function() {
						Webhard.explorer.folder($(this).attr("data-idx"),$(this).attr("data-path"));
					});
					$path.append($folder);
				}
			}
		},
		/**
		 * 드래그종류 (select, tree, explorer)
		 */
		dragType:null,
		/**
		 * 드래그시작지점
		 */
		dragStart:null,
		/**
		 * 드래그대상
		 */
		dragItem:null,
		/**
		 * 드래그중단지점
		 */
		dropZone:null,
		/**
		 * 드래그 시작
		 *
		 * @param string $object 드래그대상
		 * @param MouseEvent e 마우스이벤트
		 */
		mousedown:function($object,e) {
			/**
			 * 리사이즈바 처리
			 */
			if ($object.attr("data-role") == "resizer") {
				Webhard.ui.dragType = "resize";
				Webhard.ui.dragItem = $object;
				$("body").addClass("resizing");
				Webhard.ui.dragItem.addClass("dragging");
				$("body").addClass("dragging");
			}
			
			/**
			 * 폴더트리 항목 처리
			 */
			if ($object.attr("data-role") == "tree-item") {
				Webhard.ui.dragType = "tree";
				Webhard.ui.dragItem = $object;
			}
			
			console.log($object.attr("data-role"));
			Webhard.ui.dragStart = {x:e.clientX,y:e.clientY};
			
		},
		/**
		 * 드래그 이벤트
		 *
		 * @param MouseEvent e
		 */
		mousemove:function(e) {
			var mouse = {x:e.clientX,y:e.clientY};
			
			/**
			 * 리사이즈바 처리
			 */
			if (Webhard.ui.dragType == "resize") {
				var left = mouse.x - Webhard.ui.dragStart.x + Webhard.$sidebar.width();
				left = left < 200 ? 200 : left;
				left = left > 400 ? 400 : left;
				
				Webhard.ui.dragItem.css("right","").css("left",left);//$("*[data-role=resizer]").css("right",null).css("left",left);
			}
			
			/**
			 * 폴더트리 / 탐색기 항목 처리
			 */
			if (Webhard.ui.dragType == "tree" || Webhard.ui.dragType == "explorer") {
				/**
				 * 클릭이벤트와 중복을 막기위하여, 최초 마우스 클릭지점부터 최소 5px 이상 드래그 했을 경우 처리
				 */
				if (Math.abs(Webhard.ui.dragStart.x - mouse.x) > 5 || Math.abs(Webhard.ui.dragStart.y - mouse.y) > 5) {
					Webhard.ui.dragItem.addClass("dragging");
					$("body").addClass("dragging");
					
					/**
					 * 드래그중인 항목 안내
					 */
					$("div[data-role=dragging]",Webhard.$container).remove();
					var $dragging = $("<div>").attr("data-role","dragging");
					var $icon = $("<i>").addClass("icon").addClass("small");
					$icon.attr("data-type",Webhard.ui.dragItem.eq(0).attr("data-type")).attr("data-extension",Webhard.ui.dragItem.eq(0).attr("data-extension"));
					$dragging.append($icon);
					
					var $label = $("<label>").html(Webhard.ui.dragItem.eq(0).data("name") + Webhard.ui.dragItem.eq(0).data("name")+Webhard.ui.dragItem.eq(0).data("name")+Webhard.ui.dragItem.eq(0).data("name")+Webhard.ui.dragItem.eq(0).data("name"));
					$dragging.append($label);
					var limit = Webhard.ui.dragItem.eq(0).data("name").length;
					while ($label.height() > 40) {
						limit = limit - 1;
						$label.html(Webhard.substring(Webhard.ui.dragItem.eq(0).data("name"),limit));
					}
					
					Webhard.$container.append($dragging);
					$dragging.css("top",mouse.y + 5).css("left",mouse.x + 5);
				}
			}
		},
		/**
		 * 드래그 중단시
		 *
		 * @param MouseEvent e
		 */
		mouseup:function(e) {
			var mouse = {x:e.clientX,y:e.clientY};
			
			/**
			 * 리사이즈바 처리
			 */
			if (Webhard.ui.dragType == "resize") {
				var width = mouse.x - Webhard.ui.dragStart.x + Webhard.$sidebar.width();
				width = width < 200 ? 200 : width;
				width = width > 400 ? 400 : width;
				
				Webhard.$sidebar.css("width",width);
				Webhard.ui.dragItem.css("right","").css("left","");
			}
			
			if (Webhard.ui.dragType != null) {
				Webhard.ui.dragItem.removeClass("dragging");
				$("body").removeClass("dragging").removeClass("resizing");
				Webhard.ui.dragType = null;
				Webhard.ui.dragStart = null;
				Webhard.ui.dragItem = null;
				Webhard.ui.dropZone = null;
				
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		},
		/**
		 * 드랍존 설정
		 */
		mouseover:function($object,e) {
			
		},
		/**
		 * 드랍존 설정
		 */
		mouseout:function(e) {
			
		}
	},
	/**
	 * 트리탐색기
	 */
	tree:{
		isInit:false,
		/**
		 * 트리를 초기화한다.
		 */
		init:function() {
			var $root = $("> li",Webhard.$tree);
			
			var root = Webhard.explorer.getFolderPath().split("/").shift();
			var rootIdx = Webhard.explorer.getFolderPathIdx().split("/").shift();
			$root.attr("data-depth",0).attr("data-idx",rootIdx).attr("data-path",root);
			
			/**
			 * 루트폴더 드랍존 설정
			 */
			$root.on("mouseover",function(e) {
				Webhard.ui.mouseover($(this),e);
			});
			
			/**
			 * 루트폴더 드랍존 해지
			 */
			$root.on("mouseout",function(e) {
				Webhard.ui.mouseout($(this),e);
			});
			
			$("> div",$root).on("click",function() {
				var $root = $(this).parent();
				Webhard.explorer.folder($root.attr("data-idx"),$root.attr("data-path"));
			});
			
			var idx = Webhard.explorer.getFolderPathIdx().split("/").slice(0,-1);
			Webhard.tree.expand(rootIdx,function() {
				Webhard.tree.expandAll(idx,function() {
					Webhard.tree.isInit = true;
					Webhard.$container.triggerHandler("init");
				});
			});
		},
		/**
		 * 자식폴더트리를 불러온다.
		 *
		 * @param int idx 부모폴더 고유번호
		 * @param function callback 콜백함수
		 */
		load:function(idx,callback) {
			$.send(ENV.getProcessUrl("webhard","getTree"),{idx:idx},function(result) {
				if (result.success == true) {
					var $parent = $("li[data-idx="+result.parent+"]",Webhard.$tree);
					$parent.attr("data-children",result.tree.length == 0 ? "FALSE" : "TRUE");
					if (typeof callback == "function") callback(result);
				} else {
					Webhard.error();
				}
			});
		},
		/**
		 * 자식폴더트리가 보이는 상태일 경우, 자식폴더트리를 다시 불러온다.
		 *
		 * @param int idx 부모폴더 고유번호
		 */
		reload:function(idx,callback) {
			var idx = typeof idx == "object" ? idx : [idx];
			var current = idx.shift();
			
			var $parent = $("li[data-idx="+current+"]",Webhard.$tree);
			if ($parent.hasClass("opened") == true) {
				if (idx.length == 0) {
					Webhard.tree.expand(current,callback);
				} else {
					Webhard.tree.expand(current,function(result) {
						Webhard.tree.reload(idx,callback);
					});
				}
			} else {
				if (idx.length == 0) {
					Webhard.tree.load(current,callback);
				} else {
					Webhard.tree.load(current,function(result) {
						Webhard.tree.reload(idx,callback);
					});
				}
			}
		},
		/**
		 * 자식폴더트리를 확장한다.
		 */
		expand:function(idx,callback) {
			var $parent = $("li[data-idx="+idx+"]",Webhard.$tree);
			if ($parent.hasClass("opened") == true) {
				$("ul",$parent).animate({height:0},"fast",function() {
					$(this).remove();
					$parent.removeClass("opened");
					Webhard.tree.expand(idx,callback);
				});
				
				return;
			}
			
			if ($parent.hasClass("loading") == true) return;
			
			$parent.addClass("loading");
			$("> div > button",$parent).html('<i class="mi mi-loading">');
			
			Webhard.tree.load(idx,function(result) {
				if (result.success == true) {
					$parent.removeClass("loading").addClass("opened");
					$("> div > button",$parent).html("");
					Webhard.tree.print(idx,result.tree);
					Webhard.tree.select();
					if (typeof callback == "function") callback(result);
				}
			});
		},
		/**
		 * 지정된 경로까지 자식폴더트리를 확장한다.
		 *
		 * @param int[] idx 폴더고유번호 배열
		 * @param function callback 콜백함수
		 */
		expandAll:function(idx,callback) {
			if (idx.length == 0) {
				Webhard.tree.select();
				if (typeof callback == "function") {
					callback({success:true});
				}
			} else {
				var current = idx.shift();
				console.log("펼쳐라!",current);
				if ($("li[data-idx="+current+"]",Webhard.$tree).hasClass("opened") == true) {
					Webhard.tree.expandAll(idx,callback);
				} else {
					Webhard.tree.expand(current,function(result) {
						if (result.success == true) {
							Webhard.tree.expandAll(idx,callback);
						}
					});
				}
			}
		},
		/**
		 * 현재폴더를 선택한다.
		 */
		select:function() {
			$("li[data-idx]",Webhard.$tree).removeClass("selected");
			
			if (Webhard.explorer.getView() == "folder") {
				$("li[data-idx="+Webhard.explorer.getFolderIdx()+"]").addClass("selected");
			}
		},
		/**
		 * 트리를 출력한다.
		 *
		 * @param int parent 부모폴더 고유번호
		 * @param object[] tree 트리객체
		 */
		print:function(parent,tree) {
			var $parent = $("li[data-idx="+parent+"]",Webhard.$tree);
			$("> ul",$parent).remove();
			
			var depth = parseInt($parent.attr("data-depth"));
			var $tree = $("<ul>").attr("data-role","tree-child");
			for (var i=0, loop=tree.length;i<loop;i++) {
				var $list = $("<li>").attr("data-idx",tree[i].idx).attr("data-path",tree[i].path).attr("data-depth",depth+1);
				
				/**
				 * 자식폴더가 있는지 여부
				 */
				$list.attr("data-children",tree[i].has_children == true ? "TRUE" : "FALSE");
				
				var $item = $("<div>").attr("data-role","tree-item");
				$item.css("paddingLeft",depth * 15);
				
				/**
				 * 마우스이벤트를 위한 정보기록
				 */
				$item.attr("data-idx",tree[i].idx);
				$item.attr("data-type","folder");
				$item.attr("data-extension","");
				$item.attr("data-permission",tree[i].permission);
				$item.data("name",tree[i].name);
				
				/**
				 * 아이템에 마우스 이벤트가 일어났을 때
				 */
				$item.on("mousedown",function(e) {
					if (e.button != 0) return;
					Webhard.ui.mousedown($(this),e);
				});
				
				/**
				 * 폴더 드랍존 설정
				 */
				$item.on("mouseover",function(e) {
					Webhard.ui.mouseover($(this),e);
				});
				
				/**
				 * 폴더 드랍존 해제
				 */
				$item.on("mouseout",function(e) {
					Webhard.tree.mouseout($(this),e);
				});
				
				$item.on("contextmenu",function(e) {
					Webhard.tree.contextmenu.show(e,$(this));
				});
				
				/**
				 * 트리확장버튼
				 */
				var $toggle = $("<button>").attr("type","button").attr("data-type","button");
				$toggle.on("click",function(e) {
					var $parent = $(this).parent().parent();
					if ($parent.attr("data-children") == "FALSE") return;
					
					if ($parent.hasClass("opened") == true) {
						$parent.removeClass("opened");
						$("> ul",$parent).remove();
					} else {
						Webhard.tree.expand($parent.attr("data-idx"));
					}
					e.stopPropagation();
				});
				$item.append($toggle);
				
				var $title = $("<div>").attr("data-role","title");
				
				var $icon = $("<i>");
				$title.append($icon);
				
				var $name = $("<span>").html(tree[i].name);
				$title.append($name);
				
				$title.on("click",function() {
					console.log("title click");
					var $parent = $(this).parent().parent();
					Webhard.explorer.folder($parent.attr("data-idx"),$parent.attr("data-path"));
				});
				
				$item.append($title);
				$list.append($item);
				$tree.append($list);
			}
			
			$parent.append($tree);
		},
		/**
		 * 항목 드래그
		 */
		dragStart:null,
		dragItem:null,
		/**
		 * 항목 이동중 나타날 메세지
		 *
		 * @param Event e 마우스이벤트
		 * @todo 디자인 변경 / 언어셋적용
		 */
		dragMove:function(e) {
			if (Math.abs(Webhard.tree.dragStart.x - e.clientX) > 5 || Math.abs(Webhard.tree.dragStart.y - e.clientY) > 5) {
				if ($("#ModuleWebhardDragToggle").length == 0) {
					$("body").append($("<div>").attr("id","ModuleWebhardDragToggle"));
				}
				
				/**
				 * @todo 이동가능한 항목이냐?
				 */
				var $toggle = $("#ModuleWebhardDragToggle");
				Webhard.tree.dragItem.removeClass("opened").addClass("moving");
				$("ul",Webhard.tree.dragItem.parent()).remove();
				$toggle.html($("span",Webhard.tree.dragItem).text()+" 이동중...");
				$toggle.css("top",e.clientY + 5).css("left",e.clientX + 5);
			}
		},
		/**
		 * 드래그가 완료되었을때
		 *
		 * @param Event e 마우스이벤트
		 */
		dragEnd:function(e) {
			/**
			 * 자동이동이 대기중일때 타이머를 제거한다.
			 */
			if (Webhard.tree.autoExpandTimer != null) {
				clearTimeout(Webhard.tree.autoExpandTimer);
				Webhard.tree.autoExpandTimer = null;
				$("div[data-role=tree-item]").removeClass("droppable");
			}
			
			$("body").removeClass("droppable").removeClass("noSelect").removeClass("noDrop");
			Webhard.tree.dragItem.attr("data-droppable","true");
			
			if (Webhard.tree.dropZone == null || Webhard.tree.dropZone.attr("data-permission").indexOf("W") == -1) {
				if ($("#ModuleWebhardDragToggle").length == 1) {
					var top = Webhard.$tree.offset().top + Webhard.tree.dragItem.position().top;
					var left = Webhard.$tree.offset().left + Webhard.tree.dragItem.position().left;
					
					$("#ModuleWebhardDragToggle").animate({top:top,left:left,opacity:0},"slow",function() {
						$("#ModuleWebhardDragToggle").remove();
					});
				}
				
				Webhard.tree.dragItem.removeClass("moving");
				Webhard.tree.dragItem = null;
			} else {
				if (Webhard.folder.dragItem != null) {
					Webhard.folder.move(Webhard.tree.dropZone.attr("data-idx"),Webhard.folder.dragItem);
				} else if (Webhard.tree.dragItem != null) {
					Webhard.folder.move(Webhard.tree.dropZone.attr("data-idx"),Webhard.tree.dragItem);
				}
				$("#ModuleWebhardDragToggle").remove();
				Webhard.tree.dragItem = null;
				Webhard.tree.dropZone = null;
			}
		},
		/**
		 * 자동 이동 (마우스 드래그 상태에서 폴더위에 마우스를 올려두면 자동으로 해당 폴더 내부로 들어간다.
		 */
		autoExpandTimer:null,
		/**
		 * 항목 드래그 중 같은 폴더위에 마우스가 8초 이상 위치하고 있으면, 해당 폴더로 이동한다.
		 */
		autoExpand:function(idx,count) {
			var count = count ? count : 0;
			if (count == 0 && Webhard.tree.autoExpandTimer != null) {
				clearTimeout(Webhard.tree.autoExpandTimer);
				Webhard.tree.autoExpandTimer = null;
				$("div[data-role=tree-item]").removeClass("droppable");
			}
			var $treeItem = $("div[data-role=tree-item][data-idx="+idx+"]",Webhard.$tree);
			
			if (count % 2 == 0) $treeItem.addClass("droppable");
			else $treeItem.removeClass("droppable");
			
			if ($treeItem.hasClass("opened") == true || $treeItem.attr("data-droppable") == "false") return;
			
			if (count == 8) {
				Webhard.tree.expand(idx);
			} else {
				Webhard.tree.autoExpandTimer = setTimeout(Webhard.tree.autoExpand,100,idx,++count);
			}
		},
		/**
		 * 폴더 항목에 마우스를 올렸을 경우
		 *
		 * @param object $item 마우스가 올라간 항목 $(DOM)객체
		 */
		mouseover:function($item) {
			/**
			 * 탐색기나 폴더트리에서 드래그중인 항목이 있다면
			 */
			if (Webhard.tree.dragItem != null || Webhard.explorer.dragItem != null) {
				$item.addClass("droppable");
				
				/**
				 * 해당폴더를 자동으로 열기위한 타이머 설정
				 */
				if (Webhard.tree.autoExpandTimer != null) {
					clearTimeout(Webhard.tree.autoExpandTimer);
					Webhard.tree.autoExpandTimer = null;
				}
				
				if ($item.parent().attr("data-children") == "TRUE") Webhard.tree.autoExpandTimer = setTimeout(Webhard.tree.autoExpand,1500,$item.attr("data-idx"));
				
				/**
				 * 마우스가 위치한 곳이 선택된 항목위가 아니고, 마우스가 올라간 폴더에 쓰기 권한이 있을 경우
				 */
				if ($item.hasClass("moving") == false && $item.attr("data-permission").indexOf("W") > -1) {
					$("body").removeClass("noDrop").addClass("droppable");
					Webhard.explorer.dropZone = $item.attr("data-idx");
				} else {
					$("body").removeClass("droppable").addClass("noDrop");
					Webhard.explorer.dropZone = null;
				}
			}
		},
		/**
		 * 폴더 항목에서 마우스가 벗어났을 경우
		 *
		 * @param object $item 마우스가 벗어난 항목 $(DOM)객체
		 */
		mouseout:function($item) {
			/**
			 * 해당폴더를 자동으로 열기위한 타이머 해제
			 */
			if (Webhard.tree.autoExpandTimer != null) {
				clearTimeout(Webhard.tree.autoExpandTimer);
				Webhard.tree.autoExpandTimer = null;
			}
			
			$item.removeClass("droppable").removeClass("noDrop");
			Webhard.explorer.dropZone = null;
		},
		contextmenu:{
			show:function(e,$item) {
				return;
				$item.addClass("contextmenu");
				
				$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				var $menu = $("<ul>").attr("id","ModuleWebfolderContextMenu");
				$menu.on("remove",function() { $("div[data-role=tree-item]",Webhard.$tree).removeClass("contextmenu"); });
				Webhard.$container.append($menu);
				
				if (Webhard.mode == "webhard") var commands = ["create","-","rename","delete","-","paste"];
				else if (Webhard.mode == "select") var commands = ["create","-","rename","delete","-","paste"];
				else var commands = ["create","rename"];
				
				for (var i=0, loop=commands.length;i<loop;i++) {
					if (commands[i] == "-") Webhard.tree.contextmenu.divide();
					else if (typeof Webhard.tree.contextmenu[commands[i]] == "function") Webhard.tree.contextmenu[commands[i]]($item);
				}
				
				if ($("li:last",$menu).hasClass("divide") == true) $("li:last",$menu).remove();
				if ($("li",$("#ModuleWebfolderContextMenu")).length == 0) $menu.remove();
				
				if (e.clientX + $menu.width() + 10 > $(window).width()) {
					$menu.css("right",$(window).width() - e.clientX);
				} else {
					$menu.css("left",e.clientX);
				}
				
				if (e.clientY + $menu.height() + 10 > $(window).height()) {
					$menu.css("bottom",$(window).height() - e.clientY);
				} else {
					$menu.css("top",e.clientY);
				}
				
				e.stopPropagation();
				e.preventDefault();
			},
			divide:function() {
				if ($("li",$("#ModuleWebfolderContextMenu")).length == 0) return;
				if ($("li:last",$("#ModuleWebfolderContextMenu")).hasClass("divide") == true) return;
				
				$("#ModuleWebfolderContextMenu").append($("<li>").addClass("divide"));
			},
			create:function($target) {
				var $item = $("<button>").attr("type","button").attr("data-action","create").html("새폴더 만들기");
				$item.on("click",function() {
					Webhard.tree.create($target.attr("data-idx"));
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			},
			rename:function($target) {
				var $item = $("<button>").attr("type","button").html("이름 바꾸기");
				$item.on("click",function() {
					Webhard.tree.rename($target.attr("data-idx"));
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			},
			delete:function($target) {
				var $item = $("<button>").attr("type","button").html("휴지통으로 보내기");
				$item.on("click",function() {
					Webhard.tree.delete($target.attr("data-idx"));
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			},
			paste:function($target) {
				var $item = $("<button>").attr("type","button").html("붙여넣기");
				$item.on("click",function() {
					Webhard.tree.paste($target.attr("data-idx"));
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			}
		}
	},
	/**
	 * 폴더탐색기
	 */
	explorer:{
		isInit:false,
		/**
		 * 탐색기를 초기화한다.
		 *
		 * @param string view 종류 (folder, tag, search)
		 * @param string path 경로
		 */
		init:function() {
			/**
			 * 탐색기 보기 설정을 지정한다.
			 */
			Webhard.$explorer.attr("data-mode","card").attr("data-sort","name").attr("data-dir","asc");
			
			/**
			 * 파일목록에 마우스가 클릭되었을 때
			 */
			Webhard.$files.on("mousedown",function(e) {
				if (e.button != 0) return;
				
				/**
				 * 드래그 파일선택을 위한 클릭지점 기록
				 */
				var x = e.clientX - Webhard.$files.offset().left;
				var y = e.clientY - Webhard.$files.offset().top + Webhard.$files.scrollTop();
				
				/**
				 * 기존의 선택레이어가 있을 경우 제거하고, 새로운 선택레이얼르 생성한다.
				 */
				$("div[data-role=selection]",Webhard.$files).remove();
				Webhard.$files.append($("<div>").attr("data-role","selection"));
				
				$("div[data-role=selection]",Webhard.$files).hide();
				Webhard.explorer.selectStart = {x:x,y:y};
				$("body").addClass("noSelect");
				
				/**
				 * 선택된 항목을 리셋한다.
				 */
				Webhard.explorer.unselectAll();
			});
			
			/**
			 * 파일목록에 마우스가 위치했을 때 이벤트처리
			 */
			Webhard.$files.on("mouseover",function(e) {
				/**
				 * 드래그중인 항목이 있고, 드래그 시작폴더위치와 현재 위치가 다른경우
				 */
				if (Webhard.explorer.dragItem != null && Webhard.explorer.dragStartIdx != Webhard.explorer.getFolderIdx()) {
					if (Webhard.explorer.autoExpandTimer != null) {
						clearTimeout(Webhard.explorer.autoExpandTimer);
						Webhard.explorer.autoExpandTimer = null;
					}
					
					Webhard.$files.addClass("droppable");
					
					/**
					 * 현재폴더에 쓰기권한이 있을 경우, 드래그중인 아이템을 드랍할 수 있다.
					 */
					if (Webhard.explorer.getFolderPermission().indexOf("W") > -1) {
						$("body").removeClass("noDrop");
						Webhard.explorer.dropZone = Webhard.explorer.getFolderIdx();
					} else {
						$("body").addClass("noDrop");
						Webhard.explorer.dropZone = null;
					}
				}
			});
			
			/**
			 * 파일목록에서 마우스업 이벤트 발생시 상세정보창을 업데이트한다.
			 */
			Webhard.$files.on("mouseup",function(e) {
				Webhard.detail.update();
			});
			
			/**
			 * 파일목록에서 마우스가 벗어났을경우, 드랍존 설정을 초기화한다.
			 */
			Webhard.$files.on("mouseout",function(e) {
				Webhard.explorer.mouseout($(this));
			});
			
			/**
			 * 파일목록창에서 스크롤 되었을 경우 드래그선택레이어를 업데이트한다.
			 */
			Webhard.$files.on("scroll",function(e) {
				if (Webhard.explorer.selectStart != null) {
					Webhard.explorer.selectMove();
				}
			});
			
			/**
			 * 마우스우클릭 메뉴 출력
			 */
			Webhard.$files.on("contextmenu",function(e) {
				Webhard.explorer.unselectAll();
				Webhard.explorer.contextmenu.show(e);
			});
			
			/**
			 * 현재폴더 항목을 불러온다.
			 */
			if (Webhard.explorer.getView() == "folder") {
				Webhard.explorer.folder(Webhard.explorer.getFolderIdx(),Webhard.explorer.getFolderPath(),function(result) {
					if (result.success == true) {
						Webhard.explorer.isInit = true;
						Webhard.$container.triggerHandler("init");
					}
				});
			}
		},
		/**
		 * 현재보고 있는 상태를 반환한다.
		 *
		 * @return string view
		 */
		getView:function() {
			return $("input[name=view]",Webhard.$form).val();
		},
		/**
		 * 현재보고 있는 상태를 업데이트한다.
		 *
		 * @param string view
		 */
		setView:function(view) {
			$("input[name=view]",Webhard.$form).val(view);
		},
		/**
		 * 현재보고 있는 폴더의 고유번호를 가져온다.
		 *
		 * @return int idx 폴더고유번호
		 */
		getFolderIdx:function() {
			return parseInt($("input[name=idx]",Webhard.$form).val());
		},
		/**
		 * 현재보고 있는 폴더의 고유번호를 업데이트한다.
		 *
		 * @param int idx 폴더고유번호
		 */
		setFolderIdx:function(idx) {
			$("input[name=idx]",Webhard.$form).val(idx);
		},
		/**
		 * 현재보고 있는 폴더의 경로를 가져온다.
		 *
		 * @return int path 폴더경로
		 */
		getFolderPath:function() {
			return $("input[name=path]",Webhard.$form).val();
		},
		/**
		 * 현재보고 있는 폴더의 경로를 업데이트한다.
		 *
		 * @param string path 폴더경로
		 */
		setFolderPath:function(path) {
			$("input[name=path]",Webhard.$form).val(path);
		},
		/**
		 * 현재보고 있는 폴더의 고유번호 경로를 가져온다.
		 *
		 * @return int path 폴더경로
		 */
		getFolderPathIdx:function() {
			return $("input[name=pathIdx]",Webhard.$form).val();
		},
		/**
		 * 현재보고 있는 폴더의 고유번호 경로를 업데이트한다.
		 *
		 * @param string path 폴더경로
		 */
		setFolderPathIdx:function(pathIdx) {
			$("input[name=pathIdx]",Webhard.$form).val(pathIdx);
		},
		/**
		 * 현재보고 있는 폴더의 권한을 가져온다.
		 *
		 * @return int path 폴더경로
		 */
		getFolderPermission:function() {
			return Webhard.$explorer.attr("data-permission");
		},
		/**
		 * 현재보고 있는 폴더의 경로를 업데이트한다.
		 *
		 * @param string path 폴더경로
		 */
		setFolderPermission:function(permission) {
			Webhard.$explorer.attr("data-permission",permission);
		},
		/**
		 * 탐색기 로딩상태를 변경한다.
		 */
		loading:function(is_loading) {
			
		},
		/**
		 * 탐색기 내용을 가져온다.
		 *
		 * @param string view 탐색기 보기종류
		 * @param object param 탐색기 보기종류에 따른 값
		 * @param function callback 콜백함수
		 */
		load:function(view,param,callback) {
			Webhard.explorer.loading(true);
			
			if (view == "folder") {
				var data = {view:"folder",idx:param};
			}
			
			$.send(ENV.getProcessUrl("webhard","getItems"),data,function(result) {
				if (result.success == true) {
					/**
					 * 현재 불러온 폴더의 정보를 저장한다.
					 */
					Webhard.explorer.setView(result.view);
					Webhard.explorer.setFolderIdx(result.idx);
					Webhard.explorer.setFolderPath(result.path);
					Webhard.explorer.setFolderPathIdx(result.pathIdx);
					Webhard.explorer.setFolderPermission(result.permission);
					
					if (Webhard.explorer.getView() == "folder") {
						/**
						 * 폴더트리에서 현재폴더 직전까지 확장한다.
						 */
						var paths = result.pathIdx.toString().split("/");
						paths.pop();
						Webhard.tree.expandAll(paths);
					}
					
					/**
					 * 폴더구성물을 출력한다.
					 */
					Webhard.$files.empty();
					for (var i=0, loop=result.items.length;i<loop;i++) {
						Webhard.explorer.print(result.items[i]);
					}
					
					/**
					 * UI를 업데이트한다.
					 */
					Webhard.ui.update();
					
					Webhard.explorer.loading(false);
					if (typeof callback == "function") callback(result);
				} else {
					Webhard.error();
				}
			});
		},
		/**
		 * 폴더내용을 가져온다.
		 *
		 * @param int idx 폴더고유번호
		 * @param string path 폴더경로
		 * @param function callback 콜백함수
		 * @param boolean pushState 사용여부
		 */
		folder:function(idx,path,callback,isPushState) {
			if (location.pathname == ENV.getUrl(null,null,"folder",path.split("/").slice(1).join("/"))) {
				Webhard.explorer.reload(callback);
				return;
			}
			
			if (history.pushState === undefined && isPushState !== true) {
				location.href = ENV.getUrl(null,null,"folder")+path;
				return;
			}
			
			Webhard.explorer.load("folder",idx,function(result) {
				/**
				 * 브라우져의 경로를 변경한다.
				 */
				if (isPushState !== true && history.pushState) {
					var data = {view:"folder",idx:result.idx,path:result.path};
					history.pushState(data,document.title,ENV.getUrl(null,null,"folder",result.path.split("/").slice(1).join("/")));
				}
				
				if (typeof callback == "function") callback(result);
			});
		},
		/**
		 * 현재 폴더의 내용을 새로고침한다.
		 */
		reload:function(callback) {
			var view = Webhard.explorer.getView();
			if (view == "folder") {
				Webhard.explorer.load("folder",Webhard.explorer.getFolderIdx(),callback);
			}
		},
		/**
		 * 폴더 아이템을 화면에 출력한다.
		 *
		 * @param object items
		 */
		print:function(item) {
			var $item = $("<div>").attr("data-role","file-item").attr("data-type",item.type).attr("data-idx",item.idx).attr("data-permission",item.permission);
			
			/**
			 * 원본데이터 보관
			 */
			$item.data("data",item);
			
			/**
			 * 정렬을 위한 데이터 정의
			 */
			$item.data("sort-name",item.name);
			$item.data("sort-size",item.size);
			$item.data("sort-date",item.reg_date);
			
			/**
			 * 즐겨찾기 스타일정의
			 */
			if (item.is_favorite == true) $item.addClass("favorite");
			
			/**
			 * 종류가 폴더일 경우, 폴더전용 데이터들을 추가한다.
			 */
			if (item.type == "folder") {
				$item.attr("data-path",item.path);
				
				/**
				 * 폴더 자동열기를 위한 mouseover, mousedown 이벤트추가
				 */
				$item.on("mouseover",function(e) {
					Webhard.explorer.mouseover($(this));
					e.stopPropagation();
				});
				
				$item.on("mouseout",function(e) {
					Webhard.explorer.mouseout($(this));
					e.stopPropagation();
				});
			} else {
				$item.attr("data-extension",item.extension);
			}
			
			/**
			 * 아이템에 마우스 이벤트가 일어났을 때
			 */
			$item.on("mousedown",function(e) {
				if (e.button != 0) return;
				
				// 아이템 메뉴를 제거한다.
				Webhard.explorer.contextmenu.hide();
				
				/**
				 * 아이템 다중선택모드가 아닌경우, 현재 아이템만을 선택한다.
				 */
				if (e.shiftKey == false && e.ctrlKey == false && e.metaKey == false) {
					Webhard.explorer.unselectAll();
					Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
					Webhard.explorer.lastSelect = $(this);
				} else {
					/**
					 * shift 키가 눌러졌을 경우 최초 선택아이템부터 현재아이템까지 다중선택한다.
					 */
					if (Webhard.explorer.lastSelect == null && e.shiftKey == true) {
						var current = $(this).index();
						var last = Webhard.explorer.lastSelect.index();
						var start = Math.min(current,last);
						var end = Math.max(current,last);
						
						for (var i=start;i<=end;i++) {
							var $select = $("div[data-role=file-item]",Webhard.$files).eq(i);
							Webhard.explorer.select($select.attr("data-type"),$select.attr("data-idx"));
						}
					}
					
					if (e.ctrlKey == true || e.metaKey == true) {
						if ($item.hasClass("selected") == true) {
							Webhard.explorer.unselect($(this).attr("data-type"),$(this).attr("data-idx"));
						} else {
							Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
						}
					} else {
						Webhard.explorer.unselectAll();
						Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
					}
				}
				
				/**
				 * 현재폴더가 태그보기나 태그보기 상태가 아닌 경우, 아이템 드래그 이벤트를 시작한다.
				 */
				if (Webhard.explorer.getFolderIdx() != 0) {
					$("body").addClass("noSelect");
					
					Webhard.explorer.dragStart = {x:e.clientX,y:e.clientY};
					Webhard.explorer.dragStartIdx = Webhard.explorer.getFolderIdx();
					Webhard.explorer.dragItem = Webhard.explorer.getSelected();
				}
				
				/**
				 * 상위 객체로 이벤트 전달을 취소한다.
				 */
				e.stopPropagation();
			});
			
			/**
			 * 마우스 우클릭 메뉴출력
			 */
			$item.on("contextmenu",function(e) {
				if ($(this).hasClass("selected") == false) {
					Webhard.explorer.unselectAll();
					Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
				}
				
				e.stopPropagation();
				Webhard.explorer.contextmenu.show(e);
			});
			
			/**
			 * 아이템 더블클릭
			 */
			$item.on("dblclick",function(e) {
				// 아이템 메뉴를 제거한다.
				Webhard.explorer.contextmenu.hide();
				
				/**
				 * 더블클릭된 아이템만 선택한다.
				 */
				Webhard.explorer.unselectAll();
				Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
				
				/**
				 * 더블클릭된 아이템이 폴더일 경우, 해당 폴더내부로 접근한다.
				 */
				if ($(this).attr("data-type") == "folder") {
					Webhard.explorer.folder($(this).attr("data-idx"),$(this).attr("data-path"));
				} else {
					// @todo 선택모드 일 경우 확인
					Webhard.explorer.preview();
				}
				
				e.stopPropagation();
			});
			
			/**
			 * 체크박스 선택
			 */
			var $checkbox = $("<button>").attr("type","button").attr("data-action","select");
			$checkbox.on("mousedown",function(e) {
				// 아이템 메뉴를 제거한다.
				Webhard.explorer.contextmenu.hide();
				
				$item = $(this).parents("div[data-role=file-item]");
				if ($item.hasClass("selected") == true) {
					Webhard.explorer.unselect($item.attr("data-type"),$item.attr("data-idx"));
				} else {
					Webhard.explorer.select($item.attr("data-type"),$item.attr("data-idx"));
				}
				
				/**
				 * 상위 객체로 이벤트 전달을 취소한다.
				 */
				e.stopPropagation();
			});
			$item.append($checkbox);
			
			/**
			 * 즐겨찾기 추가
			 */
			var $favorite = $("<button>").attr("type","button").attr("data-action","favorite");
			$favorite.on("mousedown",function(e) {
				// 아이템 메뉴를 제거한다.
				Webhard.explorer.contextmenu.hide();
				
				$item = $(this).parents("div[data-role=file-item]");
				
				if ($item.hasClass("favorite") == true) {
					Webhard.explorer.favorite(false,$item.attr("data-type"),$item.attr("data-idx"));
				} else {
					Webhard.explorer.favorite(true,$item.attr("data-type"),$item.attr("data-idx"));
				}
				
				/**
				 * 상위 객체로 이벤트 전달을 취소한다.
				 */
				e.stopPropagation();
			});
			$item.append($favorite);
			
			// @todo 소스정리
			if (item.is_shared == true) $item.append($("<div>").addClass("shared"));
			if (item.is_deletable == true && item.is_lock == true) $item.append($("<div>").addClass("locked"));
			if (item.type == "folder" && item.is_writable == false) $item.append($("<div>").addClass("readonly"));
			else if (item.type == "folder" && item.is_deletable == false) $item.append($("<div>").addClass("writeonly"));
			if (item.type == "file" && item.is_deletable == false) $item.append($("<div>").addClass("writeonly"));
			
			var $icon = $("<i>").addClass("icon").addClass(item.type);
			if (item.type == "file") $icon.addClass(item.extension);
			if (item.preview != null) {
				$icon.append($("<div>").addClass("preview").css("backgroundImage","url("+item.preview+")"));
			}
			
			if (item.status == "DRAFT") {
				$icon.append($("<div>").addClass("preview"));
				var $progress = $("<div>").addClass("progress").append($("<div>").css("width",(item.uploaded/item.size*100)+"%"));
				$icon.append($progress);
			}
			
			$item.append($icon);
			
			var $name = $("<div>").addClass("name").append($("<span>").html(item.name));
			$item.append($name);
			
			var $size = $("<div>").addClass("size").append($("<span>").html(item.uploaded == -1 ? "Unknwon" : iModule.getFileSize(item.uploaded)));
			$item.append($size);
			
			if (item.owner != null) {
				var $owner = $("<div>").addClass("owner");
				$owner.append($("<div>").addClass("photo").css("backgroundImage","url("+item.owner.photo+")"));
				$owner.append($("<div>").addClass("name").append($("<span>").html(item.owner.name)));
				$item.append($owner);
			}
			
			if ($("div[data-role=file-item][data-type="+item.type+"][data-idx="+item.idx+"]",Webhard.$files).length == 0) {
				Webhard.$files.append($item);
			} else {
				$("div[data-role=file-item][data-type="+item.type+"][data-idx="+item.idx+"]",Webhard.$files).replaceWith($item);
			}
			
			$(document).triggerHandler("Webhard.printItem",[item.type,$item,item]);
		},
		/**
		 * 새로운 폴더를 생성한다.
		 */
		create:function($form) {
			if (typeof $form == "object" && $form.is("form") == true) {
				$form.send(ENV.getProcessUrl("webhard","create"),function(result) {
					if (result.success == true) {
						iModule.modal.close();
						Webhard.tree.load(result.parent);
						Webhard.explorer.reload();
					}
				});
			} else {
				var parent = $("input[name=idx]",Webhard.$form).val();
				iModule.modal.get(ENV.getProcessUrl("webhard","getModal"),{modal:"create",parent:parent},function($modal,$form) {
					$form.inits(Webhard.explorer.create);
					return false;
				});
			}
		},
		/**
		 * 선택된 항목을 가져온다.
		 *
		 * @return object[] selected 선택된 항목 정보
		 */
		getSelected:function() {
			var $item = $("div[data-role=file-item].selected",Webhard.$files);
			
			var selected = [];
			$item.each(function() {
				selected.push(($(this).data("data")));
			});
			
			return selected;
		},
		/**
		 * 선택된 항목이 변경되었을 경우 처리
		 */
		updateSelected:function() {
			/**
			 * @todo 선택모드 처리
			 */
			if ($("div[data-role=file-item]:visible",Webhard.$files).length > 0 && $("div[data-role=file-item].selected",Webhard.$files).length == $("div[data-role=file-item]:visible",Webhard.$files).length) {
				$("button[data-action=select]",Webhard.$headerbar).addClass("selected");
			}
		},
		/**
		 * 항목을 선택한다.
		 *
		 * @param string type 대상항목 종류 (folder, file)
		 * @param int idx 대상항목 고유번호
		 */
		select:function(type,idx) {
			var $item = $("div[data-role=file-item][data-type="+type+"][data-idx="+idx+"]",Webhard.$files);
			
			// @todo 선택모드 처리
			if (Webhard.mode == "select") {
				if (type == "folder") {
					Webhard.explorer.unselectAll();
				}
			}
			
			$item.addClass("selected");
			Webhard.explorer.updateSelected();
		},
		/**
		 * 항목선택을 취소한다.
		 *
		 * @param string type 대상항목 종류 (folder, file)
		 * @param int idx 대상항목 고유번호
		 */
		unselect:function(type,idx) {
			var $item = $("div[data-role=file-item][data-type="+type+"][data-idx="+idx+"]",Webhard.$files);
			$item.removeClass("selected");
			
			Webhard.explorer.updateSelected();
		},
		/**
		 * 전체항목을 선택한다.
		 */
		selectAll:function() {
			// @todo 선택모드 처리
			
			if (Webhard.mode == "select") {
				$("div[data-role=file-item][data-type=file]:visible",Webhard.$files).addClass("selected");
				if ($("div[data-role=file-item][data-type=file]:visible",Webhard.$files).length > 0) {
					$("button[data-action=select]",Webhard.$headerbar).addClass("selected");
					$("div[data-role=file-item][data-type=folder]").addClass("unselect");
				}
				Webhard.select.update();
			} else {
				$("div[data-role=file-item]:visible",Webhard.$files).addClass("selected");
			}
			
			Webhard.explorer.updateSelected();
			Webhard.explorer.lastSelect = null;
		},
		/**
		 * 전체항목의 선택을 취소한다.
		 */
		unselectAll:function() {
			$("div[data-role=file-item]",Webhard.$files).removeClass("selected");
			$("div[data-role=file-item][data-type=folder]").removeClass("unselect");
			
			Webhard.explorer.updateSelected();
			Webhard.explorer.lastSelect = null;
		},
		/**
		 * 아이템을 즐겨찾기에 추가하거나 제거한다.
		 */
		favorite:function(favorite,type,idx) {
			var $item = $("div[data-role=file-item][data-type="+type+"][data-idx="+idx+"]");
			var $favorite = $("button[data-action=favorite]",$item);
			
			$favorite.status("loading");
			
			$.send(ENV.getProcessUrl("webhard","updateFavorite"),{favorite:favorite == true ? "true" : "false",type:type,idx:idx},function(result) {
				if (result.success == true) {
					if (result.favorite == true) $item.addClass("favorite");
					else $item.removeClass("favorite");
				}
				
				$favorite.status("default");
				$favorite.enable();
			});
		},
		showFavorite:function(favorite) {
			if (Webhard.$container.attr("data-current") == "#trash" || Webhard.$container.attr("data-current") == "#favorite") return;
			
			Webhard.explorer.unselectAll();
			if (favorite == true) {
				$("button[data-action=favorite]",Webhard.$headerbar).addClass("selected");
				$("div[data-role=file-item]",Webhard.$files).hide();
				$("div[data-role=file-item].favorite",Webhard.$files).show();
			} else {
				$("button[data-action=favorite]",Webhard.$headerbar).removeClass("selected");
				$("div[data-role=file-item]",Webhard.$files).show();
			}
		},
		/**
		 * 마우스드래그 선택모드
		 */
		selectMode:false,
		selectStart:null,
		selectMove:function(e) {
			$("body").addClass("noSelect");
			
			var mouseX = e && e.clientX ? e.clientX : Webhard.mouse.x;
			var mouseY = e && e.clientY ? e.clientY : Webhard.mouse.y;
			
			var x = Math.max(0,Math.min(mouseX - Webhard.$files.offset().left,Webhard.$files.prop("clientWidth")));
			var y = Math.max(0,Math.min(mouseY - Webhard.$files.offset().top + Webhard.$files.scrollTop(),Webhard.$files.prop("scrollHeight")));
			
			var $selection = $("div[data-role=selection]",Webhard.$files);
			
			if (Webhard.mode == "select") $("div[data-role=file-item][data-type=folder]").addClass("unselect");
			
			if (Math.abs(x - Webhard.explorer.selectStart.x) > 2 || Math.abs(y - Webhard.explorer.selectStart.y) > 2) {
				$selection.outerWidth(Math.abs(x - Webhard.explorer.selectStart.x)).outerHeight(Math.abs(y - Webhard.explorer.selectStart.y));
				
				if (x > Webhard.explorer.selectStart.x) {
					$selection.css("left",Webhard.explorer.selectStart.x);
					xStart = Webhard.explorer.selectStart.x;
				} else {
					$selection.css("left",x);
					xStart = x;
				}
				
				if (y > Webhard.explorer.selectStart.y) {
					$selection.css("top",Webhard.explorer.selectStart.y);
				} else {
					$selection.css("top",y);
				}
				
				var selector = $selection.get(0).getBoundingClientRect();
				$("div[data-role=file-item]",Webhard.$files).each(function() {
					var item = this.getBoundingClientRect();
					var collided = !(selector.right < item.left || selector.left > item.right || selector.bottom < item.top || selector.top > item.bottom);
					
					if (collided == true && $(this).hasClass("selected") == false) {
						if (Webhard.mode == "webhard" || $(this).attr("data-type") == "file") Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
					} else if (collided == false && $(this).hasClass("selected") == true) {
						Webhard.explorer.unselect($(this).attr("data-type"),$(this).attr("data-idx"));
					}
				});
				
				var currentScroll = Webhard.$files.scrollTop();
				if (mouseY > Webhard.$files.offset().top + Webhard.$files.prop("clientHeight") - 50) {
					Webhard.$files.scrollTop(currentScroll + 3);
				} else if (mouseY < Webhard.$files.offset().top + 50) {
					Webhard.$files.scrollTop(currentScroll - 3);
				}
				$selection.show();
			} else {
				$selection.hide();
			}
		},
		preview:function() {
			var templet = $("#ModuleWebhardTemplet").val();
			
			if (Webhard.explorer.getSelected().length == 1) {
				var idx = Webhard.explorer.getSelected()[0];
			} else {
				var idx = 0;
			}
			
			$.ajax({
				type:"POST",
				url:ENV.getProcessUrl("webhard","preview"),
				data:{idx:idx,templet:templet},
				dataType:"json",
				success:function(result) {
					if (result.success == true) {
						if (result.modalHtml) iModule.modal.showHtml(result.modalHtml);
						else Webhard.explorer.download();
					} else {
						if (result.message) iModule.alertMessage.show("error",result.message,5);
					}
				}
			});
		},
		download:function() {
			if (Webhard.explorer.getSelected().length == 0) {
				alert("다운로드받을 항목을 선택하여 주십시오.");
				return;
			}
			
			if (Webhard.explorer.getSelected().length == 1 && Webhard.explorer.getSelected()[0].indexOf("/") == -1) {
				if (Webhard.explorer.getSelected(true)[0].status == "DRAFT") {
					alert("업로드가 완료되지 않은 파일은 다운로드 받으실 수 없습니다.");
				} else {
					window.location = ENV.getProcessUrl("webhard","download")+"?idx="+Webhard.explorer.getSelected()[0];
				}
			} else {
				Webhard.download.compress(Webhard.explorer.getSelected());
			}
		},
		/**
		 * 아이탬 정렬
		 *
		 * @param string field 정렬필드
		 * @param string dir 정렬방식(asc, desc)
		 */
		sort:function(field,dir) {
			var field = field ? field : Webhard.$explorer.attr("data-sort");
			var dir = dir ? dir : Webhard.$explorer.attr("data-dir");
			
			var $items = $("div[data-role=file-item][data-type=folder]",Webhard.$files);
			[].sort.call($items,function(a,b) {
				var weight = 0;
				if (field == "date" || field == "size") {
					if (dir == "asc") weight = $(a).data("sort-"+field) > $(b).data("data-sort-"+field) ? 1 : -1;
					else weight = $(a).data("sort-"+field) < $(b).data("data-sort-"+field) ? 1 : -1;
				} else {
					if (dir == "asc") weight = $(a).data("sort-"+field) > $(b).data("sort-"+field) ? 1 : -1;
					else weight = $(a).data("sort-"+field) < $(b).data("sort-"+field) ? 1 : -1;
				}
				
				return weight;
			});
			$items.each(function(){
				Webhard.$files.append(this);
			});
			
			var $items = $("div[data-role=file-item][data-type=file]",Webhard.$files);
			[].sort.call($items,function(a,b) {
				var weight = 0;
				if (field == "date" || field == "size") {
					if (dir == "asc") weight = $(a).data("sort-"+field) > $(b).data("sort-"+field) ? 1 : -1;
					else weight = $(a).data("sort-"+field) < $(b).data("sort-"+field) ? 1 : -1;
				} else {
					if (dir == "asc") weight = $(a).data("sort-"+field) > $(b).data("sort-"+field) ? 1 : -1;
					else weight = $(a).data("sort-"+field) < $(b).data("sort-"+field) ? 1 : -1;
				}
				
				return weight;
			});
			$items.each(function(){
				Webhard.$files.append(this);
			});
		},
		/**
		 * 항목 드래그
		 */
		dragStart:null,
		dragItem:null,
		dragStartIdx:null,
		dropZone:null,
		/**
		 * 이동중인 항목에 대한 스타일시트 정의
		 *
		 * @param boolean is_drag 드래그중인지 여부
		 */
		dragClass:function(is_drag) {
			if (Webhard.explorer.dragItem != null) {
				for (var i=0, loop=Webhard.explorer.dragItem.length;i<loop;i++) {
					var $item = $("div[data-role=file-item][data-type="+Webhard.explorer.dragItem[i].type+"][data-idx="+Webhard.explorer.dragItem[i].idx+"]");
					if (is_drag == true && $item.hasClass("moving") == false) $item.addClass("moving");
					if (is_drag == false && $item.hasClass("moving") == true) $item.removeClass("moving");
				}
			}
		},
		/**
		 * 항목 이동중 나타날 메세지
		 *
		 * @param Event e 마우스이벤트
		 * @todo 디자인 변경 / 언어셋적용
		 */
		dragMove:function(e) {
			if (Math.abs(Webhard.explorer.dragStart.x - e.clientX) > 5 || Math.abs(Webhard.explorer.dragStart.y - e.clientY) > 5) {
				if ($("#ModuleWebhardDragToggle").length == 0) {
					$("body").append($("<div>").attr("id","ModuleWebhardDragToggle"));
				}
				var $toggle = $("#ModuleWebhardDragToggle");
				Webhard.explorer.dragClass(true);
				$toggle.html(Webhard.explorer.dragItem.length+"항목 이동중...");
				$toggle.css("top",e.clientY + 5).css("left",e.clientX + 5);
			}
		},
		/**
		 * 드래그가 완료되었을때
		 *
		 * @param Event e 마우스이벤트
		 */
		dragEnd:function(e) {
			/**
			 * 자동이동이 대기중일때 타이머를 제거한다.
			 */
			if (Webhard.explorer.autoExpandTimer != null) {
				clearTimeout(Webhard.explorer.autoExpandTimer);
				Webhard.explorer.autoExpandTimer = null;
				$("div[data-role=file-item]").removeClass("droppable");
			}
			
			$("body").removeClass("noSelect").removeClass("noDrop");
			Webhard.explorer.dragClass(false);
			
			/**
			 * 드래그가 완료된 곳이 트리일 경우
			 */
			if (Webhard.tree.dropZone != null) {
				/**
				 * 해당 폴더에 쓰기 권한이 있을 경우 항목을 이동시킨다.
				 */
				if (Webhard.tree.dropZone.attr("data-permission").indexOf("W") > -1) {
					Webhard.explorer.move(Webhard.tree.dropZone.attr("data-idx"),Webhard.explorer.dragItem,"move");
				}
			}
			
			/**
			 * 드래그가 완료된 곳이 탐색기인 경우
			 */
			if (Webhard.explorer.dropZone != null) {
				Webhard.explorer.move(Webhard.explorer.dropZone,Webhard.explorer.dragItem,"move");
			}
			
			/**
			 * 드래그 관련 항목 초기화
			 */
			Webhard.explorer.dragClass(false);
			Webhard.explorer.dragItem = null;
			Webhard.explorer.dropZone = null;
			Webhard.tree.dropZone = null;
			
			if ($("#ModuleWebhardDragToggle").length == 1) $("#ModuleWebhardDragToggle").remove();
		},
		/**
		 * 자동 이동 (마우스 드래그 상태에서 폴더위에 마우스를 올려두면 자동으로 해당 폴더 내부로 들어간다.
		 */
		autoExpandTimer:null,
		/**
		 * 항목 드래그 중 같은 폴더위에 마우스가 8초 이상 위치하고 있으면, 해당 폴더로 이동한다.
		 */
		autoExpand:function(idx,count) {
			var count = count ? count : 0;
			if (count == 0 && Webhard.explorer.autoExpandTimer != null) {
				clearTimeout(Webhard.explorer.autoExpandTimer);
				Webhard.explorer.autoExpandTimer = null;
				$("div[data-role=file-item]").removeClass("droppable");
			}
			var $item = $("div[data-role=file-item][data-idx="+idx+"]",Webhard.$files);
			
			if (count % 2 == 0) $item.addClass("droppable");
			else $item.removeClass("droppable");
			
			if (count == 8) {
				Webhard.explorer.folder($item.attr("data-idx"),$item.attr("data-path"),null,true);
			} else {
				Webhard.explorer.autoExpandTimer = setTimeout(Webhard.explorer.autoExpand,100,idx,++count);
			}
		},
		/**
		 * 폴더 항목에 마우스를 올렸을 경우
		 *
		 * @param object $item 마우스가 올라간 항목 $(DOM)객체
		 */
		mouseover:function($item) {
			/**
			 * 드래그중인 항목이 있을 경우
			 */
			if (Webhard.explorer.dragItem != null) {
				$item.addClass("droppable");
				
				/**
				 * 해당폴더를 자동으로 열기위한 타이머 설정
				 */
				if (Webhard.explorer.autoExpandTimer != null) {
					clearTimeout(Webhard.explorer.autoExpandTimer);
					Webhard.explorer.autoExpandTimer = null;
				}
				
				Webhard.explorer.autoExpandTimer = setTimeout(Webhard.explorer.autoExpand,1500,$item.attr("data-idx"));
				
				/**
				 * 마우스가 위치한 곳이 선택된 항목위가 아니고, 마우스가 올라간 폴더에 쓰기 권한이 있을 경우
				 */
				if ($item.hasClass("selected") == false && $item.attr("data-permission").indexOf("W") > -1) {
					$("body").removeClass("noDrop");
					Webhard.explorer.dropZone = $item.attr("data-idx");
				} else {
					$("body").addClass("noDrop");
					Webhard.explorer.dropZone = null;
				}
			}
		},
		/**
		 * 폴더 항목에서 마우스가 벗어났을 경우
		 *
		 * @param object $item 마우스가 벗어난 항목 $(DOM)객체
		 */
		mouseout:function($item) {
			/**
			 * 해당폴더를 자동으로 열기위한 타이머 해제
			 */
			if (Webhard.explorer.autoExpandTimer != null) {
				clearTimeout(Webhard.explorer.autoExpandTimer);
				Webhard.explorer.autoExpandTimer = null;
			}
			
			$item.removeClass("droppable");
			$("body").removeClass("noDrop");
			Webhard.explorer.dropZone = null;
		},
		duplicated:function() {
			var $form = $("#ModuleWebhardDuplicatedOptionForm");
			$("button[data-action]",$form).on("click",function() {
				$("input[name=option]",$form).val($(this).attr("data-action"));
				$form.submit();
			});
			
			if (Webhard.explorer.moveItem.length == 1) $("label",$form).hide();
			$form.formInit(Webhard.explorer.move);
		},
		copyItem:null,
		copy:function() {
			if (Webhard.explorer.getSelected().length == 0) {
				iModule.alertMessage.show("error","복사할 항목을 선택하여 주십시오.",5);
			} else {
				Webhard.explorer.cropItem = null;
				Webhard.explorer.copyItem = Webhard.explorer.getSelected();
				iModule.alertMessage.show("success",Webhard.explorer.copyItem.length+"개의 항목을 복사하였습니다. 붙여넣기를 이용하여 원하는 위치에 복사할 수 있습니다.",5);
				Webhard.explorer.cropClass();
			}
		},
		cropItem:null,
		crop:function() {
			if (Webhard.explorer.getSelected().length == 0) {
				iModule.alertMessage.show("error","잘라낼 항목을 선택하여 주십시오.",5);
			} else {
				Webhard.explorer.copyItem = null;
				Webhard.explorer.cropItem = Webhard.explorer.getSelected();
				iModule.alertMessage.show("success",Webhard.explorer.cropItem.length+"개의 항목을 잘라내었습니다. 붙여넣기를 이용하여 원하는 위치에 이동할 수 있습니다.",5);
				Webhard.explorer.cropClass();
			}
		},
		paste:function() {
			if (Webhard.explorer.cropItem != null) {
				Webhard.explorer.move(Webhard.explorer.getFolderIdx(),Webhard.explorer.cropItem,"move");
				Webhard.explorer.cropItem = null;
			} else if (Webhard.explorer.copyItem != null) {
				Webhard.explorer.move(Webhard.explorer.getFolderIdx(),Webhard.explorer.copyItem,"copy");
				Webhard.explorer.copyItem = null;
			} else {
				iModule.alertMessage.show("error","붙여넣기할 항목이 없습니다.",5);
			}
		},
		cropClass:function() {
			$("div[data-role=file-item]",Webhard.$files).removeClass("moving");
			
			if (Webhard.explorer.cropItem != null) {
				var items = [];
				for (var i=0, loop=Webhard.explorer.cropItem.length;i<loop;i++) {
					var type = Webhard.explorer.cropItem[i].indexOf("/") == 0 ? "folder" : "file";
					var idx = type == "folder" ? Webhard.explorer.cropItem[i].substr(1) : Webhard.explorer.cropItem[i];
					
					var $item = $("div[data-role=file-item][data-type="+type+"][data-idx="+idx+"]");
					if ($item.hasClass("moving") == false) $item.addClass("moving");
				}
			}
		},
		/**
		 * 항목이동
		 */
		moveItem:null,
		moveTarget:null,
		/**
		 * 항목이동
		 *
		 * @param int target 이동할 폴더 고유번호
		 * @param object[] items 이동할 대상
		 * @param string mode 이동모드 (copy : 복사, move : 이동)
		 */
		move:function(target,items,mode) {
			/**
			 * 이동할 항목이 기존대상과 중복되어 선택창이 나타난 경우
			 */
			if (typeof target == "object" && target.is("form") == true) {
				var $form = target;
				$form.status("loading");
			} else {
				Webhard.$files.removeClass("droppable");
				
				/**
				 * 파일이동중에 중복문제가 발생할 수 있으므로, 현재 이동중인 항목을 저장해둔다.
				 */
				Webhard.explorer.moveItem = [];
				Webhard.explorer.moveTarget = target;
				
				for (var i=0, loop=items.length;i<loop;i++) {
					var item = {};
					item.type = items[i].type;
					item.idx = items[i].idx;
					item.name = items[i].name;
					item.mode = mode;
					item.duplicatedOption = null;
					item.duplicatedContinue = null;
					item.success = null;
					
					Webhard.explorer.moveItem.push(item);
				}
			}
			
			Webhard.loading(true);
			$.send(ENV.getProcessUrl("webhard","move"),{target:Webhard.explorer.moveTarget,select:JSON.stringify(Webhard.explorer.moveItem)},function(result) {
				if (result.success == true) {
					if (result.modalHtml) {
						iModule.modal.showHtml(result.modalHtml,function($modal,$form) {
							$("button[data-action]",$form).on("click",function() {
								var idx = parseInt($("input[name=idx]",$form).val());
								
								if ($(this).attr("data-action") == "copy") {
									Webhard.explorer.moveItem[idx].mode = "copy";
								} else {
									Webhard.explorer.moveItem[idx].duplicatedOption = $(this).attr("data-action");
									Webhard.explorer.moveItem[idx].duplicatedContinue = $("input[name=continue]",$form).is(":checked");
								}
								
								$(this).status("loading");
								$("button",$form).disable();
								$form.submit();
							});
							$form.inits(Webhard.explorer.move);
							
							return false;
						});
					} else {
						/**
						 * 성공적으로 이동/복사되었을 경우
						 */
						iModule.modal.close();
						
						/**
						 * 폴더트리에서 이동/복사된 폴더트리를 업데이트한다.
						 */
						Webhard.tree.reload(result.updated,function(result) {
							/**
							 * 현재폴더로 이동한다.
							 */
							Webhard.explorer.folder(Webhard.explorer.getFolderIdx(),Webhard.explorer.getFolderPath());
						});
					}
					
					Webhard.explorer.moveItem = result.select;
				}
				Webhard.loading(false);
			});
			
			/*
			$.ajax({
				type:"POST",
				url:ENV.getProcessUrl("webhard","move"),
				data:{target:Webhard.explorer.moveTarget,templet:templet,files:files,select:JSON.stringify(Webhard.explorer.moveItem),mode:Webhard.explorer.moveMode},
				dataType:"json",
				success:function(result) {
					if (result.success == true) {
						Webhard.explorer.moveItem = result.select;
						
						if (result.modalHtml) {
							iModule.modal.showHtml(result.modalHtml);
						} else {
							var is_all = true;
							var is_folder = false;
							for (var i=0, loop=result.select.length;i<loop;i++) {
								if (result.select[i].moved == true) {
									if (result.select[i].type == "folder") {
										$("div[data-role=tree-item][data-idx="+result.select[i].idx+"]").remove();
										is_folder = true;
									}
								} else {
									is_all = false;
								}
								Webhard.explorer.moveItem[i].moved = result.select[i].moved;
								Webhard.explorer.moveItem[i].duplicatedOption = result.select[i].duplicatedOption;
								Webhard.explorer.moveItem[i].duplicatedContinue = result.select[i].duplicatedContinue;
							}
							
							if (is_folder == true) {
								if ($("div[data-role=tree-item][data-idx="+result.target+"]").length == 1) {
									Webhard.tree.load(result.target,function() {
										Webhard.explorer.reload();
									});
								}
							} else {
								Webhard.explorer.reload();
							}
							
							Webhard.updateDisk();
							Webhard.explorer.moveItem = null;
							iModule.modal.enable();
						}
					} else {
						if (result.message) iModule.alertMessage.show("error",result.message,5);
						iModule.modal.enable();
					}
				},
				error:function() {
					iModule.alertMessage.show("error","Server Connect Error!",5);
				}
			});
			*/
		},
		link:function($form) {
			if ($form && typeof $form == "string") {
				var $form = $("#ModuleWebhardLinkForm");
				$("div.dateControl",$form).dateInit();
				
				$("input[name=unlimited]",$form).on("change",function() {
					if ($(this).is(":checked") == true) {
						$("input[name=expire_date]",$form).val($(this).attr("data-unlimited-text"));
						$("input[name=expire_date]",$form).attr("disabled",true);
					} else {
						var date = moment().add(7,"d").format("YYYY-MM-DD 23:59:59");
						$("input[name=expire_date]",$form).val(date);
						$("input[name=expire_date]",$form).attr("disabled",false);
					}
				});
				
				$("button[data-action=unlink]",$form).on("click",function() {
					var $form = $("#ModuleWebhardLinkForm");
					var hash = $("input[name=hash]",$form).val();
					
					if (hash) {
						$(this).buttonStatus("loading");
						Webhard.explorer.unlink(hash,function(result) {
							iModule.modal.close();
						});
					}
				});
				
				$("input[name=url]",$form).on("click",function() {
					$(this).get(0).select();
				})
				
				if ($("input[name=hash]",$form).val() == "") {
					$("button[data-action=unlink]",$form).attr("disabled",true);
					$("input[name=url]",$form).attr("disabled",true);
				} else {
					$("button[type=submit]",$form).html($("button[type=submit]",$form).attr("data-modify"));
				}
				
				$form.formInit(Webhard.explorer.link);
				$("input[name=unlimited]",$form).triggerHandler("change");
			} else if ($form && typeof $form == "object" && $form.is("form") == true) {
				var data = $form.serialize();
				
				$form.formStatus("loading");
				$.ajax({
					type:"POST",
					url:ENV.getProcessUrl("webhard","link"),
					data:data,
					dataType:"json",
					success:function(result) {
						if (result.success == true) {
							if (result.hash && result.url) {
								$("input[name=url]",$form).val(result.url);
								$("input[name=url]",$form).attr("disabled",false);
								$("input[name=hash]",$form).val(result.hash);
								
								$("button[data-action=unlink]",$form).attr("disabled",false);
								$form.formStatus("default");
								$("button[type=submit]",$form).html($("button[type=submit]",$form).attr("data-modify"));
							} else {
								iModule.modal.close();
							}
							
							var $item = $("div[data-role=file-item][data-type='file'][data-idx="+result.idx+"]",Webhard.$files);
							if ($("div.shared",$item).length == 0) $item.append($("<div>").addClass("shared"));
						} else {
							if (result.message) iModule.alertMessage.show("error",result.message,5);
						}
					},
					error:function() {
						iModule.alertMessage.show("error","Server Connect Error!",5);
					}
				});
			} else if (Webhard.explorer.getSelected().length == 1 && Webhard.explorer.getSelected()[0].indexOf("/") == -1) {
				var idx = Webhard.explorer.getSelected()[0];
				var templet = $("#ModuleWebhardTemplet").val();
				
				$.ajax({
					type:"POST",
					url:ENV.getProcessUrl("webhard","link"),
					data:{idx:idx,templet:templet},
					dataType:"json",
					success:function(result) {
						if (result.success == true) {
							iModule.modal.showHtml(result.modalHtml);
						} else {
							if (result.message) iModule.alertMessage.show("error",result.message,5);
						}
					},
					error:function() {
						iModule.alertMessage.show("error","Server Connect Error!",5);
					}
				});
			}
		},
		unlink:function(hash,callback) {
			$.ajax({
				type:"POST",
				url:ENV.getProcessUrl("webhard","unlink"),
				data:{hash:hash},
				dataType:"json",
				success:function(result) {
					if (result.success == true) {
						if (typeof callback == "function") callback(result);
						
						if (result.is_shared == false) {
							var $item = $("div[data-role=file-item][data-type='file'][data-idx="+result.idx+"]",Webhard.$files);
							$("div.shared",$item).remove();
						}
					} else {
						if (result.message) iModule.alertMessage.show("error",result.message,5);
					}
				},
				error:function() {
					iModule.alertMessage.show("error","Server Connect Error!",5);
				}
			});
		},
		contextmenu:{
			show:function(e) {
				$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				var $menu = $("<ul>").attr("id","ModuleWebfolderContextMenu");
				Webhard.$container.append($menu);
				
				if (Webhard.$container.attr("data-current") == "#trash") {
					var commands = ["restore","remove","-","download","-","detail","-","empty"];
				} else {
					var commands = ["create","-","rename","delete","-","showFavorite","showAll","-","copy","crop","paste","-","download","-","detail","-","link"];
				}
				
				for (var i=0, loop=commands.length;i<loop;i++) {
					if (commands[i] == "-") Webhard.explorer.contextmenu.divide();
					else if (typeof Webhard.explorer.contextmenu[commands[i]] == "function") Webhard.explorer.contextmenu[commands[i]]();
				}
				
				if ($("li:last",$menu).hasClass("divide") == true) $("li:last",$menu).remove();
				if ($("li",$("#ModuleWebfolderContextMenu")).length == 0) $menu.remove();
				
				if (e.clientX + $menu.width() + 10 > $(window).width()) {
					$menu.css("right",$(window).width() - e.clientX);
				} else {
					$menu.css("left",e.clientX);
				}
				
				if (e.clientY + $menu.height() + 10 > $(window).height()) {
					$menu.css("bottom",$(window).height() - e.clientY);
				} else {
					$menu.css("top",e.clientY);
				}
				
				e.stopPropagation();
				e.preventDefault();
			},
			hide:function() {
				
			},
			divide:function() {
				if ($("li",$("#ModuleWebfolderContextMenu")).length == 0) return;
				if ($("li:last",$("#ModuleWebfolderContextMenu")).hasClass("divide") == true) return;
				
				$("#ModuleWebfolderContextMenu").append($("<li>").addClass("divide"));
			},
			create:function() {
				if (Webhard.$container.attr("data-current").indexOf("#") == -1) {
					var $item = $("<button>").attr("type","button").attr("data-action","create").html("새폴더 만들기");
					$item.on("click",function() {
						Webhard.explorer.create();
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			showFavorite:function() {
				if (Webhard.$container.attr("data-current").indexOf("#trash") == -1) {
					var $item = $("<button>").attr("type","button").html("중요 표시한 파일/폴더만 보기");
					$item.on("click",function() {
						Webhard.explorer.showFavorite(true);
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			showAll:function() {
				if (Webhard.$container.attr("data-current").indexOf("#trash") == -1) {
					var $item = $("<button>").attr("type","button").html("전체 파일/폴더 보기");
					$item.on("click",function() {
						Webhard.explorer.showFavorite(false);
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			rename:function() {
				if (Webhard.$container.attr("data-current").indexOf("#trash") == -1 && Webhard.explorer.getSelected().length == 1) {
					var $item = $("<button>").attr("type","button").html("이름 바꾸기");
					$item.on("click",function() {
						Webhard.explorer.rename();
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			delete:function() {
				if (Webhard.$container.attr("data-current").indexOf("#trash") == -1) {
					var $item = $("<button>").attr("type","button").html("휴지통으로 보내기");
					$item.on("click",function() {
						Webhard.explorer.delete();
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			download:function() {
				var $item = $("<button>").attr("type","button").html("선택항목 다운로드");
				$item.on("click",function() {
					Webhard.explorer.download();
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			},
			copy:function() {
				if (Webhard.explorer.getSelected().length > 0) {
					var $item = $("<button>").attr("type","button").html("복사하기");
					$item.on("click",function() {
						Webhard.explorer.copy();
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			crop:function() {
				if (Webhard.explorer.getSelected().length > 0) {
					var $item = $("<button>").attr("type","button").html("잘라내기");
					$item.on("click",function() {
						Webhard.explorer.crop();
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			paste:function() {
				var $item = $("<button>").attr("type","button").html("붙여넣기");
				$item.on("click",function() {
					Webhard.explorer.paste();
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			},
			link:function() {
				if (Webhard.explorer.getSelected().length == 1 && Webhard.explorer.getSelected()[0].indexOf("/") == -1) {
					var $item = $("<button>").attr("type","button").html("외부공유");
					$item.on("click",function() {
						Webhard.explorer.link();
						$("#ModuleWebfolderContextMenu").trigger("remove").remove();
					});
					$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
				}
			},
			detail:function() {
				var $item = $("<button>").attr("type","button").html("상세정보");
				$item.on("click",function() {
					Webhard.$container.attr("data-detail","true");
					Webhard.detail.update();
					$("#ModuleWebfolderContextMenu").trigger("remove").remove();
				});
				$("#ModuleWebfolderContextMenu").append($("<li>").append($item));
			}
		}
	},
	detail:{
		loading:false,
		currentInfomation:null,
		currentActivity:null,
		timer:null,
		init:function() {
			$("ul[data-role=tab] > li > button",Webhard.$detail).on("click",function() {
				$("ul[data-role=tab] > li").removeClass("selected");
				$(this).parent().addClass("selected");
				
				$("div[data-tab]").hide();
				$("div[data-tab="+$(this).attr("data-tab")+"]").show();
				
				Webhard.detail.update();
			});
			
			$("button[data-action]",Webhard.$detail).on("click",function() {
				if ($(this).attr("data-action") == "close") {
					Webhard.$container.attr("data-detail","false");
				}
			});
		},
		update:function() {
			if (Webhard.$detail.is(":visible") == false) return;
			
			if (Webhard.detail.loading == true) {
				setTimeout(Webhard.detail.update,500);
				return;
			}
			
			if (Webhard.detail.timer != null) {
				clearTimeout(Webhard.detail.timer);
				Webhard.detail.timer = null;
			}
			
			if ($("div[data-tab=information]").is(":visible") == true) {
				Webhard.detail.timer = setTimeout(Webhard.detail.information,100);
			}
			
			if ($("div[data-tab=activity]").is(":visible") == true) {
				Webhard.detail.timer = setTimeout(Webhard.detail.activity,100);
			}
		},
		information:function() {
			Webhard.detail.timer = null;
			
			if (Webhard.explorer.getSelected().length == 0) {
				var target = "/"+Webhard.explorer.getFolderIdx();
			} else {
				var target = Webhard.explorer.getSelected().join(",");
			}
			if (Webhard.detail.currentInfomation == target) return;
			
			Webhard.detail.loading = true;
			
			$.ajax({
				type:"POST",
				url:ENV.getProcessUrl("webhard","information"),
				data:{target:target},
				dataType:"json",
				success:function(result) {
					if (result.success == true) {
						Webhard.detail.currentInfomation = result.current.toString();
						
						$("*[data-value=name]").html(result.name == null ? $("div[data-role=tree-item][data-idx=0]",Webhard.$tree).text() : result.name);
						$("*[data-value=type]").html(result.type);
						$("*[data-value=path]").html(result.path);
						$("*[data-value=size]").html(result.size == -1 ? "Unknown" : iModule.getFileSize(result.size)+" ("+iModule.getNumberFormat(result.size)+"B)");
						$("*[data-value=reg_date]").html(result.reg_date == 0 ? "-" : moment(result.reg_date * 1000).locale($("html").attr("lang")).format("LLL"));
						$("*[data-value=update_date]").html(moment(result.update_date * 1000).locale($("html").attr("lang")).format("LLL"));
						$("*[data-value=editor]").html(result.editor);
						
						if (result.preview == true) {
							$("li[data-role=preview]").show();
						} else {
							$("li[data-role=preview]").hide();
						}
					} else {
						if (result.message) iModule.alertMessage.show("error",result.message,5);
					}
					
					Webhard.detail.loading = false;
				},
				error:function() {
					Webhard.detail.loading = false;
					iModule.alertMessage.show("error","Server Connect Error!",5);
				}
			});
		},
		activity:function(start) {
			Webhard.detail.timer = null;
			
			if (Webhard.explorer.getSelected().length == 0) {
				var target = "/"+Webhard.explorer.getFolderIdx();
			} else {
				var target = Webhard.explorer.getSelected().join(",");
			}
			if (start === undefined && Webhard.detail.currentActivity == target) return;
			var $lists = $("div[data-tab=activity]",Webhard.$detail);
			if (Webhard.detail.currentActivity != target) $lists.empty();
			
			
			start = start === undefined ? 0 : start;
			
			$.ajax({
				type:"POST",
				url:ENV.getProcessUrl("webhard","activity"),
				data:{target:target,start:start},
				dataType:"json",
				success:function(result) {
					if (result.success == true) {
						Webhard.detail.currentActivity = result.current.toString();
						
						$("*[data-value=name]").html(result.name == null ? $("div[data-role=tree-item][data-idx=0]",Webhard.$tree).text() : result.name);
						
						for (var i=0, loop=result.activities.length;i<loop;i++) {
							var $item = $("<div>");
							var $text = $("<div>").addClass("text").attr("data-type",result.activities[i].type).attr("data-extension",result.activities[i].extension).html("<i></i>"+result.activities[i].text);
							$item.append($text);
							
							if (result.activities[i].lists) {
								var $list = $("<ul>");
								for (var j=0, loopj=result.activities[i].lists.length;j<loopj;j++) {
									var $file = $("<li>").attr("data-type",result.activities[i].lists[j].type).attr("data-extension",result.activities[i].lists[j].extension).html('<i></i><span class="size">('+iModule.getFileSize(result.activities[i].lists[j].size)+')</span>'+result.activities[i].lists[j].name);
									
									$list.append($file);
								}
								
								$item.append($list);
							}
							
							var $reg_date = $("<div>").addClass("reg_date").html(moment(result.activities[i].reg_date * 1000).locale($("html").attr("lang")).format("lll"));
							$item.append($reg_date);
							
							$lists.append($item);
						}
					} else {
						if (result.message) iModule.alertMessage.show("error",result.message,5);
					}
					
					Webhard.detail.loading = false;
				},
				error:function() {
					Webhard.detail.loading = false;
					iModule.alertMessage.show("error","Server Connect Error!",5);
				}
			});
			
			Webhard.detail.loading = true;
		}
	},
	substring:function(str,length) {
		if (str.length < 12 || str.length < length) return str;
		
		return str.substr(0,length-8)+"..."+str.substr(str.length-8,8);
	},
	updateDisk:function() {
		$.ajax({
			url:ENV.getProcessUrl("webhard","getDisk"),
			method:"POST",
			dataType:"json",
			success:function(result) {
				if (result.success == true) {
					var $disk = $("*[data-role=disk]",Webhard.$container);
					$("*[data-role=usage]",$disk).html(iModule.getFileSize(result.usage));
					$("*[data-role=limit]",$disk).html(iModule.getFileSize(result.limit));
					$("*[data-role=progress] > div",$disk).css("width",(result.usage / result.limit * 100) + "%");
				} else {
					location.href = location.href;
				}
			},
			error:function() {
				iModule.alertMessage.show("error","Server Connect Error!",5);
			}
		});
	}
};