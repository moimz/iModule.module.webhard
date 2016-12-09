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
	$upload:null,
	$message:null,
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
		Webhard.$upload = $("div[data-role=upload]",Webhard.$container);
		Webhard.$message = $("div[data-role=message]",Webhard.$message);
		Webhard.templet = $("input[name=templet]",Webhard.$form).val();
		
		if (iModule.isMobile == true) {
			Webhard.$container.attr("data-mobile","TRUE");
			Webhard.$container.attr("data-mobile-select","FALSE");
			$("body").preventZoom();
		} else {
			Webhard.$container.attr("data-mobile","FALSE");
			Webhard.$container.attr("data-mobile-select","FALSE");
		}
		
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
			if (e.keyCode == 27) {
				if (Webhard.ui.dragType != null) {
					Webhard.ui.dragItem.removeClass("dragging");
					if (Webhard.ui.dropZone != null) Webhard.ui.dropZone.removeClass("droppable");
					$("body").removeClass("dragging").removeClass("resizing");
					Webhard.ui.dragType = null;
					Webhard.ui.dragStart = null;
					Webhard.ui.dragItem = null;
					Webhard.ui.dropZone = null;
					$("div[data-role=dragging]",Webhard.$container).remove();
				}
			}
			
			if ($("body > div[data-role=disabled]").is(":visible") == false) {
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
		
		$(document).on("mousedown",function() {
			Webhard.contextmenu.hide();
		});
		
		Webhard.$container.on("contextmenu",function(e) {
			if ((e.metaKey == true || e.ctrlKey == true) && e.shiftKey == true) return;
			e.preventDefault();
		});
		
		/**
		 * popstate 이벤트처리 (브라우저의 뒤로가기 / 앞으로가기시 해당하는 폴더내용을 불러온다.
		 */
		$(window).on("popstate",function(e) {
			if (e.originalEvent.state != null && e.originalEvent.state.view && e.originalEvent.state.path) {
				var view = e.originalEvent.state.view;
				var idx = e.originalEvent.state.idx;
				var path = e.originalEvent.state.path;
				
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
	disable:function(is_loading) {
		if (is_loading == true) {
			$("div[data-role=disable]").show();
		} else {
			$("div[data-role=disable]").hide();
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
//			Webhard.$tree.show();
			
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
			 * 네비 토클버튼
			 */
			$("button[data-action=tree]",Webhard.$container).on("click",function() {
				if (Webhard.explorer.getView() == "folder" && Webhard.explorer.getFolderIdx() != Webhard.explorer.getFolderPathIdx().split("/").shift()) {
					Webhard.explorer.up();
				} else {
					Webhard.ui.tree();
				}
			});
			
			/**
			 * 메뉴 토클버튼
			 */
			$("button[data-action=menu]",Webhard.$container).on("click",function() {
				Webhard.ui.menu();
			});
			
			$("button[data-action=add]",Webhard.$container).on("click",function() {
				Webhard.ui.menu(null,"add");
			});
			
			/**
			 * 정렬 토클버튼
			 */
			$("button[data-action=sort]",Webhard.$container).on("click",function() {
				Webhard.ui.sort();
			});
			
			/**
			 * 전체선택
			 */
			$("button[data-action=select]",Webhard.$headerbar).on("click",function() {
				if ($(this).hasClass("selected") == true) {
					Webhard.explorer.unselectAll();
					Webhard.$container.attr("data-mobile-select","FALSE");
				} else {
					Webhard.explorer.selectAll();
					if (iModule.isMobile == true) Webhard.$container.attr("data-mobile-select","TRUE");
				}
			});
			
			/**
			 * 중요파일만 보기
			 */
			$("button[data-action=favorite]",Webhard.$headerbar).on("click",function() {
				Webhard.explorer.toggleFavorite(!$(this).hasClass("selected"));
			});
			
			/**
			 * 새폴더 만들기
			 */
			$("button[data-action=create]",Webhard.$container).on("click",function() {
				Webhard.explorer.create();
			});
			
			/**
			 * 업로드
			 */
			$("button[data-action=upload]",Webhard.$container).on("click",function(e) {
				$("#ModuleWebhardUploadInput").trigger("click");
			});
			
			/**
			 * 다운로드
			 */
			$("button[data-action=download]",Webhard.$container).on("click",function(e) {
				Webhard.explorer.download();
			});
			
			/**
			 * 삭제
			 */
			$("button[data-action=delete]",Webhard.$container).on("click",function(e) {
				Webhard.explorer.delete();
			});
			
			$("#ModuleWebhardUploadInput").on("change",function(e) {
				console.log("change",e.target.files.length);
				if (e.target.files.length > 0) {
					Webhard.upload.select(e.target.files);
				}
				Webhard.ui.menu(false,$("div[data-role=menu]",Webhard.$toolbar).attr("data-mode"));
			});
			
			/**
			 * 확장메뉴 닫기
			 */
			$("div[data-role=menu] button[data-action]",Webhard.$toolbar).on("click",function() {
				if (iModule.isMobile == true && $(this).attr("data-action") == "upload") return;
				Webhard.ui.menu(false,$("div[data-role=menu]",Webhard.$toolbar).attr("data-mode"));
			});
			
			/**
			 * 정렬메뉴 닫기
			 */
			$("div[data-role=headerbar] button[data-sort]",Webhard.$toolbar).on("click",function() {
				Webhard.ui.sort(false);
			});
			
			/**
			 * 모바일 선택모드
			 */
			$("button[data-action=select_on]",Webhard.$container).on("click",function() {
				Webhard.$container.attr("data-mobile-select","TRUE");
			});
			
			$("button[data-action=select_all]",Webhard.$container).on("click",function() {
				Webhard.$container.attr("data-mobile-select","TRUE");
				Webhard.explorer.selectAll();
			});
			
			$("button[data-action=select_off]",Webhard.$container).on("click",function() {
				Webhard.$container.attr("data-mobile-select","FALSE");
				Webhard.explorer.unselectAll();
			});
			
			/**
			 * 모드변경버튼
			 */
			$("button[data-mode]",Webhard.$container).on("click",function() {
				Webhard.$container.attr("data-viewmode",$(this).attr("data-mode"));
				Webhard.explorer.update();
			});
			
			/**
			 * 정렬버튼
			 */
			$("button[data-sort]",Webhard.$container).on("click",function() {
				if (Webhard.$container.attr("data-sort") == $(this).attr("data-sort")) {
					Webhard.$container.attr("data-dir",Webhard.$container.attr("data-dir") == "asc" ? "desc" : "asc");
				} else {
					Webhard.$container.attr("data-sort",$(this).attr("data-sort"));
					Webhard.$container.attr("data-dir",$(this).attr("data-sort") == "date" ? "desc" : "asc");
				}
				
				Webhard.explorer.sort(Webhard.$container.attr("data-sort"),Webhard.$container.attr("data-dir"));
			});
			
			/**
			 * 업로드목록
			 */
			$("button[data-action]",Webhard.$upload).on("click",function() {
				var action = $(this).attr("data-action");
				
				if (action == "toggle") {
					Webhard.upload.toggle();
				}
				
				if (action == "close") {
					Webhard.upload.close();
				}
			});
			
			/**
			 * 파일 드래그 앤 드랍 업로드
			 */
			$(document).on("dragenter",function(e) {
				e.stopPropagation();
				e.preventDefault();
				
				if ($("div[data-role=dropzone]",Webhard.$container).length == 0) {
					var $dropzone = $("<div>").attr("data-role","dropzone");
					Webhard.$container.append($dropzone);
					
					if (Webhard.upload.isUploadable == true) {
						if (Webhard.explorer.getView() == "folder") {
							Webhard.$files.addClass("droppable");
							Webhard.message.show("info",Webhard.getText("text/drop").replace("{FOLDER}",Webhard.explorer.getFolderPath().split("/").pop()),0);
							
							$dropzone.on("dragleave",function(e) {
								Webhard.message.hide();
								Webhard.$files.removeClass("droppable");
								$(this).remove();
							});
						} else {
							Webhard.message.show("error",Webhard.getErrorText('INVALID_UPLOAD_FOLDER'),0);
						}
					} else {
						Webhard.message.show("error",Webhard.getErrorText('UPLOAD_NOT_AVAILABLE'),0);
					}
				}
			});
			
			$(document).on("dragover",function(e) {
				e.stopPropagation();
				e.preventDefault();
			});
			
			$(document).on("drop",function(e) {
				e.stopPropagation();
				e.preventDefault();
				
				Webhard.$files.removeClass("droppable");
				Webhard.message.hide();
				$("div[data-role=dropzone]",Webhard.$container).remove();
				
				if (Webhard.upload.isUploadable == true) {
					if (Webhard.explorer.getView() == "folder") {
						if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0) {
							var count = 0;
							var files = e.originalEvent.dataTransfer.files;
							var isFolderDetected = false;
							
							var checkingFolder = function() {
								if (count == files.length) {
									if (isFolderDetected == true) {
										Webhard.message.show("error",Webhard.getErrorText('NOT_ALLOWED_FOLDER_UPLOAD'),5,false);
									} else {
										Webhard.upload.select(files);
									}
								}
							};
							
							for (var i=0, loop=e.originalEvent.dataTransfer.files.length;i<loop;i++) {
								try {
									var reader = new FileReader();
									reader.onload = function (e) {
										count++;
										checkingFolder();
									};
									reader.onerror = function (e) {
										count++;
										isFolderDetected = true;
										checkingFolder();
									};
									reader.readAsText(e.originalEvent.dataTransfer.files[i]);
								} catch(e) {}
							}
						}
					} else {
						Webhard.message.show("error",Webhard.getErrorText('INVALID_UPLOAD_FOLDER'),5,false);
					}
				} else {
					Webhard.message.show("error",Webhard.getErrorText('UPLOAD_NOT_AVAILABLE'),5,false);
				}
			});
			
			$(window).on("resize",function() {
				Webhard.contextmenu.hide(false);
				
				if (Webhard.$sidebar.is(":visible") == false && $(window).width() >= 768) {
					Webhard.$sidebar.css("display","").css("left","").css("right","").css("top","").css("bottom","");
				}
				
				if ($("ul",Webhard.$headerbar).is(":visible") == false && $(window).width() >= 768) {
					$("ul",Webhard.$headerbar).css("display","").css("left","").css("right","").css("top","").css("bottom","");
				}
				
				if ($("div[data-role=menu]",Webhard.$toolbar).is(":visible") == false && $(window).width() >= 768) {
					$("div[data-role=menu]",Webhard.$toolbar).css("display","").css("left","").css("right","").css("top","").css("bottom","");
				}
				
				Webhard.ui.initSize();
				Webhard.ui.nbreadcrumb();
			});
			
			
			Webhard.ui.update();
			Webhard.ui.initSize();
			$("div[data-role=button]",Webhard.$toolbar).attr("data-init","TRUE");
		},
		/**
		 * 탐색기 크기조절
		 */
		initSize:function() {
			Webhard.$container.hide();
			var height = Webhard.$container.parent().height();
			Webhard.$container.height(height);
			Webhard.$form.height(height);
			Webhard.$container.show();
	
			var $panel = $("div[data-role=panel]");
			$panel.hide();
			$panel.height($("section[data-role=container]",Webhard.$container).height());
			$panel.show();
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
			
			var $root = $("<button>").attr("type","button").addClass("root").html(path[0]);
			$root.on("click",function() {
				Webhard.explorer.folder(pathIdx[0],path[0]);
			});
			$("span[data-role=root]",$nbreadcrumb).empty().append($root);
			
			if (Webhard.explorer.getView() == "folder") {
				for (var i=1, loop=path.length;i<loop;i++) {
					$path.append($("<i>").addClass("fa fa-angle-right"));
					var $folder = $("<button>").attr("type","button").attr("data-idx",pathIdx[i]).attr("data-path",path[i]).html(path[i]);
					
					if (i < loop - 1) $folder.addClass("parent");
					else $folder.addClass("current");
					
					$folder.on("click",function() {
						Webhard.explorer.folder($(this).attr("data-idx"),$(this).attr("data-path"));
					});
					$path.append($folder);
				}
				
				$("h4[data-role=title]",Webhard.$toolbar).html(Webhard.explorer.getFolderPath().split("/").pop());
				$("button[data-action=restore]",Webhard.$toolbar).hide();
				$("button[data-action=remove]",Webhard.$toolbar).hide();
				$("button[data-action=empty]",Webhard.$toolbar).hide();
				
				if (Webhard.explorer.getFolderIdx() == Webhard.explorer.getFolderPathIdx().split("/").shift()) {
					$("button[data-action=tree]",Webhard.$toolbar).addClass("home").removeClass("back");
				} else {
					$("button[data-action=tree]",Webhard.$toolbar).addClass("back").removeClass("home");
				}
			}
			
			if (iModule.isMobile == false) {
				$("button[data-action=select_on]",Webhard.$toolbar).hide();
				$("button[data-action=select_all]",Webhard.$toolbar).hide();
				$("button[data-action=select_off]",Webhard.$toolbar).hide();
			} else {
				if (Webhard.explorer.getSelected().length == 0) {
					$("button[data-action=select_off]",Webhard.$toolbar).hide();
				} else {
					$("button[data-action=select_on]",Webhard.$toolbar).hide();
				}
			}
			
			var $menu = $("div[data-role=menu]",Webhard.$toolbar);
			var $item = $("*:visible",$menu);
			
			var $prev = $item.eq(0);
			if ($prev.is("span.split") == true) $prev.hide();
			for (var i=1, loop=$item.length;i<loop;i++) {
				if ($prev.is("span.split") == true && $item.eq(i).is("span.split") == true) {
					$item.eq(i).hide();
					continue;
				}
				$prev = $item.eq(i);
			}
			
			Webhard.ui.nbreadcrumb();
		},
		/**
		 * 경로탐색바를 업데이트한다.
		 */
		nbreadcrumb:function() {
			if ($("section[data-role=nbreadcrumb]",Webhard.$container).height() + 10 < $("section[data-role=nbreadcrumb] > div",Webhard.$container).height()) {
				$("section[data-role=nbreadcrumb] > div > span.ellipsis",Webhard.$container).show();
				while ($("section[data-role=nbreadcrumb] > div",Webhard.$container).height() - 10 > $("section[data-role=nbreadcrumb]",Webhard.$container).height()) {
					if ($("section[data-role=nbreadcrumb] > div > span[data-role=path]",Webhard.$container).children(":visible").length == 0) break;
					$("section[data-role=nbreadcrumb] > div > span[data-role=path]",Webhard.$container).children(":visible").eq(0).hide();
					$("section[data-role=nbreadcrumb] > div > span[data-role=path]",Webhard.$container).children(":visible").eq(0).hide();
				}
			} else {
				$("section[data-role=nbreadcrumb] > div > span.ellipsis",Webhard.$container).hide();
				$("section[data-role=nbreadcrumb] > div > span[data-role=path]",Webhard.$container).children().show();
				
				if ($("section[data-role=nbreadcrumb] > div",Webhard.$container).height() - 10 > $("section[data-role=nbreadcrumb]",Webhard.$container).height()) {
					Webhard.ui.nbreadcrumb();
				}
			}
		},
		/**
		 * 모바일 디바이스에서 좌측 폴더메뉴 토글
		 */
		tree:function(visible) {
			var visible = visible === undefined ? Webhard.$sidebar.is(":visible") !== true : visible;
			
			Webhard.disable(visible);
			
			if (visible == true) {
				Webhard.$sidebar.show();
				Webhard.$sidebar.css("left",-Webhard.$sidebar.width());
				Webhard.$sidebar.animate({left:0},"fast");
			} else {
				Webhard.$sidebar.animate({left:Webhard.$sidebar.width() * -1},"fast",function() {
					Webhard.$sidebar.hide();
				});
			}
		},
		/**
		 * 모바일 디바이스에서 툴바버튼
		 */
		menu:function(visible,mode) {
			
			var $menu = $("div[data-role=menu]",Webhard.$toolbar);
			
			var visible = visible === undefined || visible === null ? $menu.is(":visible") !== true : visible;
			var mode = mode === undefined ? "default" : mode;
			$menu.attr("data-mode",mode);
			
			if (visible == true) {
				Webhard.disable(true);
				$menu.show();
				Webhard.ui.update();
				var height = $menu.height();
				$menu.css("height",0);
				$menu.animate({height:height},"fast");
				$menu.attr("data-visible-mode","TRUE");
				
				$("div[data-role=disable]",Webhard.$container).on("click",function() {
					Webhard.ui.menu(false,mode);
				});
				
				if (mode == "add") {
					$("button[data-action=add] > i",Webhard.$container).rotate({endDeg:45,persist:true,duration:0.3});
				}
			} else {
				if ($menu.attr("data-visible-mode") !== "TRUE") return;
				
				$("div[data-role=disable]",Webhard.$container).off("click");
				$menu.attr("data-visible-mode",null);
				
				$menu.animate({height:0},"fast",function() {
					Webhard.disable(false);
					$menu.height("auto");
					$menu.hide();
				});
				
				$("button[data-action=add] > i",Webhard.$container).rotate({endDeg:0,persist:true,duration:0.3});
			}
		},
		/**
		 * 정렬메뉴
		 */
		sort:function(visible) {
			var $menu = $("ul",Webhard.$headerbar);
			
			var visible = visible === undefined || visible === null ? $menu.is(":visible") !== true : visible;
			
			if (visible == true) {
				Webhard.disable(true);
				$menu.show();
				var height = $menu.height();
				$menu.css("height",0);
				$menu.animate({height:height},"fast");
				$menu.attr("data-visible-mode","TRUE");
				
				$("div[data-role=disable]",Webhard.$container).on("click",function() {
					Webhard.ui.sort(false);
				});
			} else {
				if ($menu.attr("data-visible-mode") !== "TRUE") return;
				
				$("div[data-role=disable]",Webhard.$container).off("click");
				$menu.attr("data-visible-mode",null);
				
				$menu.animate({height:0},"fast",function() {
					Webhard.disable(false);
					$menu.height("auto");
					$menu.hide();
				});
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
			
			/**
			 * 탐색기 항목 처리
			 */
			if ($object.attr("data-role") == "file-item") {
				Webhard.ui.dragType = "explorer";
				Webhard.ui.dragItem = $object;
			}
			
			/**
			 * 탐색기 파일 선택
			 */
			if ($object.attr("data-role") == "files") {
				Webhard.ui.dragType = "select";
				
				/**
				 * 드래그 파일선택을 위한 클릭지점 기록
				 */
				var x = e.clientX - Webhard.$files.offset().left;
				var y = e.clientY - Webhard.$files.offset().top + Webhard.$files.scrollTop();
				
				/**
				 * 기존의 선택레이어가 있을 경우 제거하고, 새로운 선택레이어를 생성한다.
				 */
				$("div[data-role=selection]",Webhard.$files).remove();
				Webhard.$files.append($("<div>").attr("data-role","selection"));
				
				$("div[data-role=selection]",Webhard.$files).hide();
				Webhard.explorer.selectStart = {x:x,y:y};
				$("body").addClass("noSelect");
				
				Webhard.ui.dragItem = $("div[data-role=selection]",Webhard.$files);
				
				/**
				 * 선택된 항목을 리셋한다.
				 */
				Webhard.explorer.unselectAll();
			}
			
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
				left = left > Webhard.$sidebar.width() + Webhard.$explorer.width() - 600 ? Webhard.$sidebar.width() + Webhard.$explorer.width() - 600 : left;
				left = left < 200 ? 200 : left;
				
				Webhard.ui.dragItem.css("right","").css("left",left);
			}
			
			/**
			 * 폴더트리 / 탐색기 드래그 항목 처리
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
					if ($("div[data-role=dragging]",Webhard.$container).length == 0) {
						var $dragging = $("<div>").attr("data-role","dragging");
						var $icon = $("<i>").addClass("icon").addClass("small");
						$icon.attr("data-type",Webhard.ui.dragItem.eq(0).attr("data-type")).attr("data-extension",Webhard.ui.dragItem.eq(0).attr("data-extension"));
						var $badge = $("<b>").addClass("badge").html(Webhard.ui.dragItem.length);
						$icon.append($badge);
						
						$dragging.append($icon);
						
						
						
						var $label = $("<label>");
						var $text = $("<span>").html(Webhard.ui.dragItem.eq(0).data("name"));
						$label.append($text);
						$dragging.append($label);
						Webhard.$container.append($dragging);
						
						var limit = Webhard.ui.dragItem.eq(0).data("name").length;
						while ($text.height() > 40) {
							limit = limit - 1;
							$text.html(Webhard.substring(Webhard.ui.dragItem.eq(0).data("name"),limit));
						}
					}
					
					var $dragging = $("div[data-role=dragging]",Webhard.$container);
					$dragging.css("top",mouse.y + 5 - Webhard.$container.position().top).css("left",mouse.x + 5 - Webhard.$container.position().left);
					
					Webhard.explorer.lastClick = null;
				}
			}
			
			/**
			 * 탐색기 파일 선택
			 */
			if (Webhard.ui.dragType == "select") {
				var x = Math.max(0,Math.min(mouse.x - Webhard.$files.offset().left,Webhard.$files.prop("clientWidth")));
				var y = Math.max(0,Math.min(mouse.y - Webhard.$files.offset().top + Webhard.$files.scrollTop(),Webhard.$files.prop("scrollHeight")));
				
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
					if (mouse.y > Webhard.$files.offset().top + Webhard.$files.prop("clientHeight") - 50) {
						Webhard.$files.scrollTop(currentScroll + 3);
					} else if (mouse.y < Webhard.$files.offset().top + 50) {
						Webhard.$files.scrollTop(currentScroll - 3);
					}
					$selection.show();
				} else {
					$selection.hide();
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
			 * 마우스가 위치한 폴더를 자동으로 열기 위한 타이머 해제
			 */
			if (Webhard.ui.autoExpandTimer != null) {
				clearTimeout(Webhard.ui.autoExpandTimer);
				Webhard.ui.autoExpandTimer = null;
			}
			
			/**
			 * 리사이즈바 처리
			 */
			if (Webhard.ui.dragType == "resize") {
				var width = mouse.x - Webhard.ui.dragStart.x + Webhard.$sidebar.width();
				width = width > Webhard.$sidebar.width() + Webhard.$explorer.width() - 600 ? Webhard.$sidebar.width() + Webhard.$explorer.width() - 600 : width;
				width = width < 200 ? 200 : width;
				
				Webhard.$sidebar.css("width",width);
				Webhard.ui.dragItem.css("right","").css("left","");
			}
			
			/**
			 * 탐색기 파일 선택
			 */
			if (Webhard.ui.dragType == "select") {
				Webhard.ui.dragItem.remove();
			}
			
			/**
			 * 파일이동 처리
			 */
			if ((Webhard.ui.dragType == "tree" || Webhard.ui.dragType == "explorer") && Webhard.ui.dropZone != null) {
				if (Webhard.ui.dropZone.attr("data-role") == "files") {
					var target = Webhard.explorer.getFolderIdx();
				} else {
					var target = Webhard.ui.dropZone.attr("data-idx");
				}
				
				var items = [];
				for (var i=0, loop=Webhard.ui.dragItem.length;i<loop;i++) {
					var item = {};
					item.type = Webhard.ui.dragItem.eq(i).attr("data-type");
					item.idx = Webhard.ui.dragItem.eq(i).attr("data-idx");
					item.name = Webhard.ui.dragItem.eq(i).data("name");
					items.push(item);
				}
				
				if (target && items.length > 0) {
					Webhard.explorer.move(target,items,"move");
				}
			}
			
			if (Webhard.ui.dragType != null) {
				Webhard.ui.dragItem.removeClass("dragging");
				if (Webhard.ui.dropZone != null) Webhard.ui.dropZone.removeClass("droppable");
				$("body").removeClass("dragging").removeClass("resizing");
				Webhard.ui.dragType = null;
				Webhard.ui.dragStart = null;
				Webhard.ui.dragItem = null;
				Webhard.ui.dropZone = null;
				$("div[data-role=dragging]",Webhard.$container).remove();
				
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		},
		/**
		 * 드랍존 설정
		 */
		autoExpandTimer:null,
		mouseover:function($object,e) {
			/**
			 * 폴더트리 루트처리
			 */
			if ($object.attr("data-role") == "tree-root") {
				/**
				 * 마우스가 위치한 폴더를 자동으로 열기 위한 타이머 해제
				 */
				if (Webhard.ui.autoExpandTimer != null) {
					clearTimeout(Webhard.ui.autoExpandTimer);
					Webhard.ui.autoExpandTimer = null;
				}
				
				/**
				 * 항목이 드래그중일 경우에만 처리
				 */
				if (Webhard.ui.dragType == "tree" || Webhard.ui.dragType == "explorer") {
					/**
					 * 항목이 이동중이라면 동작중지
					 */
					if ($object.hasClass("dragging") == true) return;
					
					/**
					 * 드랍존 설정
					 */
					$object.addClass("droppable");
					Webhard.ui.dropZone = $object;
				}
			}
			
			/**
			 * 폴더트리 / 탐색기 드래그 항목 처리
			 */
			if ($object.attr("data-role") == "tree-item" || $object.attr("data-role") == "file-item") {
				/**
				 * 마우스가 위치한 폴더를 자동으로 열기 위한 타이머 해제
				 */
				if (Webhard.ui.autoExpandTimer != null) {
					clearTimeout(Webhard.ui.autoExpandTimer);
					Webhard.ui.autoExpandTimer = null;
				}
				
				/**
				 * 항목이 드래그중일 경우에만 처리
				 */
				if (Webhard.ui.dragType == "tree" || Webhard.ui.dragType == "explorer") {
					/**
					 * 항목이 이동중이라면 동작중지
					 */
					if ($object.hasClass("dragging") == true) return;
					
					/**
					 * 드랍존 설정
					 */
					$object.addClass("droppable");
					Webhard.ui.dropZone = $object;
					
					/**
					 * 마우스가 위치한 폴더를 자동으로 열기 위한 타이머 설정
					 */
					if ($object.attr("data-role") == "tree-item") {
						if ($object.parent().attr("data-children") == "TRUE" && $object.parent().hasClass("opened") == false) {
							Webhard.ui.autoExpandTimer = setTimeout(Webhard.tree.autoExpand,1500,$object.attr("data-idx"));
						}
					}
					
					if ($object.attr("data-role") == "file-item") {
						Webhard.ui.autoExpandTimer = setTimeout(Webhard.explorer.autoExpand,1500,$object.attr("data-idx"));
					}
					
					e.stopPropagation();
				}
			}
			
			/**
			 * 파일목록 드랍존설정
			 */
			if ($object.attr("data-role") == "files") {
				/**
				 * 마우스가 위치한 폴더를 자동으로 열기 위한 타이머 해제
				 */
				if (Webhard.ui.autoExpandTimer != null) {
					clearTimeout(Webhard.ui.autoExpandTimer);
					Webhard.ui.autoExpandTimer = null;
				}
				
				/**
				 * 드래그중인 항목이 있고, 드래그 시작폴더위치와 현재 위치가 다른경우
				 */
				if ((Webhard.ui.dragType == "tree" || Webhard.ui.dragType == "explorer") && Webhard.ui.dragItem.eq(0).data("folder") != Webhard.explorer.getFolderIdx()) {
					$object.addClass("droppable");
					Webhard.ui.dropZone = $object;
				}
			}
		},
		/**
		 * 드랍존 설정
		 */
		mouseout:function(e) {
			/**
			 * 마우스가 위치한 폴더를 자동으로 열기 위한 타이머 해제
			 */
			if (Webhard.ui.autoExpandTimer != null) {
				clearTimeout(Webhard.ui.autoExpandTimer);
				Webhard.ui.autoExpandTimer = null;
			}
			
			if (Webhard.ui.dropZone != null) {
				Webhard.ui.dropZone.removeClass("droppable");
				Webhard.ui.dropZone = null;
			}
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
			
			$("> div",$root).attr("data-role","tree-root").attr("data-idx",rootIdx);
			
			/**
			 * 루트폴더 드랍존 설정
			 */
			$("> div",$root).on("mouseover",function(e) {
				Webhard.ui.mouseover($(this),e);
			});
			
			/**
			 * 루트폴더 드랍존 해지
			 */
			$("> div",$root).on("mouseout",function(e) {
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
				$item.data("folder",tree[i].parent);
				
				/**
				 * 아이템에 마우스 이벤트가 일어났을 때
				 */
				$item.on("mousedown",function(e) {
					if (e.button == 0) {
						Webhard.ui.mousedown($(this),e);
					}
					
					if (e.button == 2) {
						Webhard.contextmenu.show(e);
					}
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
					Webhard.ui.mouseout($(this),e);
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
		 * 항목 드래그 중 같은 폴더위에 마우스가 8초 이상 위치하고 있으면, 해당 폴더로 이동한다.
		 */
		autoExpand:function(idx,count) {
			var count = count ? count : 0;
			if (count == 0 && Webhard.ui.autoExpandTimer != null) {
				clearTimeout(Webhard.ui.autoExpandTimer);
				Webhard.ui.autoExpandTimer = null;
				$("div[data-role=tree-item]").removeClass("droppable");
			}
			var $treeItem = $("div[data-role=tree-item][data-idx="+idx+"]",Webhard.$tree);
			
			if (count % 2 == 0) $treeItem.addClass("droppable");
			else $treeItem.removeClass("droppable");
			
			if ($treeItem.hasClass("opened") == true || $treeItem.attr("data-droppable") == "false") return;
			
			if (count == 8) {
				Webhard.tree.expand(idx);
			} else {
				Webhard.ui.autoExpandTimer = setTimeout(Webhard.tree.autoExpand,100,idx,++count);
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
			Webhard.$container.attr("data-viewmode",(iModule.isMobile == true ? "card" : "card")).attr("data-sort","name").attr("data-dir","asc");
			
			/**
			 * 파일선택 및 컨텍스트 메뉴
			 */
			Webhard.$files.on("mousedown",function(e) {
				if (e.button == 0) {
					Webhard.ui.mousedown($(this),e);
				}
				
				if (e.button == 2) {
					Webhard.explorer.unselectAll();
					Webhard.contextmenu.show(e);
				}
			});
			
			/**
			 * 파일목록 드랍존 설정
			 */
			Webhard.$files.on("mouseover",function(e) {
				Webhard.ui.mouseover($(this),e);
			});
			
			/**
			 * 파일목록 드랍존 설정 해제
			 */
			Webhard.$files.on("mouseout",function(e) {
				Webhard.ui.mouseout($(this));
			});
			
			/**
			 * 파일목록에서 마우스업 이벤트 발생시 상세정보창을 업데이트한다.
			 */
			Webhard.$files.on("mouseup",function(e) {
				Webhard.detail.update();
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
					 * 항목정렬
					 */
					Webhard.explorer.sort();
					
					/**
					 * UI를 업데이트한다.
					 */
					Webhard.ui.update();
					
					/**
					 * 클립보드에 있는 항목의 스타일을 지정한다.
					 */
					Webhard.explorer.clipboardClass();
					
					Webhard.explorer.loading(false);
					if (typeof callback == "function") callback(result);
				} else {
					Webhard.error();
				}
			});
		},
		/**
		 * 상위폴더로 이동한다.
		 */
		up:function() {
			if (Webhard.explorer.getView() != "folder" || parseInt(Webhard.explorer.getFolderPathIdx().split("/").shift()) == Webhard.explorer.getFolderIdx()) {
				return;
			}
			
			var idx = Webhard.explorer.getFolderPathIdx().split("/").slice(-2).shift();
			var path = Webhard.explorer.getFolderPath().split("/").slice(0,-1).join("/");
			console.log("up",idx,path,Webhard.explorer.getFolderPathIdx());
			Webhard.explorer.folder(idx,path);
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
			if (idx == Webhard.explorer.getFolderIdx()) {
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
			/**
			 * 기존항목 제거
			 */
			$("div[data-role=file-item][data-type="+item.type+"][data-idx="+item.idx+"]").remove();
			
			var $item = $("<div>").attr("data-role","file-item").attr("data-type",item.type).attr("data-idx",item.idx).attr("data-permission",item.permission);
			
			/**
			 * 원본데이터 보관
			 */
			$item.data("data",item);
			$item.data("name",item.name);
			$item.data("folder",item.folder);
			
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
				 * 폴더 드랍존 설정
				 */
				$item.on("mouseover",function(e) {
					Webhard.ui.mouseover($(this),e);
				});
				
				/**
				 * 폴더 드랍존 해제
				 */
				$item.on("mouseout",function(e) {
					Webhard.ui.mouseout(e);
				});
			} else {
				$item.attr("data-extension",item.extension);
			}
			
			/**
			 * 아이템에 마우스 이벤트가 일어났을 때
			 */
			$item.on("mousedown",function(e) {
				if (e.button == 0) {
					/**
					 * 모바일의 경우 선택모드가 존재하며, 드래그 이벤트를 발생시키지 않는다.
					 */
					if (iModule.isMobile == true) {
						/**
						 * 선택모드일 경우, 선택항목을 토글한다.
						 */
						if (Webhard.$container.attr("data-mobile-select") == "TRUE") {
							if ($(this).hasClass("selected") == true) {
								Webhard.explorer.unselect($(this).attr("data-type"),$(this).attr("data-idx"));
							} else {
								Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
							}
						} else {
							/**
							 * 선택모드가 아닐경우, 폴더는 이동하고 파일은 미리보기 창을 연다.
							 */
							if ($(this).attr("data-type") == "folder") {
								Webhard.explorer.folder($(this).attr("data-idx"),$(this).attr("data-path"));
							} else {
								// @todo 선택모드 일 경우 확인
								Webhard.explorer.preview($(this).attr("data-idx"));
							}
						}
						
						/**
						 * 상위 객체로 이벤트 전달을 취소한다.
						 */
						e.stopPropagation();
						return;
					}
					
					/**
					 * 현재 항목이 선택중인 상태가 아니라면,
					 */
					if ($(this).hasClass("selected") == false) {
						/**
						 * 아이템 다중선택모드가 아닌경우, 현재 아이템만을 선택한다.
						 */
						if (e.shiftKey == false && e.ctrlKey == false && e.metaKey == false) {
							Webhard.explorer.unselectAll();
							Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
						} else {
							/**
							 * shift 키가 눌러졌을 경우 최초 선택아이템부터 현재아이템까지 다중선택한다.
							 */
							if (Webhard.explorer.lastSelect !== null && e.shiftKey == true) {
								var current = $(this).index();
								var last = Webhard.explorer.lastSelect.index();
								var start = Math.min(current,last);
								var end = Math.max(current,last);
								
								for (var i=start;i<=end;i++) {
									var $select = $("div[data-role=file-item]",Webhard.$files).eq(i);
									Webhard.explorer.select($select.attr("data-type"),$select.attr("data-idx"));
								}
							} else if (e.ctrlKey == true || e.metaKey == true) {
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
						Webhard.explorer.lastClick = null;
					} else {
						Webhard.explorer.lastClick = $(this);
					}
					
					/**
					 * 현재폴더가 태그보기나 태그보기 상태가 아닌 경우, 아이템 드래그 이벤트를 시작한다.
					 */
					if (Webhard.explorer.getView() == "folder") {
						Webhard.ui.mousedown($("div[data-role=file-item].selected",Webhard.$files),e);
					}
					
					Webhard.explorer.lastSelect = $(this);
					
					/**
					 * 상위 객체로 이벤트 전달을 취소한다.
					 */
					e.stopPropagation();
				}
				
				if (e.button == 2) {
					if ($(this).hasClass("selected") == false) {
						Webhard.explorer.unselectAll();
						Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
					}
					
					e.stopPropagation();
					Webhard.contextmenu.show(e);
				}
			});
			
			/**
			 * 선택되어 있는 항목을 클릭하였을 때, 선택취소한다.
			 */
			$item.on("mouseup",function() {
				if (Webhard.explorer.lastClick !== null && Webhard.explorer.lastClick.attr("data-type") == $(this).attr("data-type") && Webhard.explorer.lastClick.attr("data-idx") == $(this).attr("data-idx")) {
					Webhard.explorer.unselectAll();
					Webhard.explorer.select($(this).attr("data-type"),$(this).attr("data-idx"));
				}
			});
			
			/**
			 * 아이템 더블클릭
			 */
			$item.on("dblclick",function(e) {
				/**
				 * 모바일일 경우 이벤트를 중단한다.
				 */
				if (iModule.isMobile == true) return;
				
				// 아이템 메뉴를 제거한다.
//				Webhard.contextmenu.hide();
				
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
					Webhard.explorer.preview($(this).attr("data-idx"));
				}
				
				e.stopPropagation();
			});
			
			/**
			 * 체크박스 선택
			 */
			var $checkbox = $("<button>").attr("type","button").attr("data-action","select");
			$checkbox.on("mousedown",function(e) {
				// 아이템 메뉴를 제거한다.
//				Webhard.contextmenu.hide();
				
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
			$item.append($("<div>").addClass("checkbox").append($checkbox));
			
			/**
			 * 즐겨찾기 추가
			 */
			var $favorite = $("<button>").attr("type","button").attr("data-action","favorite");
			$favorite.on("mousedown",function(e) {
				// 아이템 메뉴를 제거한다.
//				Webhard.contextmenu.hide();
				
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
			$item.append($("<div>").addClass("favorite").append($favorite));
			
			// @todo 소스정리
			if (item.is_shared == true) $item.append($("<div>").addClass("shared"));
			if (item.is_deletable == true && item.is_lock == true) $item.append($("<div>").addClass("locked"));
			if (item.type == "folder" && item.is_writable == false) $item.append($("<div>").addClass("readonly"));
			else if (item.type == "folder" && item.is_deletable == false) $item.append($("<div>").addClass("writeonly"));
			if (item.type == "file" && item.is_deletable == false) $item.append($("<div>").addClass("writeonly"));
			
			/**
			 * 항목아이콘 출력
			 */
			var $icon = $("<i>").addClass("icon")
			if (item.type == "folder") {
				$icon.attr("data-type",item.type);
			} else {
				$icon.attr("data-type",item.filetype);
				$icon.attr("data-extension",item.extension);
				
				if (item.preview != null) {
					$icon.append($("<div>").addClass("preview").css("backgroundImage","url('"+item.preview+"')"));
				}
			}
			$item.append($icon);
			
			var $name = $("<div>").addClass("name").append($("<span>").html(item.name));
			$item.append($name);
			
			var $size = $("<div>").addClass("size").append($("<span>").html(item.uploaded == -1 ? "Unknwon" : iModule.getFileSize(item.uploaded)));
			$item.append($size);
			
			var $date = $("<div>").addClass("date").append($("<span>").html(moment.unix(item.date).locale($("html").attr("lang")).format("LLL")));
			$item.append($date);
			
			/**
			 * 업로드중인 항목인 경우 프로그래스바 출력
			 */
			if (item.status == "DRAFT") {
				var $progress = $("<div>").attr("data-role","progress").attr("data-idx",item.idx).append($("<div>").css("width",(item.uploaded/item.size*100)+"%"));
				$icon.append($progress);
				$size.prepend($progress.clone());
			}
			
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
			
			var $button = $("<button>").attr("data-role","more").attr("type","button");
			$button.on("mousedown",function(e) {
				Webhard.contextmenu.show(e);
			});
			var $more = $("<div>").addClass("more").append($button);
			
			$item.append($more);
			
			Webhard.explorer.update($item);
			
			$(document).triggerHandler("Webhard.printItem",[item.type,$item,item]);
		},
		/**
		 * 탐색기 보기형식에 따라 일부요소를 갱신한다.
		 *
		 * @param object $item 갱신할 객체 (없을 경우 전체객체)
		 */
		update:function($item) {
			if ($item) {
				var $name = $("div.name > span",$item);
				var name = $item.data("name");
				
				if (Webhard.$container.attr("data-viewmode") == "card") {
					var limit = name.length;
					$name.html(name.replace(/\(([0-9]+)\)$/,"<i>($1)</i>").replace(/\(([0-9]+)\)\.([a-z0-9]+)$/i,"<i>($1)</i>.$2"));
					while ($name.height() > 40) {
						limit = limit - 1;
						$name.html(Webhard.substring(name,limit).replace(/\(([0-9]+)\)$/,"<i>($1)</i>").replace(/\(([0-9]+)\)\.([a-z0-9]+)$/i,"<i>($1)</i>.$2"));
					}
				} else {
					$name.html(name);
				}
			} else {
				$("div[data-role=file-item]",Webhard.$files).each(function() {
					Webhard.explorer.update($(this));
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
			} else {
				$("button[data-action=select]",Webhard.$headerbar).removeClass("selected");
			}
		},
		/**
		 * 항목을 선택한다.
		 *
		 * @param string type 대상항목 종류 (folder, file)
		 * @param int idx 대상항목 고유번호
		 */
		lastSelect:null,
		lastClick:null,
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
		toggleFavorite:function(is_visible) {
			if (Webhard.explorer.getView() != "folder") return;
			Webhard.explorer.unselectAll();
			if (is_visible == true) {
				$("button[data-action=favorite]",Webhard.$headerbar).addClass("selected");
				$("div[data-role=file-item]",Webhard.$files).hide();
				$("div[data-role=file-item].favorite",Webhard.$files).show();
			} else {
				$("button[data-action=favorite]",Webhard.$headerbar).removeClass("selected");
				$("div[data-role=file-item]",Webhard.$files).show();
			}
		},
		/**
		 * 새로운 폴더를 생성한다.
		 *
		 * @param int parent 폴더를 생성할 상위폴더 (없을 경우 현재폴더)
		 */
		create:function(parent) {
			if (typeof parent == "object" && parent.is("form") == true) {
				var $form = parent;
				$form.send(ENV.getProcessUrl("webhard","create"),function(result) {
					if (result.success == true) {
						iModule.modal.close();
						Webhard.tree.load(result.parent);
						Webhard.explorer.reload();
					}
				});
			} else {
				var parent = parent ? parent : Webhard.explorer.getFolderIdx();
				iModule.modal.get(ENV.getProcessUrl("webhard","getModal"),{modal:"create",parent:parent},function($modal,$form) {
					$form.inits(Webhard.explorer.create);
					return false;
				});
			}
		},
		/**
		 * 항목의 이름을 변경한다.
		 *
		 * @param string type 종류
		 * @param int idx 항목고유번호
		 */
		rename:function(type,idx) {
			if (typeof type == "object" && type.is("form") == true) {
				var $form = type;
				$form.send(ENV.getProcessUrl("webhard","rename"),function(result) {
					if (result.success == true) {
						iModule.modal.close();
						if (result.type == "folder") {
							var $tree = $("div[data-role=tree-item][data-idx="+result.idx+"]",Webhard.$tree);
							if ($tree.length == 1) {
								$tree.data("name",result.name);
								$("div[data-role=title] > span",$tree).html(result.name);
							}
						}
						
						var $item = $("div[data-role=file-item][data-type="+result.type+"][data-idx="+result.idx+"]",Webhard.$files);
						if ($item.length == 1) {
							$("div.name > span",$item).html(result.name);
							$item.data("data",result.meta);
							$item.data("name",result.name);
							Webhard.explorer.update($item);
							Webhard.detail.update();
						}
					}
				});
			} else {
				var parent = parent ? parent : Webhard.explorer.getFolderIdx();
				iModule.modal.get(ENV.getProcessUrl("webhard","getModal"),{modal:"rename",type:type,idx:idx},function($modal,$form) {
					$form.inits(Webhard.explorer.rename);
					return false;
				});
			}
		},
		/**
		 * 아이템을 즐겨찾기에 추가하거나 제거한다.
		 */
		favorite:function(favorite,type,idx) {
			var $item = $("div[data-role=file-item][data-type="+type+"][data-idx="+idx+"]");
			var $favorite = $("button[data-action=favorite]",$item);
			
			$favorite.addClass("mi-loading").disable();
			
			$.send(ENV.getProcessUrl("webhard","updateFavorite"),{favorite:favorite == true ? "true" : "false",type:type,idx:idx},function(result) {
				if (result.success == true) {
					if (result.favorite == true) $item.addClass("favorite");
					else $item.removeClass("favorite");
				}
				
				$favorite.removeClass("mi-loading");
				$favorite.enable();
			});
		},
		/**
		 * 현 위치에서 중요 표시한 파일만 보기
		 *
		 * @param boolean is_visible 중요표시파일만 보기 설정
		 */
		/**
		 * @todo 파일 미리보기
		 *
		 * @param int idx 파일고유번호
		 */
		preview:function(idx) {
			return;
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
		/**
		 * 선택된 파일 다운로드
		 */
		download:function() {
			if (Webhard.explorer.getSelected().length == 0) {
				Webhard.message.show("error",Webhard.getErrorText("NOT_SELECTED_ITEM"),5);
				return;
			}
			
			if (Webhard.explorer.getSelected().length == 1 && Webhard.explorer.getSelected()[0].type == "file") {
				Webhard.download.download(Webhard.explorer.getSelected()[0].idx);
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
			var field = field ? field : Webhard.$container.attr("data-sort");
			var dir = dir ? dir : Webhard.$container.attr("data-dir");
			
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
			
			$("button[data-action=sort]",Webhard.$headerbar).html(Webhard.getText("sort/"+field));
			$("button[data-action=sort]",Webhard.$headerbar).append($("<i>").addClass("mi mi-"+(dir == "asc" ? "up" : "down")));
		},
		/**
		 * 특정 폴더나, 파일로 이동한다.
		 *
		 * @param string type 종류 (folder or file)
		 * @param int idx 고유값
		 */
		show:function(type,idx) {
			Webhard.loading(true);
			
			$.send(ENV.getProcessUrl("webhard","getItem"),{type:type,idx:idx},function(result) {
				Webhard.loading(false);
				
				if (result.success == true) {
					var path = result.item.path.split("/");
					var name = path.pop();
					
					Webhard.explorer.folder(result.item.folder,path.join("/"),function(result) {
						var $item = $("div[data-role=file-item][data-type="+type+"][data-idx="+idx+"]",Webhard.$files);
						Webhard.$files.animate({scrollTop:$item.position().top},"fast",function() {
							Webhard.explorer.unselectAll();
							Webhard.explorer.select(type,idx);
						});
					});
				}
			});
		},
		/**
		 * 항목 드래그 중 같은 폴더위에 마우스가 8초 이상 위치하고 있으면, 해당 폴더로 이동한다.
		 */
		autoExpand:function(idx,count) {
			var count = count ? count : 0;
			if (count == 0 && Webhard.ui.autoExpandTimer != null) {
				clearTimeout(Webhard.ui.autoExpandTimer);
				Webhard.ui.autoExpandTimer = null;
				$("div[data-role=file-item]").removeClass("droppable");
			}
			var $item = $("div[data-role=file-item][data-idx="+idx+"]",Webhard.$files);
			
			if (count % 2 == 0) $item.addClass("droppable");
			else $item.removeClass("droppable");
			
			if (count == 8) {
				Webhard.explorer.folder($item.attr("data-idx"),$item.attr("data-path"),null,true);
			} else {
				Webhard.ui.autoExpandTimer = setTimeout(Webhard.explorer.autoExpand,100,idx,++count);
			}
		},
		copy:function() {
			if (Webhard.explorer.getSelected().length == 0) {
				Webhard.message.show("error",Webhard.getErrorText("NOT_SELECTED_ITEM"),5);
				return;
			}
			
			try {
				window.sessionStorage.setItem("clipboard",JSON.stringify({items:Webhard.explorer.getSelected(),mode:"copy"}));
				Webhard.message.show("info",Webhard.getText("text/copy").replace("{COUNT}",Webhard.explorer.getSelected().length),5);
				Webhard.explorer.clipboardClass();
			} catch (e) {
				Webhard.message.show("error",Webhard.getErrorText("DISABLED_SESSION_STORAGE"),5);
			}
		},
		/**
		 * 아이템을 잘라내기한다.
		 */
		crop:function() {
			if (Webhard.explorer.getSelected().length == 0) {
				Webhard.message.show("error",Webhard.getErrorText("NOT_SELECTED_ITEM"),5);
				return;
			}
			
			try {
				window.sessionStorage.setItem("clipboard",JSON.stringify({items:Webhard.explorer.getSelected(),mode:"move"}));
				Webhard.message.show("info",Webhard.getText("text/crop").replace("{COUNT}",Webhard.explorer.getSelected().length),5);
				Webhard.explorer.clipboardClass();
			} catch (e) {
				Webhard.message.show("error",Webhard.getErrorText("DISABLED_SESSION_STORAGE"),5);
			}
		},
		/**
		 * 잘라내기 / 복사한 항목의 스타일을 지정한다.
		 */
		clipboardClass:function() {
			$("div[data-role=file-item]",Webhard.$files).removeClass("clipboard");
			
			try {
				var clipboardItem = JSON.parse(window.sessionStorage.getItem("clipboard"));
			} catch (e) {
				var clipboardItem = null;
			}
			
			if (clipboardItem != null) {
				for (var i=0, loop=clipboardItem.items.length;i<loop;i++) {
					var $item = $("div[data-role=file-item][data-type="+clipboardItem.items[i].type+"][data-idx="+clipboardItem.items[i].idx+"]");
					if ($item.hasClass("clipboard") == false) $item.addClass("clipboard");
				}
			}
		},
		/**
		 * 잘라내기 / 복사한 항목을 붙여넣기 한다.
		 */
		paste:function() {
			try {
				var clipboardItem = JSON.parse(window.sessionStorage.getItem("clipboard"));
			} catch (e) {
				var clipboardItem = null;
			}
			
			if (clipboardItem != null) {
				Webhard.explorer.move(Webhard.explorer.getFolderIdx(),clipboardItem.items,clipboardItem.mode);
				window.sessionStorage.removeItem("clipboard");
				Webhard.explorer.clipboardClass();
			} else {
				Webhard.message.show("error",Webhard.getErrorText("NOT_FOUND_CLIPBOARD"),5);
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
					Webhard.explorer.moveItem = result.select;
					
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
						
						Webhard.loading(false);
					}
				} else {
					if (result.message) {
						Webhard.message.show("error",result.message,5);
						return false;
					}
				}
			});
		},
		/**
		 * 선택항목 삭제하기
		 */
		deleteItem:null,
		delete:function($form) {
			if (typeof $form == "object" && $form.is("form") == true) {
				$form.status("loading");
				
				$.send(ENV.getProcessUrl("webhard","delete"),{select:JSON.stringify(Webhard.explorer.deleteItem)},function(result) {
					if (result.success == true) {
						Webhard.explorer.deleteItem = result.select;
						
						if (result.modalHtml) {
							iModule.modal.showHtml(result.modalHtml,function($modal,$form) {
								$("button[data-action]",$form).on("click",function() {
									var idx = parseInt($("input[name=idx]",$form).val());
									
									Webhard.explorer.deleteItem[idx].deleteOption = $(this).attr("data-action");
									
									$(this).status("loading");
									$("button",$form).disable();
									$form.submit();
								});
								$form.inits(Webhard.explorer.delete);
								
								return false;
							});
						} else {
							for (var i=0, loop=result.select.length;i<loop;i++) {
								if (result.select[i].success == true) {
									$("div[data-role=file-item][data-type="+result.select[i].type+"][data-idx="+result.select[i].idx+"]",Webhard.$files).remove();
									
									if (result.select[i].type == "folder") {
										$("li[data-idx="+result.select[i].idx+"]",Webhard.$tree).remove();
									}
								}
							}
							
							Webhard.explorer.deleteItem = null;
							iModule.modal.close();
						}
					}
				});
			} else {
				var items = Webhard.explorer.getSelected();
				
				if (items.length == 0) {
					Webhard.message.show("error",Webhard.getErrorText("NOT_SELECTED_ITEM"),5);
					return;
				}
				
				Webhard.explorer.deleteItem = [];
				for (var i=0, loop=items.length;i<loop;i++) {
					var item = {};
					item.type = items[i].type;
					item.idx = items[i].idx;
					item.name = items[i].name;
					item.deleteOption = null;
					item.success = null;
					
					Webhard.explorer.deleteItem.push(item);
				}
				
				iModule.modal.get(ENV.getProcessUrl("webhard","getModal"),{modal:"delete",select:JSON.stringify(Webhard.explorer.deleteItem)},function($modal,$form) {
					$form.inits(Webhard.explorer.delete);
					return false;
				});
			}
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
		}
	},
	/**
	 * 컨텍스트 메뉴
	 */
	contextmenu:{
		/**
		 * 마우스 우측버튼(컨텍스트메뉴)를 출력한다.
		 *
		 * @param MouseEvent e
		 */
		$target:null,
		$menu:null,
		show:function(e) {
			if ((e.metaKey == true || e.ctrlKey == true) && e.shiftKey == true) return;
			
			/**
			 * 기존의 컨텍스트메뉴가 있다면 제거한다.
			 */
			if (Webhard.contextmenu.$menu !== null) Webhard.contextmenu.$menu.remove();
			
			Webhard.contextmenu.$menu = $("<ul>").attr("data-role","contextmenu");
			var $target = $(e.target);
			
			if ($target.parents("div[data-role=file-item]").length > 0) {
				Webhard.contextmenu.$target = $target.parents("div[data-role=file-item]").eq(0);
				if (Webhard.contextmenu.$target.hasClass("selected") == false) {
					Webhard.explorer.unselectAll();
					Webhard.explorer.select(Webhard.contextmenu.$target.attr("data-type"),Webhard.contextmenu.$target.attr("data-idx"));
				}
			} else if ($target.parents("div[data-role=tree-item]").length > 0) {
				Webhard.contextmenu.$target = $target.parents("div[data-role=tree-item]").eq(0);
				if (Webhard.contextmenu.$target.hasClass("selected") == false) {
					Webhard.contextmenu.$target.addClass("selected");
				}
			} else {
				Webhard.contextmenu.$target = Webhard.$files;
			}
			
			if (Webhard.explorer.getView() == "trash") {
				var commands = ["restore","remove","-","download","-","detail","-","empty"];
			} else {
				var commands = ["create","-","rename","delete","-","showFavorite","showAll","-","selectAll","copy","crop","paste","-","download","-","detail","-","link"];
			}
			
//			var commands = ["showFavorite"];
			
			for (var i=0, loop=commands.length;i<loop;i++) {
				if (commands[i] == "-") Webhard.contextmenu.divide();
				else if (typeof Webhard.contextmenu[commands[i]] == "function") Webhard.contextmenu[commands[i]]();
			}
			
			if ($("li:last",Webhard.contextmenu.$menu).hasClass("divide") == true) $("li:last",Webhard.contextmenu.$menu).remove();
			if ($("li",Webhard.contextmenu.$menu).length == 0) {
				Webhard.contextmenu.$menu = null;
				Webhard.contextmenu.$target = null;
				return;
			}
			
			/**
			 * 모바일이고 메뉴가 나타난 곳이 More 버튼일 경우
			 */
			if ($target.attr("data-role") == "more") {
				if ($(window).width() > 400) {
					$target.parent().prepend(Webhard.contextmenu.$menu);
					
					var x = $target.offset().left - Webhard.$container.position().left;
					if (x + Webhard.contextmenu.$menu.width() + 10 > Webhard.$container.width()) {
						Webhard.contextmenu.$menu.css("left","auto").css("right",0);
					} else {
						Webhard.contextmenu.$menu.css("left",0).css("right","auto");
					}
					
					var y = $target.offset().top - Webhard.$container.position().top + $target.height();
					if (y + Webhard.contextmenu.$menu.height() + 10 > Webhard.$container.height()) {
						Webhard.contextmenu.$menu.css("top","auto").css("bottom",$target.height());
					} else {
						Webhard.contextmenu.$menu.css("top",$target.height()).css("bottom","auto");
					}
				} else {
					Webhard.$container.append(Webhard.contextmenu.$menu);
				}
//				var y = e.clientY - $target.position().top + $target.height();
				
				
			} else {
				Webhard.$container.append(Webhard.contextmenu.$menu);
				
				var x = e.clientX - Webhard.$container.position().left;
				var y = e.clientY - Webhard.$container.position().top;
				
				if (x + Webhard.contextmenu.$menu.width() + 10 > Webhard.$container.width()) {
					Webhard.contextmenu.$menu.css("left","auto").css("right",Webhard.$container.width() - x);
				} else {
					Webhard.contextmenu.$menu.css("left",x).css("right","auto");
				}
				
				if (y + Webhard.contextmenu.$menu.height() + 10 > Webhard.$container.height()) {
					Webhard.contextmenu.$menu.css("top","auto").css("bottom",Webhard.$container - y);
				} else {
					Webhard.contextmenu.$menu.css("top",y).css("bottom","auto");
				}
			}
			
			$("button",Webhard.contextmenu.$menu).on("mousedown",function(e) {
				e.stopPropagation();
			});
			
			$("button",Webhard.contextmenu.$menu).on("click",function(e) {
				Webhard.contextmenu.hide();
			});
			
			var height = Webhard.contextmenu.$menu.height();
			Webhard.contextmenu.$menu.height(0);
			Webhard.contextmenu.$menu.animate({height:height},"fast");
			
			e.stopPropagation();
		},
		/**
		 * 컨텍스트 메뉴 숨기기
		 */
		hide:function(animate) {
			if (Webhard.contextmenu.$menu === null) return;
			var animate = animate !== false ? true : false;
			
			if (iModule.isMobile == true && Webhard.$container.attr("data-mobile-select") == "FALSE" && Webhard.contextmenu.$target.attr("data-role") == "file-item") {
				Webhard.contextmenu.$target.removeClass("selected");
			}
			
			if (Webhard.contextmenu.$target.attr("data-role") == "tree-item") {
				Webhard.contextmenu.$target.removeClass("selected");
			}
			
			if (animate == true) {
				Webhard.contextmenu.$menu.animate({height:0},"fast",function() {
					Webhard.contextmenu.$menu.trigger("remove").remove();
				});
			} else {
				Webhard.contextmenu.$menu.trigger("remove").remove();
			}
		},
		/**
		 * 구분선
		 */
		divide:function() {
			if ($("li",Webhard.contextmenu.$menu).length == 0) return;
			if ($("li:last",Webhard.contextmenu.$menu).hasClass("divide") == true) return;
			
			Webhard.contextmenu.$menu.append($("<li>").addClass("divide"));
		},
		/**
		 * 새폴더 만들기
		 */
		create:function() {
			if (Webhard.contextmenu.$target.attr("data-role") != "files") return;
			if (Webhard.explorer.getView() != "folder") return;
			
			var $item = $("<button>").attr("type","button").attr("data-action","create");
			$item.append($("<i>"));
			$item.append($("<span>").html(Webhard.getText("contextmenu/create")));
			
			$item.on("click",function(e) {
				Webhard.explorer.create();
			});
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		},
		/**
		 * 중요 표시한 파일/폴더만 보기
		 */
		showFavorite:function() {
			if (Webhard.contextmenu.$target.attr("data-role") != "files") return;
			if (Webhard.explorer.getView() == "trash" || Webhard.explorer.getView() == "favorite") return;
			
			var $item = $("<button>").attr("type","button").attr("data-action","show_favorite");
			$item.append($("<i>"));
			$item.append($("<span>").html(Webhard.getText("contextmenu/show_favorite")));
			
			$item.on("click",function(e) {
				Webhard.explorer.toggleFavorite(true);
			});
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		},
		/**
		 * 전체파일보기
		 */
		showAll:function() {
			if (Webhard.contextmenu.$target.attr("data-role") != "files") return;
			if (Webhard.explorer.getView() == "trash" || Webhard.explorer.getView() == "favorite") return;
			
			var $item = $("<button>").attr("type","button").attr("data-action","show_all");
			$item.append($("<i>"));
			$item.append($("<span>").html(Webhard.getText("contextmenu/show_all")));
			$item.on("click",function() {
				Webhard.explorer.toggleFavorite(false);
			});
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		},
		/**
		 * 이름변경하기
		 */
		rename:function() {
			if (Webhard.contextmenu.$target.attr("data-role") == "files") return;
			if (Webhard.contextmenu.$target.attr("data-role") == "file-item" && Webhard.explorer.getSelected().length != 1) return;
			
			var $item = $("<button>").attr("type","button").attr("data-action","rename");
			$item.append($("<i>"));
			$item.append($("<span>").html(Webhard.getText("contextmenu/rename")));
			
			if (Webhard.contextmenu.$target.is("[data-role=tree-item]") == true) {
				$item.on("click",function() {
					Webhard.explorer.rename("folder",Webhard.contextmenu.$target.attr("data-idx"));
				});
			} else {
				$item.on("click",function() {
					Webhard.explorer.rename(Webhard.explorer.getSelected()[0].type,Webhard.explorer.getSelected()[0].idx);
				});
			}
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		},
		/**
		 * 삭제하기
		 */
		delete:function() {
			if (Webhard.contextmenu.$target.attr("data-role") == "files") return;
			if (Webhard.contextmenu.$target.attr("data-role") == "file-item") {
				if (Webhard.explorer.getView() == "trash") {
					var $item = $("<button>").attr("type","button").attr("data-action","remove");
					$item.append($("<i>"));
					$item.append($("<span>").html(Webhard.getText("contextmenu/remove")));
					$item.on("click",function() {
						Webhard.explorer.remove();
					});
					Webhard.contextmenu.$menu.append($("<li>").append($item));
				} else {
					var $item = $("<button>").attr("type","button").attr("data-action","delete");
					$item.append($("<i>"));
					$item.append($("<span>").html(Webhard.getText("contextmenu/delete")));
					$item.on("click",function() {
						Webhard.explorer.delete();
					});
					Webhard.contextmenu.$menu.append($("<li>").append($item));
				}
			} else if (Webhard.contextmenu.$target.attr("data-role") == "tree-item") {
				var $item = $("<button>").attr("type","button").attr("data-action","delete");
				$item.append($("<i>"));
				$item.append($("<span>").html(Webhard.getText("contextmenu/delete")));
				$item.on("click",function() {
					Webhard.tree.delete(Webhard.contextmenu.$target.attr("data-idx"));
				});
				Webhard.contextmenu.$menu.append($("<li>").append($item));
			}
		},
		/**
		 * 다운로드
		 */
		download:function() {
			if (Webhard.contextmenu.$target.attr("data-role") != "file-item") return;
			if (Webhard.explorer.getSelected().length == 0) return;
			
			var $item = $("<button>").attr("type","button").attr("data-action","download");
			$item.append($("<i>"));
			$item.append($("<span>").html(Webhard.getText("contextmenu/download")));
			$item.on("click",function() {
				Webhard.explorer.download();
			});
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		}/*,
		
		copy:function() {
			if (Webhard.explorer.getSelected().length > 0) {
				var $item = $("<button>").attr("type","button").html("복사하기");
				$item.on("click",function() {
					Webhard.explorer.copy();
					Webhard.contextmenu.hide();
				});
				Webhard.contextmenu.$menu.append($("<li>").append($item));
			}
		},
		crop:function() {
			if (Webhard.explorer.getSelected().length > 0) {
				var $item = $("<button>").attr("type","button").html("잘라내기");
				$item.on("click",function() {
					Webhard.explorer.crop();
					Webhard.contextmenu.hide();
				});
				Webhard.contextmenu.$menu.append($("<li>").append($item));
			}
		},
		paste:function() {
			var $item = $("<button>").attr("type","button").html("붙여넣기");
			$item.on("click",function() {
				Webhard.explorer.paste();
				Webhard.contextmenu.hide();
			});
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		},
		link:function() {
			if (Webhard.explorer.getSelected().length == 1 && Webhard.explorer.getSelected()[0].indexOf("/") == -1) {
				var $item = $("<button>").attr("type","button").html("외부공유");
				$item.on("click",function() {
					Webhard.explorer.link();
					Webhard.contextmenu.hide();
				});
				Webhard.contextmenu.$menu.append($("<li>").append($item));
			}
		},
		detail:function() {
			var $item = $("<button>").attr("type","button").html("상세정보");
			$item.on("click",function() {
				Webhard.$container.attr("data-detail","true");
				Webhard.detail.update();
				Webhard.contextmenu.hide();
			});
			Webhard.contextmenu.$menu.append($("<li>").append($item));
		}*/
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
	/**
	 * 업로드
	 */
	upload:{
		isUploadable:true,
		isUploading:false,
		prepareFiles:[],
		checkFiles:[],
		uploadFiles:[],
		currentIdx:null,
		xhr:null,
		hideListTimer:null,
		/**
		 * 업로드할 파일을 선택한다. (drop 이벤트 또는 input 의 change 이벤트 발생시)
		 *
		 * @param FileList files 이벤트 발생에 따른 파일목록
		 */
		select:function(files) {
			if (Webhard.upload.isUploadable == false) {
				Webhard.message.show("error",Webhard.getErrorText("UPLOAD_NOT_AVAILABLE"),5);
				return;
			}
			
			Webhard.upload.isUploadable = false;
			Webhard.upload.prepareFiles = files;
			
			if (Webhard.upload.prepareFiles.length > 0) {
				Webhard.upload.check();
			}
		},
		/**
		 * 업로드할 대상의 중복체크 및 DB데이터 생성을 위한 과정
		 */
		check:function($form) {
			if (typeof $form == "object" && $form.is("form") == true) {
				
			} else {
				Webhard.upload.checkFiles = [];
				
				for (var i=0, loop=Webhard.upload.prepareFiles.length;i<loop;i++) {
					var file = {};
					file.idx = 0;
					file.code = null;
					file.name = Webhard.upload.prepareFiles[i].name;
					file.type = Webhard.upload.prepareFiles[i].type;
					file.size = Webhard.upload.prepareFiles[i].size;
					file.is_share = false;
					file.chunkStart = 0;
					file.duplicatedOption = null;
					file.duplicatedContinue = null;
					file.success = null;
					
					Webhard.upload.checkFiles[i] = file;
				}
			}
			
			Webhard.loading(true);
			$.send(ENV.getProcessUrl("webhard","checkFile"),{target:Webhard.explorer.getFolderIdx(),files:JSON.stringify(Webhard.upload.checkFiles)},function(result) {
				if (result.success == true) {
					Webhard.upload.checkFiles = result.files;
					
					if (result.modalHtml) {
						iModule.modal.showHtml(result.modalHtml,function($modal,$form) {
							$("button[data-action]",$form).on("click",function() {
								var idx = parseInt($("input[name=idx]",$form).val());
								
								if ($(this).attr("data-action") == "copy") {
									Webhard.upload.checkFiles[idx].mode = "copy";
								} else {
									Webhard.upload.checkFiles[idx].duplicatedOption = $(this).attr("data-action");
									Webhard.upload.checkFiles[idx].duplicatedContinue = $("input[name=continue]",$form).is(":checked");
								}
								
								$(this).status("loading");
								$("button",$form).disable();
								$form.submit();
							});
							$form.inits(Webhard.upload.check);
							
							return false;
						});
					} else {
						for (var i=0, loop=Webhard.upload.checkFiles.length;i<loop;i++) {
							if (Webhard.upload.checkFiles[i].success == true) {
								var file = Webhard.upload.prepareFiles[i];
								console.log("pre",i,file);
								file.idx = Webhard.upload.checkFiles[i].idx;
								file.code = Webhard.upload.checkFiles[i].code;
								file.chunkStart = Webhard.upload.checkFiles[i].chunkStart;
								file.failCount = 0;
								file.file = Webhard.upload.checkFiles[i].file;
								file.status = "WAIT";
								
								/**
								 * 파일을 업로드하는 대상폴더와 현재폴더가 동일할 경우 탐색기에 항목을 추가한다.
								 */
								if (Webhard.explorer.getView() == "folder" && Webhard.explorer.getFolderIdx() == Webhard.upload.checkFiles[i].file.folder) {
									Webhard.explorer.print(Webhard.upload.checkFiles[i].file);
								}
								Webhard.upload.uploadFiles.push(file);
							}
						}
						
						Webhard.explorer.sort();
						
						Webhard.upload.isUploadable = true;
						if (Webhard.upload.uploadFiles.length > 0) Webhard.upload.start();
						
						iModule.modal.close();
						Webhard.loading(false);
					}
				} else {
					iModule.modal.close();
					Webhard.loading(false);
					if (result.message) {
						Webhard.message.show("error",result.message,5);
						return false;
					}
				}
			});
		},
		/**
		 * 업로드 목록을 업데이트한다.
		 *
		 * @param boolean is_reset 기존 목록을 리셋할지 여부 (기본값 : false)
		 * @todo 언어셋 적용
		 */
		update:function(is_reset) {
			var $upload = $("div[data-role=upload]",Webhard.$container);
			var $list = $("ul",$upload);
			if (is_reset === true) {
				
			}
			
			for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
				if ($("li[data-idx="+Webhard.upload.uploadFiles[i].idx+"]",$list).length == 0) {
					var $item = $("<li>").attr("data-idx",Webhard.upload.uploadFiles[i].idx);
					
					var $icon = $("<i>").addClass("icon").attr("data-type",Webhard.upload.uploadFiles[i].file.filetype).attr("data-extension",Webhard.upload.uploadFiles[i].file.extension);
					
					var $cancel = $("<button>").attr("type","button").attr("data-action","cancel").html('<i class="mi mi-close"></i><div>업로드취소</div>');
					$cancel.on("click",function() {
						Webhard.upload.cancel($(this).parents("li").attr("data-idx"));
					});
					$icon.append($cancel);
					
					var $restart = $("<button>").attr("type","button").attr("data-action","restart").html('<i class="mi mi-refresh"></i><div>업로드재개</div>');
					$restart.on("click",function() {
						Webhard.upload.restart($(this).parents("li").attr("data-idx"));
					});
					$icon.append($restart);
					
					var $search = $("<button>").attr("type","button").attr("data-action","search").html('<i class="mi mi-search"></i><div>파일로 이동</div>');
					$search.on("click",function() {
						Webhard.explorer.show("file",$(this).parents("li").attr("data-idx"));
					});
					$icon.append($search);
					
					$item.append($icon);
					
					var $info = $("<div>");
					
					var $meta = $("<div>").attr("data-role","meta");
					var $size = $("<span>").attr("data-role","size").html(iModule.getFileSize(Webhard.upload.uploadFiles[i].chunkStart)+"/"+iModule.getFileSize(Webhard.upload.uploadFiles[i].size));
					$meta.append($size);
					
					var $name = $("<span>").attr("data-role","name").html(Webhard.upload.uploadFiles[i].file.name);
					$meta.append($name);
					
					$info.append($meta);
					
					var $progress = $("<div>").attr("data-role","progress").attr("data-idx",Webhard.upload.uploadFiles[i].idx).append($("<div>").width((Webhard.upload.uploadFiles[i].chunkStart/Webhard.upload.uploadFiles[i].size*100)+"%"));
					$info.append($progress);
					
					$item.append($info);
					$list.append($item);
				} else {
					var $item = $("li[data-idx="+Webhard.upload.uploadFiles[i].idx+"]",$list);
				}
				
				$item.attr("data-complete",Webhard.upload.uploadFiles[i].status == "COMPLETE" ? "TRUE" : "FALSE");
				$item.attr("data-cancel",Webhard.upload.uploadFiles[i].status == "CANCEL" ? "TRUE" : "FALSE");
				
				if (Webhard.upload.uploadFiles[i].status == "COMPLETE") {
					$("span[data-role=size]",$item).html(iModule.getFileSize(Webhard.upload.uploadFiles[i].size)+"/"+iModule.getFileSize(Webhard.upload.uploadFiles[i].size));
					$("div[data-role=progress] > div",$item).width("100%");
				}
			}
			
			if (Webhard.upload.uploadFiles.length > 0) {
				if ($("div[data-role=upload]",Webhard.$container).is(":visible") == false) {
					$("div[data-role=upload]",Webhard.$container).show();
					$("div[data-role=upload]",Webhard.$container).css("bottom",$("div[data-role=upload]",Webhard.$container).height() * -1);
					$("div[data-role=upload]",Webhard.$container).animate({bottom:0},"fast");
				}
			}
		},
		/**
		 * 업로드 준비가 끝난 파일목록을 업로드큐로 옮기고, 업로드목록을 구성한다.
		 */
		start:function() {
			/**
			 * 업로드 목록 만들기
			 */
			Webhard.upload.update();
			
			/**
			 * 현재 업로드중이 아니라면, 업로드를 시작한다.
			 */
			if (Webhard.upload.isUploading === false) {
				Webhard.upload.currentIdx = null;
				Webhard.upload.upload();
			}
		},
		/**
		 * 파일을 업로드한다.
		 */
		upload:function() {
			/**
			 * 업로드가 진행중이라면 무시한다.
			 */
			if (Webhard.upload.isUploading === true) return;
			
			/**
			 * 현재 업로드 대상이 없으면 다음 업로드 대상을 찾는다.
			 */
			if (Webhard.upload.currentIdx === null || Webhard.upload.uploadFiles[Webhard.upload.currentIdx].status !== "WAIT") {
				Webhard.upload.currentIdx = null;
				
				for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
					if (Webhard.upload.uploadFiles[i].status === "WAIT") {
						Webhard.upload.currentIdx = i;
						break;
					}
				}
				
				/**
				 * 업로드할 대상이 없다면, 업로드를 완료한다.
				 */
				if (Webhard.upload.currentIdx === null) {
					Webhard.upload.complete();
					return;
				}
			}
			
			Webhard.upload.isUploading = true;
			var file = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
			file.chunkEnd = Math.min(file.size,file.chunkStart + 2 * 1024 * 1024);
			file.status = "UPLOADING";
			
			$.ajax({
				url:ENV.getProcessUrl("webhard","uploadFile")+"?code="+file.code,
				method:"POST",
				contentType:file.type,
				headers:{
					"Content-Range":"bytes " + file.chunkStart + "-" + (file.chunkEnd - 1) + "/" + file.size
				},
				xhr:function() {
					var xhr = $.ajaxSettings.xhr();
					Webhard.upload.xhr = xhr;
					
					if (xhr.upload) {
						xhr.upload.addEventListener("progress",function(e) {
							if (Webhard.upload.currentIdx === null) return;
							
							var currentFile = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
							if (e.lengthComputable) {
								var percent = (currentFile.chunkStart + e.loaded) / currentFile.size * 100;
								var $progress = $("div[data-role=progress][data-idx="+currentFile.idx+"] > div",Webhard.$container);
								$progress.css("width",percent+"%");
								
								var $item = $("li[data-idx="+currentFile.idx+"]",Webhard.$upload);
								$("span[data-role=size]",$item).html(iModule.getFileSize(currentFile.chunkStart + e.loaded)+"/"+iModule.getFileSize(currentFile.size));
							}
						},false);
						
						xhr.upload.addEventListener("abort",function(e) {
							if (Webhard.upload.currentIdx !== null) {
								var currentFile = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
								currentFile.status = "CANCEL";
							}
							Webhard.message.show("error",Webhard.getText("text/upload_canceled"),5);
						});
					}
	
					return xhr;
				},
				processData:false,
				data:file.slice(file.chunkStart,file.chunkEnd)
			}).done(function(result) {
				Webhard.upload.isUploading = false;
				Webhard.upload.xhr = null;
				
				if (Webhard.upload.currentIdx !== null) {
					var currentFile = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
					currentFile.status = "WAIT";
					if (result.success == true) {
						currentFile.failCount = 0;
						currentFile.loaded = currentFile.chunkEnd;
						
						if (currentFile.chunkEnd == currentFile.size) {
							currentFile.file = result.file;
							Webhard.upload.done();
						} else {
							currentFile.chunkStart = currentFile.chunkEnd;
							Webhard.upload.upload();
						}
					} else {
						if (currentFile.failCount < 3) {
							currentFile.failCount++;
							Webhard.upload.upload();
						} else {
							currentFile.status = "CANCEL";
						}
					}
				}
			}).fail(function() {
				Webhard.upload.isUploading = false;
				Webhard.upload.xhr = null;
				var currentFile = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
				currentFile.status = "WAIT";
				if (currentFile.failCount < 3) {
					currentFile.failCount++;
					Webhard.upload.upload();
				}
			});
		},
		/**
		 * 현재파일 업로드 완료
		 */
		done:function() {
			var currentFile = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
			currentFile.status = "COMPLETE";
			
			Webhard.upload.currentIdx = null;
			if (Webhard.explorer.getFolderIdx() == currentFile.file.folder) {
				Webhard.explorer.print(currentFile.file);
			}
			Webhard.explorer.sort();
			Webhard.upload.update();
			Webhard.upload.upload();
		},
		/**
		 * 전체파일 업로드 완료
		 */
		complete:function() {
			var remains = [];
			var completes = [];
			for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
				if (Webhard.upload.uploadFiles[i].status == "COMPLETE") {
					completes.push(Webhard.upload.uploadFiles[i].file);
				} else {
					remains.push(Webhard.upload.uploadFiles[i]);
				}
			}
			
			Webhard.upload.uploadFiles = remains;
			
			if (Webhard.upload.uploadFiles.length == 0) {
				$("#ModuleWebhardUploadInput").reset();
			}
		},
		/**
		 * 업로드 실패/취소된 파일의 업로드를 재개한다.
		 *
		 * @param int idx 파일 고유번호
		 */
		restart:function(idx) {
			$.send(ENV.getProcessUrl("webhard","restartFile"),{idx:idx},function(result) {
				if (result.success == true) {
					/**
					 * 취소된 파일이었다면, 다시 파일목록에 추가한다.
					 */
					if (result.file.folder == Webhard.explorer.getFolderIdx()) {
						Webhard.explorer.print(result.file);
						Webhard.explorer.sort();
					}
					
					/**
					 * 업로드 대기목록에서 취소하려는 파일의 상태를 변경한다.
					 */
					var is_restart = false;
					for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
						if (Webhard.upload.uploadFiles[i].idx == idx) {
							Webhard.upload.uploadFiles[i].status = "WAIT";
							Webhard.upload.uploadFiles[i].chunkStart = result.chunkStart;
							is_restart = true;
							break;
						}
					}
					
					if (is_restart == true) {
						Webhard.upload.upload();
					} else {
						Webhard.message.show("error",Webhard.getErrorText("UPLOAD_RESTART_FAILED"),5);
					}
				} else {
					Webhard.message.show("error",result.message,5);
				}
				return false;
			});
		},
		/**
		 * 특정 파일의 업로드를 취소한다.
		 *
		 * @param int idx 파일 고유번호
		 */
		cancel:function(idx) {
			if (typeof idx == "object" && idx.is("form") == true) {
				var $form = idx;
				var idx = $("input[name=idx]",$form).val();
				
				/**
				 * 현재 업로드중인 파일인지 파악한다.
				 */
				if (Webhard.upload.currentIdx !== null) {
					var currentFile = Webhard.upload.uploadFiles[Webhard.upload.currentIdx];
					if (currentFile.idx == idx) {
						if (Webhard.upload.xhr !== null) {
							Webhard.upload.xhr.abort();
						}
						Webhard.upload.currentIdx = null;
					}
				}
				
				/**
				 * 업로드 대기목록에서 취소하려는 파일의 상태를 변경한다.
				 */
				for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
					if (Webhard.upload.uploadFiles[i].idx == idx) {
						Webhard.upload.uploadFiles[i].status = "CANCEL";
						break;
					}
				}
				
				/**
				 * 업로드목록에서 해당파일의 상태를 변경한다.
				 */
				$("li[data-idx="+idx+"]",Webhard.$upload).attr("data-cancel","TRUE");
				
				$form.send(ENV.getProcessUrl("webhard","cancelFile"),function(result) {
					if (result.success == true) {
						$("div[data-role=file-item][data-type=file][data-idx="+idx+"]",Webhard.$files).remove();
					}
					iModule.modal.close();
				});
			} else {
				iModule.modal.get(ENV.getProcessUrl("webhard","getModal"),{modal:"cancel",type:"upload",idx:idx},function($modal,$form) {
					$form.inits(Webhard.upload.cancel);
					return false;
				});
			}
		},
		/**
		 * 업로드중인 모든 파일을 취소한다.
		 */
		cancelAll:function($form) {
			/**
			 * 현재 업로드중인 XHR 객체가 있다면 중단한다.
			 */
			if (Webhard.upload.xhr !== null) {
				Webhard.upload.xhr.abort();
			}
			
			Webhard.upload.xhr = null;
			Webhard.upload.currentIdx = null;
			
			/**
			 * 업로드가 완료되지 않은 파일을 휴지통으로 이동한다.
			 */
			var deleteFiles = [];
			for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
				if (Webhard.upload.uploadFiles[i].status != "COMPLETE" && Webhard.upload.uploadFiles[i].status != "CANCEL") {
					deleteFiles.push(Webhard.upload.uploadFiles[i].idx);
				}
			}
			
			Webhard.upload.uploadFiles = [];
			
			$.send(ENV.getProcessUrl("webhard","cancelFile"),{files:JSON.stringify(deleteFiles)},function(result) {
				if (result.success == true) {
					for (var i=0, loop=result.files.length;i<loop;i++) {
						$("div[data-role=file-item][data-type=file][data-idx="+result.files[i]+"]",Webhard.$files).remove();
					}
				}
			});
			
			if ($form !== undefined && typeof $form == "object" && $form.is("form") == true) {
				iModule.modal.close();
			}
			
			Webhard.upload.close();
		},
		/**
		 * 업로드 목록을 최소화/복원한다.
		 */
		toggle:function() {
			var $list = $("ul",Webhard.$upload);
			
			if ($list.is(":visible") == true) {
				$list.animate({height:0},"fast",function() {
					$list.height("");
					$list.hide();
					Webhard.$upload.addClass("minimum");
				});
			} else {
				$list.show();
				var height = $list.height();
				$list.height(0);
				
				$list.animate({height:height},"fast",function() {
					$list.height("");
					Webhard.$upload.removeClass("minimum");
				});
			}
		},
		/**
		 * 업로드 목록을 닫는다.
		 */
		close:function() {
			var is_complete = true;
			for (var i=0, loop=Webhard.upload.uploadFiles.length;i<loop;i++) {
				if (Webhard.upload.uploadFiles[i].status != "COMPLETE" && Webhard.upload.uploadFiles[i].status != "CANCEL") {
					is_complete = false;
				}
			}
			
			if (is_complete == true) {
				Webhard.upload.uploadFiles = [];
				Webhard.$upload.animate({bottom:Webhard.$upload.height() * -1},"fast",function() {
					$("ul",Webhard.$upload).empty();
					Webhard.$upload.hide();
					Webhard.$upload.css("bottom",0);
				});
			} else {
				iModule.modal.get(ENV.getProcessUrl("webhard","getModal"),{modal:"cancel",type:"upload"},function($modal,$form) {
					$form.inits(Webhard.upload.cancelAll);
				});
			}
		}
	},
	/**
	 * 항목을 다운로드한다.
	 */
	download:{
		/**
		 * 특정 파일 한개를 다운로드한다.
		 *
		 * @param int idx 다운로드받을 항목고유번호
		 */
		download:function(idx) {
			$.send(ENV.getProcessUrl("webhard","getItem"),{type:"file",idx:idx},function(result) {
				if (result.item.permission.indexOf("R") == -1) {
					Webhard.message.show("error",Webhard.getErrorText("FORBIDDEN"));
				} else if (result.item.status == "DRAFT") {
					Webhard.message.show("error",Webhard.getErrorText("DRAFT_FILE"));
				} else {
					window.open(result.item.download);
				}
			});
		},
		/**
		 * 다중파일 또는 폴더를 압축한다.
		 *
		 * @param object[] files 압축할 대상
		 */
		compress:function(files) {
			iModule.disable(true);
			
			$.send(ENV.getProcessUrl("webhard","compress"),{mode:"start",files:JSON.stringify(files)},function(result) {
				if (result.success == true) {
					Webhard.download.compressing(result.hash);
				} else {
					if (result.message) Webhard.message.show("error",result.message,5);
					iModule.enable();
				}
			});
		},
		/**
		 * 압축 진행률 출력한다.
		 *
		 * @param string hash 압축해시
		 */
		compressing:function(hash) {
			$.ajax({
				url:ENV.getProcessUrl("webhard","compress"),
				method:"POST",
				data:{mode:"compress",hash:hash},
				xhr:function() {
					var xhr = $.ajaxSettings.xhr();
					
					xhr.addEventListener("progress",function(e) {
						console.log(e);
						if (e.lengthComputable) {
							iModule.alert.progress("ModuleWebhardDownload",e.loaded,e.total);
						}
					});
	
					return xhr;
				},
				success:function() {
					setTimeout(function() {
						window.open(ENV.getProcessUrl("webhard","compress")+"?mode=download&hash="+hash);
						iModule.enable();
					},1000);
				},
				error:function() {
					Webhard.message.show("error",Webhard.getErrorText('COMPRESS_FAILED'),5);
					iModule.enable();
				}
			});
		}
	},
	/**
	 * 메세지
	 */
	message:{
		/**
		 * 메세지를 출력한다.
		 *
		 * @param string type 메세지 종류 (info, warning, error)
		 * @param string message 메세지 내용
		 * @param int timeout 메세지가 보일 시간 (0 일 경우 명시적으로 메세지를 지울때까지 유지)
		 * @param boolean animated 에니메이션 여부
		 */
		show:function(type,message,timeout,animated) {
			Webhard.$message.empty();
			var animated = animated === false ? false : true;
			var $message = $("<div>").addClass(type).attr("data-idx",Webhard.message.idx).html(message).hide();
			Webhard.$message.append($message);
			
			if (animated == true) $message.fadeIn();
			else $message.show();
			if (timeout > 0) setTimeout(Webhard.message.hide,timeout * 1000);
		},
		/**
		 * 메세지를 숨긴다.
		 *
		 * @param boolean animated 에니메이션 여부
		 */
		hide:function(animated) {
			var animated = animated === false ? false : true;
			var $message = $("div",Webhard.$message);
			$message.fadeOut();
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