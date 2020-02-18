<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 * 
 * 폴더하부의 아이템(폴더, 파일)을 가져온다.
 *
 * @file /modules/webhard/process/getItems.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

$view = Request('view');

if ($view == 'folder') {
	$idx = Request('idx');
	$folder = $this->getFolder($idx);
	if ($folder == null || $this->checkFolderDeleted($idx) == true) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_FOUND_FOLDER');
	} else {
		$items = array();
		$permission = $this->checkFolderPermission($idx,'R');
		
		$folders = $this->db()->select($this->table->folder)->where('parent',$idx)->where('is_delete','FALSE');
		if ($permission == false) $folders->where('creator',$this->IM->getModule('member')->getLogged());
		$folders = $folders->get();
		
		for ($i=0, $loop=count($folders);$i<$loop;$i++) {
			$items[] = $this->getFolderMeta($folders[$i]);
		}
		
		$files = $this->db()->select($this->table->file)->where('folder',$idx)->where('is_delete','FALSE');
		if ($permission == false) $files->where('creator',$this->IM->getModule('member')->getLogged());
		$files = $files->get();
		
		for ($i=0, $loop=count($files);$i<$loop;$i++) {
			$items[] = $this->getFileMeta($files[$i]);
		}
		
		for ($i=0, $loop=count($items);$i<$loop;$i++) {
			$items[$i]->is_favorite = $this->db()->select($this->table->favorite)->where('type',$items[$i]->type)->where('fidx',$items[$i]->idx)->where('midx',$this->IM->getModule('member')->getLogged())->has();
		}
		
		$results->success = true;
		$results->idx = $idx;
		$results->view = $view;
		$results->permission = $this->getFolderPermission($idx);
		$results->path = $this->getFolderPath($idx);
		$results->pathIdx = $this->getFolderPathIdx($idx);
		$results->items = $items;
	}
}
?>