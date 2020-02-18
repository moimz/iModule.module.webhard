<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 * 
 * 새폴더를 생성한다.
 *
 * @file /modules/webhard/process/create.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 */
if (defined('__IM__') == false) exit;

$parent = Request('parent');
$name = Request('name');

$folder = $this->db()->select($this->table->folder)->where('idx',$parent)->getOne();

if ($this->IM->getModule('member')->isLogged() == false) {
	$results->success = false;
	$results->message = $this->getErrorText('REQUIRED_LOGIN');
} elseif ($folder == null || $this->checkFolderDeleted($folder->idx)) {
	$results->success = false;
	$results->message = $this->getErrorText('NOT_FOUND_FOLDER');
} elseif ($this->checkFolderPermission($folder->idx,'W') == false) {
	$results->success = false;
	$results->message = $this->getErrorText('FORBIDDEN');
} else {
	$errors = array();
	if ($this->checkFolderName($name) !== true) $errors['name'] = $this->checkFolderName($name);

	if ($this->db()->select($this->table->folder)->where('parent',$parent)->where('is_delete','FALSE')->where('name',$name)->has() == true) {
		$errors['name'] = $this->getErrorText('DUPLICATED_FOLDER_NAME');
	}
	
	if (count($errors) == 0) {
		$insert = array();
		$insert['owner'] = $folder->owner;
		$insert['creator'] = $insert['editor'] = $this->IM->getModule('member')->getLogged();
		$insert['parent'] = $parent;
		$insert['name'] = $name;
		$insert['permission'] = 'RWD';
		$insert['reg_date'] = time();
		$insert['update_date'] = time();
		
		if ($folder->linked != 0) $insert['parent'] = $folder->linked;
		
		$this->db()->insert($this->table->folder,$insert)->execute();
		
		$results->success = true;
		$results->parent = $parent;
		
		$this->addActivity('CREATE_FOLDER',$parent,(object)$insert);
		$this->updateFolder($parent);
	} else {
		$results->success = false;
		$results->errors = $errors;
	}
}
?>