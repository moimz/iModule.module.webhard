<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 * 
 * 대상의 이름을 변경한다.
 *
 * @file /modules/webhard/process/rename.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

$type = Request('type');
$idx = Request('idx');
$name = Request('name');

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
		$errors = array();
		if ($this->checkFolderName($name) !== true) $errors['name'] = $this->checkFolderName($name);
		
		if ($this->db()->select($this->table->folder)->where('name',$name)->where('idx',$idx,'!=')->where('parent',$folder->idx)->where('is_delete','FALSE')->has() == true) {
			$errors['name'] = $this->getErrorText('DUPLICATED_FOLDER_NAME');
		}
		
		if (count($errors) == 0) {
			$this->db()->update($this->table->folder,array('name'=>$name))->where('idx',$idx)->execute();
			$results->success = true;
			$results->meta = $this->getFolderMeta($idx);
		} else {
			$results->success = false;
			$results->errors = $errors;
		}
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
		$errors = array();
		if ($this->checkFileName($name) !== true) $errors['name'] = $this->checkFileName($name);
		
		$temp = explode('.',$file->name);
		if (count($temp) > 1 && $temp[0] != '') {
			$name = $name.'.';
			$name.= array_pop($temp);
		} else {
			$name = $name;
		}
		
		if ($this->db()->select($this->table->file)->where('name',$name)->where('idx',$idx,'!=')->where('folder',$file->folder)->where('is_delete','FALSE')->has() == true) {
			$errors['name'] = $this->getErrorText('DUPLICATED_FILE_NAME');
		}
		
		if (count($errors) == 0) {
			$this->db()->update($this->table->file,array('name'=>$name))->where('idx',$idx)->execute();
			$results->success = true;
			$results->meta = $this->getFileMeta($idx);
		} else {
			$results->success = false;
			$results->errors = $errors;
		}
	}
}

$results->type = $type;
$results->idx = $idx;
$results->name = $name;
?>