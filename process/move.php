<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 항목을 이동한다.
 *
 * @file /modules/webhard/process/move.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param int $target 이동할 폴더 고유번호
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$target = Request('target');
$select = json_decode(Request('select'));

$folder = $this->getFolder($target);
if ($folder == null || $this->checkFolderDeleted($target) == true) {
	$results->success = false;
	$results->message = $this->getErrorText('NOT_FOUND');
} elseif ($this->checkFolderPermission($target,'W') == false) {
	$results->success = false;
	$results->message = $this->getErrorText('FORBIDDEN');
} else {
	$origins = array();
	$parents = explode('/',$this->getFolderPathIdx($target));
	$continueOptions = array();

	for ($i=0, $loop=count($select);$i<$loop;$i++) {
		if ($select[$i]->success == null) {
			if ($select[$i]->duplicatedOption == 'cancel') {
				$select[$i]->success = false;
				continue;
			}
			
			if ($select[$i]->type == 'folder') {
				$folder = $this->getFolder($select[$i]->idx);
				
				if ($folder == null || $this->checkFolderDeleted($select[$i]->idx) == true) {
					$results->modalHtml = $this->getMoveErrorModal($i,$select[$i]->mode,'NOT_FOUND',$select[$i]);
					break;
				}
				
				if (in_array($folder->idx,$parents) == true) {
					$results->modalHtml = $this->getMoveErrorModal($i,$select[$i]->mode,'NOT_FOUND',$select[$i]);
					break;
				}
				
				if ($select[$i]->mode == 'move' && $folder->parent == $target) {
					$results->modalHtml = $this->getMoveErrorModal($i,$select[$i]->mode,'NOT_ALLOWED_MOVE_TO_SAME_PARENT',$folder);
					break;
				}
				
				if ($select[$i]->mode == 'move') {
					if ($folder->is_lock == true) {
						$results->modalHtml = $this->getMoveErrorModal($i,$select[$i]->mode,'NOT_ALLOWED_MOVE_FOR_LOCK_ITEM',$folder);
						break;
					}
					
					if ($this->checkFolderPermission($folder->parent,'D') == false) {
						$results->modalHtml = $this->getMoveErrorModal($i,$select[$i]->mode,'NOT_ALLOWED_DELETE_IN_TARGET',$folder);
						break;
					}
				}
				
				$origins[] = $folder->parent;
				$duplicated = $this->db()->select($this->table->folder)->where('parent',$target)->where('name',$folder->name)->where('is_delete','FALSE')->getOne();
				
				if ($duplicated == null) {
					if ($select[$i]->mode == 'move') {
						$this->db()->update($this->table->folder,array('parent'=>$target,'editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time()))->where('idx',$folder->idx)->execute();
						$select[$i]->success = true;
					} else {
						$select[$i]->success = $this->copyFolder($folder,$target);
					}
				} else {
					$is_merge = $this->checkFolderPermission($target,'D') == true && $this->checkFolderPermission($duplicated->idx,'R');
					$is_replace = $this->checkFolderPermission($target,'D');
					
					if ($is_merge == false && $select[$i]->duplicatedOption == 'merge') $select[$i]->duplicatedOption = null;
					if ($is_replace == false && $select[$i]->duplicatedOption == 'replace') $select[$i]->duplicatedOption = null;
					
					if ($select[$i]->duplicatedOption != null && $select[$i]->duplicatedContinue == true && in_array($select[$i]->duplicatedOption,$continueOptions) == false) {
						$continueOptions[] = $select[$i]->duplicatedOption;
					}
					
					if ($select[$i]->duplicatedOption == 'merge' || ($select[$i]->duplicatedOption == null && in_array('merge',$continueOptions) == true)) {
						$select[$i]->duplicatedOption = 'merge';
					}
					
					if ($is_replace == true && ($select[$i]->duplicatedOption == 'replace' || ($select[$i]->duplicatedOption == null && in_array('replace',$continueOptions) == true))) {
						$select[$i]->duplicatedOption = 'replace';
					}
					
					if ($select[$i]->duplicatedOption == 'cancel' || ($select[$i]->duplicatedOption == null && in_array('cancel',$continueOptions) == true)) {
						$select[$i]->duplicatedOption = 'cancel';
					}
					
					if ($select[$i]->duplicatedOption == 'rename') {
						if ($select[$i]->mode == 'move') {
							$newname = $this->getEscapeDuplicatedFolderName($target,$folder->name);
							$this->db()->update($this->table->folder,array('parent'=>$target,'name'=>$newname,'editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time()))->where('idx',$folder->idx)->execute();
							$select[$i]->success = true;
						} else {
							$folder->name = $this->getEscapeDuplicatedFolderName($target,$folder->name);
							$select[$i]->success = $this->copyFolder($folder,$target);
						}
					}
					
					if ($select[$i]->duplicatedOption == 'replace') {
						if ($this->removeChildren($duplicated->idx) == true) {
							if ($select[$i]->mode == 'move') {
								$this->db()->update($this->table->folder,array('parent'=>$target))->where('idx',$folder->idx)->execute();
								$select[$i]->success = true;
							} else {
								$select[$i]->success = $this->copyFolder($folder,$target);
							}
						} else {
							$select[$i]->duplicatedOption = null;
						}
					}
					
					if ($select[$i]->duplicatedOption == 'merge') {
						if ($this->mergeFolder($duplicated->idx,$folder->idx,$select[$i]->mode == 'copy') == true) {
							$select[$i]->success = true;
						}
					}
					
					if ($select[$i]->duplicatedOption == 'cancel') {
						$select[$i]->success = false;
					}
					
					if ($select[$i]->duplicatedOption == null) {
						$results->modalHtml = $this->getFolderDuplicatedOptionModal($i,$folder,$duplicated);
						break;
					}
				}
			} else {
				$file = $this->getFile($select[$i]->idx);
				
				/*
				if ($file == null) {
					$select[$i]->success = false;
					$select[$i]->message = $this->getErrorText('NOT_FOUND');
					continue;
				}
				
				if ($mode == 'move' && $file->folder == $target) {
					$select[$i]->success = false;
					continue;
				}
				
				if ($this->checkFilePermission($file->idx,'D') == false || $file->is_lock == 'TRUE') {
					$select[$i]->success = false;
					$select[$i]->message = $this->getErrorText('FORBIDDEN');
					continue;
				}
				
				$results->origin = $file->folder;
				
				if ($target == 0) {
					$duplicated = $this->db()->select($this->table->file)->where('folder',0)->where('owner',$this->IM->getModule('member')->getLogged())->where('name',$file->name)->where('is_delete','FALSE')->getOne();
				} else {
					$duplicated = $this->db()->select($this->table->file)->where('folder',$target)->where('name',$file->name)->where('is_delete','FALSE')->getOne();
				}
				
				if ($duplicated == null || $file->folder == $target) {
					if ($mode == 'move') {
						$this->db()->update($this->table->file,array('folder'=>$target,'editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time()))->where('idx',$file->idx)->execute();
						$select[$i]->success = true;
					} else {
						if ($duplicated != null) $file->name = $this->getEscapeDuplicatedFileName($target,$file->name);
						$select[$i]->success = $this->copyFile($file,$target);
					}
				} else {
					$is_replace = $this->checkFolderPermission($target,'D');
					if ($is_replace == false && $select[$i]->duplicatedOption == 'replace') $select[$i]->duplicatedOption = null;
					
					if ($select[$i]->duplicatedOption != null && $select[$i]->duplicatedContinue == true && in_array($select[$i]->duplicatedOption,$continueOptions) == false) {
						$continueOptions[] = $select[$i]->duplicatedOption;
					}
					
					if ($is_replace == true && ($select[$i]->duplicatedOption == 'replace' || ($select[$i]->duplicatedOption == null && in_array('replace',$continueOptions) == true))) {
						$select[$i]->duplicatedOption = 'replace';
					}
					
					if ($select[$i]->duplicatedOption == 'cancel' || ($select[$i]->duplicatedOption == null && in_array('cancel',$continueOptions) == true)) {
						$select[$i]->duplicatedOption = 'cancel';
					}
					
					if ($select[$i]->duplicatedOption == 'rename' || ($select[$i]->duplicatedOption == null && in_array('rename',$continueOptions) == true)) {
						$select[$i]->duplicatedOption = 'rename';
					}
					
					if ($select[$i]->duplicatedOption == 'rename') {
						if ($mode == 'copy') {
							$newname = $this->getEscapeDuplicatedFileName($target,$file->name);
							$this->db()->update($this->table->file,array('folder'=>$target,'name'=>$newname,'editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time()))->where('idx',$file->idx)->execute();
							$select[$i]->success = true;
						} else {
							$file->name = $this->getEscapeDuplicatedFileName($target,$file->name);
							$select[$i]->success = $this->copyFile($file,$target);
						}
					}
					
					if ($select[$i]->duplicatedOption == 'replace') {
						@unlink($this->getFilePath($duplicated->path));
						@unlink($this->getFilePath($duplicated->path.'.view'));
						@unlink($this->getFilePath($duplicated->path.'.thumb'));
						
						$this->db()->delete($this->table->file)->where('idx',$duplicated->idx)->execute();
						
						if ($mode == 'copy') {
							$this->db()->update($this->table->file,array('folder'=>$target,'editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time()))->where('idx',$file->idx)->execute();
							$select[$i]->success = true;
						} else {
							$select[$i]->success = $this->copyFile($file,$target);
						}
					}
					
					if ($select[$i]->duplicatedOption == 'cancel') {
						$select[$i]->success = false;
					}
					
					if ($select[$i]->duplicatedOption == null) {
						$results->modalHtml = $this->getFileDuplicatedOptionModal($i,$file,$duplicated,$templet);
						break;
					}
				}
				*/
			}
		}
	}
	/*
	$this->updateFolder($target);
	if ($mode == 'move' && $results->origin) $this->updateFolder($results->origin);
	*/
	
	$origins[] = $target;
	
	$results->success = true;
	$results->select = $select;
	$results->updated = array_unique($origins);
	$results->target = $this->getFolderPathIdx($target);
}
?>