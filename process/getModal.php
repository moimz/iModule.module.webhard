<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 모달창 컨텍스트를 가져온다.
 *
 * @file /modules/webhard/process/getModal.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param string $modal 모달종류
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$modal = Request('modal');

/**
 * 새폴더 생성 모달
 */
if ($modal == 'create') {
	$parent = Request('parent');
	$folder = $this->getFolder($parent);
	
	if ($folder == null || $this->checkFolderDeleted($folder->idx) == true) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_FOUND_FOLDER');
	} elseif ($this->checkFolderPermission($parent,'W') == false) {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN').$this->checkFolderPermission($parent);
	} else {
		$results->success = true;
		$results->modalHtml = $this->getCreateModal($parent);
	}
}

/**
 * 이름변경
 */
if ($modal == 'rename') {
	$type = Request('type');
	$idx = Request('idx');
	
	if ($type == 'folder') {
		$folder = $this->getFolder($idx);
		if ($folder == null || $this->checkFolderDeleted($folder->idx) == true) {
			$results->success = false;
			$results->message = $this->getErrorText('NOT_FOUND_FOLDER');
		} elseif ($folder->is_lock == true) {
			$results->success = false;
			$results->message = $this->getErrorText('NOT_ALLOWED_EDIT_FOR_LOCK_ITEM');
		} elseif ($this->checkFolderPermission($folder->parent,'W') == false || $this->checkFolderPermission($folder->idx,'W') == false) {
			$results->success = false;
			$results->message = $this->getErrorText('FORBIDDEN');
		} else {
			$results->success = true;
			$results->modalHtml = $this->getRenameModal($folder);
		}
	} else {
		$file = $this->getFile($idx);
		if ($file == null || $this->checkFileDeleted($file->idx) == true) {
			$results->success = false;
			$results->message = $this->getErrorText('NOT_FOUND_FILE');
		} elseif ($file->is_lock == true) {
			$results->success = false;
			$results->message = $this->getErrorText('NOT_ALLOWED_EDIT_FOR_LOCK_ITEM');
		} elseif ($this->checkFolderPermission($file->folder,'W') == false || $this->checkFilePermission($file->idx,'W') == false) {
			$results->success = false;
			$results->message = $this->getErrorText('FORBIDDEN');
		} else {
			$results->success = true;
			$results->modalHtml = $this->getRenameModal($file);
		}
	}
}

/**
 * 업로드 취소 모달
 */
if ($modal == 'cancel') {
	$type = Request('type');
	$idx = Request('idx');
	
	$results->success = true;
	$results->modalHtml = $this->getCancelModal($type,$idx);
}
?>