<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 폴더하부의 폴더를 가져온다.
 *
 * @file /modules/webhard/process/getTree.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param string $idx 부모폴더 고유번호
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$idx = Request('idx');
$folder = $this->getFolder($idx);
$path = $this->getFolderPath($idx);

if ($this->checkFolderDeleted($idx) == true) {
	$results->success = false;
	$results->message = $this->getErrorText('NOT_FOUND_FOLDER');
	$results->path = $path;
} else {
	$tree = $this->db()->select($this->table->folder)->where('parent',$idx);
	if ($this->checkFolderPermission($idx,'R') == false) $tree->where('creator',$this->IM->getModule('member')->getLogged());
	$tree = $tree->orderBy('name','asc')->get();

	for ($i=0, $loop=count($tree);$i<$loop;$i++) {
		$tree[$i]->path = $this->getFolderPath($tree[$i]->idx);
//		$tree[$i]->pathIdx = $pathIdx.$tree[$i]->idx;
		$tree[$i]->permission = $this->getFolderPermission($tree[$i]->idx);
		
		if ($this->checkFolderPermission($tree[$i]->idx,'R') == true) {
			$tree[$i]->has_children = $this->db()->select($this->table->folder)->where('parent',$tree[$i]->linked == 0 ? $tree[$i]->idx : $tree[$i]->linked)->where('is_delete','FALSE')->has();
		} else {
			$tree[$i]->has_children = $this->db()->select($this->table->folder)->where('parent',$tree[$i]->linked == 0 ? $tree[$i]->idx : $tree[$i]->linked)->where('creator',$this->IM->getModule('member')->getLogged())->where('is_delete','FALSE')->has();
		}
		
		$tree[$i]->is_lock = $tree[$i]->is_lock == 'TRUE';
		$tree[$i]->is_writable = $this->checkFolderPermission($tree[$i]->idx,'W');
		$tree[$i]->is_deletable = $this->checkFolderPermission($tree[$i]->idx,'D');
		$tree[$i]->is_shared = $this->checkFolderShared($tree[$i]->idx);
	}
	
	$results->success = true;
	$results->parent = $idx;
	$results->tree = $tree;
}
?>