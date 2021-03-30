<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 *
 * 웹하드 기본템플릿 - 파일탐색
 * 
 * @file /modules/webhard/templets/default/explorer.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

$IM->loadWebFont('NanumBarunGothic',true);
$IM->loadWebFont('FontAwesome');
$IM->loadWebFont('XEIcon');
?>
<div data-role="message"></div>

<div data-role="upload">
	<h4>
		업로드 목록
		<button type="button" data-action="close"><i class="mi mi-close"></i></button>
		<button type="button" data-action="toggle"><i class="mi mi-angle-down"></i></button>
	</h4>
	
	<ul></ul>
</div>

<div data-role="loading">
	<div><i class="mi mi-loading"></i></div>
</div>

<div data-role="disable"></div>

<button type="button" data-action="add"><i></i></button>

<section data-role="nbreadcrumb">
	<div>
		<a href="<?php echo $IM->getIndexUrl(); ?>"><i class="xi xi-home"></i></a><i class="fa fa-angle-right"></i>
		<span data-role="root"></span>
		<span class="ellipsis"><i class="fa fa-angle-right"></i><i class="xi xi-ellipsis-h"></i></span>
		<span data-role="path"></span>
	</div>
</section>

<section data-role="container">
	<nav data-role="sidebar">
		<div data-role="panel">
			<div data-role="slide_title">
				<h4 data-role="title"></h4>
				<button type="button" data-action="tree"><i class="mi mi-close"></i></button>
			</div>
			
			<div data-role="folder_title">
				<button type="button" data-action="toggle-tree">폴더<i class="fa fa-angle-down"></i></button>
			</div>
			
			<ul class="menu">
				<li class="tree">
					<ul data-role="tree">
						<li>
							<div>
								<i></i>
								<span><?php echo $me->getRootFolder()->name; ?></span>
							</div>
						</li>
					</ul>
				</li>
				<li>
					<button type="button" data-tag="root"><i></i> <?php echo $me->getRootFolder()->name; ?></button>
				</li>
				<li class="type">
					<ul>
						<li><button type="button" data-tag="image"><i class="fa fa-file-image-o"></i>이미지</button></li>
						<li><button type="button" data-tag="video"><i class="fa fa-file-video-o"></i>동영상</button></li>
						<li><button type="button" data-tag="document"><i class="fa fa-file-text-o"></i>문서</button></li>
					</ul>
				</li>
				<li class="tags">
					<button type="button" data-tag="recently"><i class="fa fa-history"></i>최근 업데이트된 파일 보기</button>
					<button type="button" data-tag="favorite"><i class="fa fa-star"></i>중요 표시한 파일/폴더 보기</button>
					<button type="button" data-tag="trash"><i class="fa fa-trash-o"></i>휴지통</button>
				</li>
				<li class="size">
					<div>
						<div class="title">현재 디스크 사용량</div>
						
						<div data-role="disk">
							<div data-role="progress"><div></div></div>
							<div data-role="usage">0B</div>
							<div data-role="limit">0B</div>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</nav>
	
	<section data-role="explorer">
		<div data-role="panel">
			<div data-role="toolbar">
				<button type="button" data-action="tree"></button>
				<h4 data-role="title"></h4>
				<div data-role="menu">
					<button type="button" data-action="upload">
						<i class="xi xi-upload"></i>
						<span><?php echo $me->getText('toolbar/upload'); ?></span>
					</button>
					<button type="button" data-action="download">
						<i class="xi xi-download"></i>
						<span><?php echo $me->getText('toolbar/download'); ?></span>
					</button>
					
					<span class="split"></span>
					
					<button type="button" type="button" data-action="create">
						<i class="xi xi-folder-plus"></i>
						<span><?php echo $me->getText('toolbar/create'); ?></span>
					</button>
					<button type="button" data-action="delete">
						<i class="fa fa-trash-o"></i>
						<span><?php echo $me->getText('toolbar/delete'); ?></span>
					</button>
					<button type="button" data-action="restore">
						<span><?php echo $me->getText('toolbar/restore'); ?></span>
					</button>
					<button type="button" data-action="remove">
						<span><?php echo $me->getText('toolbar/remove'); ?></span>
					</button>
					
					<span class="split"></span>
					
					<button type="button" data-action="empty">
						<span><?php echo $me->getText('toolbar/empty'); ?></span>
					</button>
					
					<span class="split"></span>
					
					<button type="button" data-action="select_on">
						<span><?php echo $me->getText('toolbar/select_on'); ?></span>
					</button>
					
					<button type="button" data-action="select_all">
						<span><?php echo $me->getText('toolbar/select_all'); ?></span>
					</button>
					
					<button type="button" data-action="select_off">
						<span><?php echo $me->getText('toolbar/select_off'); ?></span>
					</button>
					
					<span class="split"></span>
					
					<button type="button" data-action="detail">
						<i class="xi xi-info-circle"></i>
						<span><?php echo $me->getText('toolbar/detail'); ?></span>
					</button>
				</div>
				
				<div data-role="mode">
					<button type="button" data-mode="card"><i class="mi mi-view-card"></i></button>
					<button type="button" data-mode="grid"><i class="mi mi-view-grid"></i></button>
				</div>
				
				<button type="button" data-action="menu"><i class="mi mi-ellipsis-v"></i></button>
			</div>
			
			<div data-role="headerbar" class="headerbar">
				<button type="button" data-action="select"></button>
				<button type="button" data-action="favorite"></button>
				
				<ul>
					<li class="name"><button type="button" data-sort="name"><?php echo $me->getText('sort/name'); ?><i class="fa"></i></button></li>
					<li class="size"><button type="button" data-sort="size"><?php echo $me->getText('sort/size'); ?><i class="fa"></i></button></li>
					<li class="date"><button type="button" data-sort="date"><?php echo $me->getText('sort/date'); ?><i class="fa"></i></button></li>
				</ul>
				
				<button type="button" data-action="sort"></button>
			</div>
				
			<div data-role="files"></div>
		</div>
	</section>
	
	<aside data-role="detail">
		<div data-role="panel">
			<div class="title"><button data-action="close" type="button"><i class="xi xi-close"></i></button><span data-value="name"></span></div>
			
			<ul data-role="tab">
				<li class="selected"><button type="button" data-tab="information">속성</button></li>
				<li><button type="button" data-tab="activity">최근활동</button></li>
			</ul>
			
			<div data-tab="information">
				<ul data-role="data">
					<li><b>종류</b><span data-value="type">내용</span></li>
					<li><b>위치</b><span data-value="path">내용</span></li>
					<li><b>크기</b><span data-value="size">내용</span></li>
					
					
					<li><b>위치</b><span data-value="path">내용</span></li>
					<li><b>크기</b><span data-value="size">내용</span></li>
					<li><b>위치</b><span data-value="path">내용</span></li>
					<li><b>크기</b><span data-value="size">내용</span></li>
					<li><b>위치</b><span data-value="path">내용</span></li>
					<li><b>크기</b><span data-value="size">내용</span></li>
					<li><b>위치</b><span data-value="path">내용</span></li>
					<li><b>크기</b><span data-value="size">내용</span></li>
					<li><b>위치</b><span data-value="path">내용</span></li>
					<li><b>크기</b><span data-value="size">내용</span></li>
					<li class="bar"></li>
					<li><b>만든날짜</b><span data-value="reg_date">내용</span></li>
					<li><b>수정한날짜</b><span data-value="update_date">내용</span></li>
					<li><b>최종수정자</b><span data-value="editor">내용</span></li>
					<li class="bar"></li>
				</ul>
				
				<ul data-role="button">
					<li data-role="download"><button type="button" data-action="download">다운로드</button></li>
					<li data-role="preview"><button type="button" data-action="preview">미리보기</button></li>
				</ul>
			</div>
			
			<div data-tab="activity">
				
			</div>
		</div>
	</aside>
</section>