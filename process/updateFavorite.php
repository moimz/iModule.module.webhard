<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 * 
 * 즐겨찾기 상태를 업데이트한다.
 *
 * @file /modules/webhard/process/updateFavorite.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

$type = Request('type');
$idx = Request('idx');
$favorite = Request('favorite') == 'true';

if ($type == 'folder') {
	$folder = $this->getFolder($idx);
	
	if ($folder == null) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_FOUND');
	} elseif ($this->checkFolderDeleted($idx) == true) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_ALLOWED_FOR_DELETED_ITEM');
	} elseif ($this->checkFolderPermission($idx,'R') == false) {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN');
	} else {
		$results->success = true;
		if ($favorite == true) {
			if ($this->db()->select($this->table->favorite)->where('type','FOLDER')->where('fidx',$idx)->where('midx',$this->IM->getModule('member')->getLogged())->has() == false) {
				$this->db()->insert($this->table->favorite,array('type'=>'FOLDER','fidx'=>$idx,'midx'=>$this->IM->getModule('member')->getLogged()))->execute();
			}
		} else {
			$this->db()->delete($this->table->favorite)->where('type','FOLDER')->where('fidx',$idx)->where('midx',$this->IM->getModule('member')->getLogged())->execute();
		}
	}
} elseif ($type == 'file') {
	$file = $this->getFile($idx);
	if ($file == null) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_FOUND');
	} elseif ($this->checkFileDeleted($idx) == true) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_ALLOWED_FOR_DELETED_ITEM');
	} elseif ($this->checkFilePermission($file->idx) == false) {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN');
	} else {
		$results->success = true;
		if ($favorite == true) {
			if ($this->db()->select($this->table->favorite)->where('type','FILE')->where('fidx',$idx)->where('midx',$this->IM->getModule('member')->getLogged())->has() == false) {
				$this->db()->insert($this->table->favorite,array('type'=>'FILE','fidx'=>$idx,'midx'=>$this->IM->getModule('member')->getLogged()))->execute();
			}
		} else {
			$this->db()->delete($this->table->favorite)->where('type','FILE')->where('fidx',$idx)->where('midx',$this->IM->getModule('member')->getLogged())->execute();
		}
	}
}

$results->type = $type;
$results->idx = $idx;
$results->favorite = $favorite;
?>