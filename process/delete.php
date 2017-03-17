<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 항목을 삭제한다.
 *
 * @file /modules/webhard/process/delete.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param int $select 삭제할 대상
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$parents = array();

$select = json_decode(Request('select'));
for ($i=0, $loop=count($select);$i<$loop;$i++) {
	if ($select[$i]->success == null) {
		if ($select[$i]->deleteOption == 'cancel') {
			$select[$i]->success = false;
			continue;
		}
		
		if ($select[$i]->type == 'folder') {
			$folder = $this->getFolder($select[$i]->idx);
			if ($folder == null || $this->checkFolderDeleted($select[$i]->idx) == true) {
				$results->modalHtml = $this->getDeleteErrorModal($i,'NOT_FOUND',$select[$i]);
				break;
			}
			
			if ($folder->is_lock == true) {
				$results->modalHtml = $this->getDeleteErrorModal($i,'NOT_ALLOWED_DELETE_FOR_LOCK_ITEM',$folder);
				break;
			}
			
			if ($this->checkFolderPermission($folder->parent,'D') == false) {
				$results->modalHtml = $this->getDeleteErrorModal($i,'NOT_ALLOWED_DELETE_IN_TARGET',$folder);
				break;
			}
			
			if ($select[$i]->deleteOption == null) {
				if ($folder->is_shared == true) {
					$results->modalHtml = $this->getDeleteErrorModal($i,'SHARED_ITEM',$folder);
					break;
				}
				
				if ($this->checkFolderShared($folder->idx) == true) {
					$results->modalHtml = $this->getDeleteErrorModal($i,'SHARED_FOLDER',$folder);
					break;
				}
				
				if ($folder->is_linked == true) {
					$results->modalHtml = $this->getDeleteErrorModal($i,'LINKED_ITEM',$folder);
					break;
				}
			}
			
			$this->deleteFolder($folder->idx);
			
			$select[$i]->success = true;
			
			if ($this->db()->select($this->table->folder)->where('idx',$folder->idx)->has() == true) {
				$this->db()->update($this->table->folder,array('is_delete'=>'TRUE','editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time(),'opath'=>$this->getFolderPath($folder->idx)))->where('idx',$folder->idx)->execute();
				
				if (isset($parents[$folder->parent]) == false) {
					$parents[$folder->parent] = array();
				}
				
				$parents[$folder->parent][] = $select[$i];
			}
		} else {
			$file = $this->getFile($select[$i]->idx);
			if ($file == null || $this->checkFileDeleted($select[$i]->idx) == true) {
				$results->modalHtml = $this->getDeleteErrorModal($i,'NOT_FOUND',$select[$i]);
				break;
			}
			
			if ($file->is_lock == true) {
				$results->modalHtml = $this->getDeleteErrorModal($i,'NOT_ALLOWED_DELETE_FOR_LOCK_ITEM',$file);
				break;
			}
			
			if ($this->checkFilePermission($file->idx,'D') == false) {
				$results->modalHtml = $this->getDeleteErrorModal($i,'NOT_ALLOWED_DELETE_IN_TARGET',$file);
				break;
			}
			
			if ($select[$i]->deleteOption == null) {
				if ($file->is_shared == true) {
					$results->modalHtml = $this->getDeleteErrorModal($i,'SHARED_ITEM',$file);
					break;
				}
			}
			
			/**
			 * 즐겨찾기에서 제거
			 */
			$this->db()->delete($this->table->favorite)->where('type','FILE')->where('fidx',$file->idx)->execute();
			
			/**
			 * 공유중인 사항 제거
			 */
			if ($file->is_shared == true) {
				$this->unshareFile($file->idx);
			}
			
			$this->db()->update($this->table->file,array('is_delete'=>'TRUE','editor'=>$this->IM->getModule('member')->getLogged(),'update_date'=>time(),'opath'=>$this->getFolderPath($file->folder).'/'.$file->name))->where('idx',$file->idx)->execute();
			
			$select[$i]->success = true;
			if (isset($parents[$file->folder]) == false) {
				$parents[$file->folder] = array();
			}
			$parents[$file->folder][] = $select[$i];
		}
	}
}

if (isset($results->modalHtml) == false) {
	foreach ($parents as $parent=>$datas) {
		$this->updateFolder($parent);
		$this->updateFolderLinked($parent);
		$this->updateFolderShared($parent);
		
		$this->addActivity('DELETE',$parent,$datas);
	}
}

$results->success = true;
$results->select = $select;
?>