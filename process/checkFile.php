<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 업로드할 파일을 확인하고 DB에 정보를 저장한다.
 *
 * @file /modules/webhard/process/checkFile.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param int $target 파일을 업로드할 폴더 고유번호
 * @param object[] $files 업로드할 파일
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$target = Request('target');
$files = json_decode(Request('files'));

$folder = $this->getFolder($target);
if ($folder == null || $this->checkFolderDeleted($target) == true) {
	$results->success = false;
	$results->message = $this->getErrorText('NOT_FOUND');
} elseif ($this->checkFolderPermission($target,'W') == false) {
	$results->success = false;
	$results->message = $this->getErrorText('FORBIDDEN');
} else {
	$profile = $this->getProfile();
	$mAttachment = $this->IM->getModule('attachment');
	$mNormalizer = new UnicodeNormalizer();
	
	$size = 0;
	for ($i=0, $loop=count($files);$i<$loop;$i++) {
		$size+= $files[$i]->size;
	}
	
	if ($size + $profile->disk_usage > $profile->disk_limit * 1000 * 1000) {
		$results->success = false;
		$results->message = $this->getErrorText('NOT_ENOUGH_DISK_SIZE').' ('.GetFileSize($size + $profile->disk_usage).'/'.GetFileSize($profile->disk_limit * 1000 * 1000).')';
	} else {
		if ($folder->linked == 0) {
			$owner = $folder->owner;
			$uploadFolderIdx = $folder->idx;
		} else {
			$linked = $this->getFolder($folder->linked);
			$owner = $folder->linked;
			$uploadFolderIdx = $folder->linked;
		}
		
		$results->success = true;
		$continueOptions = array();
		
		for ($i=0, $loop=count($files);$i<$loop;$i++) {
			if ($files[$i]->success == null) {
				$files[$i]->name = $mNormalizer->normalize($files[$i]->name);
				
				$duplicated = $this->db()->select($this->table->file)->where('folder',$uploadFolderIdx)->where('name',$files[$i]->name)->where('is_delete','FALSE')->getOne();
				if ($duplicated == null) {
					$path = $this->getTempPath().'/'.md5(json_encode($files[$i])).'.'.base_convert(microtime(true)*10000,10,32).'.temp';
					$idx = $this->db()->insert($this->table->file,array('folder'=>$uploadFolderIdx,'owner'=>$owner,'creator'=>$this->IM->getModule('member')->getLogged(),'editor'=>$this->IM->getModule('member')->getLogged(),'path'=>$path,'name'=>$files[$i]->name,'type'=>$mAttachment->getFileType($files[$i]->type),'mime'=>$files[$i]->type,'size'=>$files[$i]->size,'reg_date'=>time(),'update_date'=>time()))->execute();
					$files[$i]->idx = $idx;
					$files[$i]->code = urlencode(Encoder(json_encode(array('idx'=>$idx,'name'=>$files[$i]->name,'size'=>$files[$i]->size,'is_share'=>$files[$i]->is_share),JSON_UNESCAPED_UNICODE)));
					$files[$i]->chunkStart = 0;
					$files[$i]->success = true;
				} else {
					$is_continue = $duplicated->status == 'DRAFT' && $duplicated->creator == $this->IM->getModule('member')->getLogged() && $files[$i]->size == $duplicated->size;
					$is_replace = $this->checkFolderPermission($uploadFolderIdx,'D');
					
					if ($is_continue == false && $files[$i]->duplicatedOption == 'continue') $files[$i]->duplicatedOption = null;
					if ($is_replace == false && $files[$i]->duplicatedOption == 'replace') $files[$i]->duplicatedOption = null;
					
					if ($files[$i]->duplicatedOption != null && $files[$i]->duplicatedContinue == true && in_array($files[$i]->duplicatedOption,$continueOptions) == false) {
						$continueOptions[] = $files[$i]->duplicatedOption;
					}
					
					if ($is_continue == true && ($files[$i]->duplicatedOption == 'continue' || ($files[$i]->duplicatedOption == null && in_array('continue',$continueOptions) == true))) {
						$files[$i]->duplicatedOption = 'continue';
					}
					
					if ($is_replace == true && ($files[$i]->duplicatedOption == 'replace' || ($files[$i]->duplicatedOption == null && in_array('replace',$continueOptions) == true))) {
						$files[$i]->duplicatedOption = 'replace';
					}
					
					if ($files[$i]->duplicatedOption == 'cancel' || ($files[$i]->duplicatedOption == null && in_array('cancel',$continueOptions) == true)) {
						$files[$i]->duplicatedOption = 'cancel';
					}
					
					if ($files[$i]->duplicatedOption == 'rename' || ($files[$i]->duplicatedOption == null && in_array('rename',$continueOptions) == true)) {
						$files[$i]->duplicatedOption = 'rename';
					}
					
					if ($files[$i]->duplicatedOption == 'continue') {
						$files[$i]->idx = $duplicated->idx;
						$files[$i]->code = urlencode(Encoder(json_encode(array('idx'=>$duplicated->idx,'name'=>$files[$i]->name,'size'=>$files[$i]->size,'is_share'=>$files[$i]->is_share),JSON_UNESCAPED_UNICODE)));
						$files[$i]->chunkStart = is_file($this->getFilePath($duplicated->path)) == true ? filesize($this->getFilePath($duplicated->path)) : 0;
						$files[$i]->success = true;
					}
					
					if ($files[$i]->duplicatedOption == 'rename') {
						$files[$i]->name = $this->getEscapeDuplicatedFileName($uploadFolderIdx,$files[$i]->name);
						$path = $this->getTempPath().'/'.md5(json_encode($files[$i])).'.'.base_convert(microtime(true)*10000,10,32).'.temp';
						$idx = $this->db()->insert($this->table->file,array('folder'=>$uploadFolderIdx,'owner'=>$owner,'creator'=>$this->IM->getModule('member')->getLogged(),'editor'=>$this->IM->getModule('member')->getLogged(),'path'=>$path,'name'=>$files[$i]->name,'type'=>$mAttachment->getFileType($files[$i]->type),'mime'=>$files[$i]->type,'size'=>$files[$i]->size,'reg_date'=>time(),'update_date'=>time()))->execute();
						$files[$i]->idx = $idx;
						$files[$i]->code = urlencode(Encoder(json_encode(array('idx'=>$idx,'name'=>$files[$i]->name,'size'=>$files[$i]->size,'is_share'=>$files[$i]->is_share),JSON_UNESCAPED_UNICODE)));
						$files[$i]->chunkStart = 0;
						$files[$i]->success = true;
					}
					
					if ($files[$i]->duplicatedOption == 'replace') {
						@unlink($this->getFilePath($duplicated->path));
						@unlink($this->getFilePath($duplicated->path.'.view'));
						@unlink($this->getFilePath($duplicated->path.'.thumb'));
						
						$path = $this->getTempPath().'/'.md5(json_encode($files[$i])).'.'.base_convert(microtime(true)*10000,10,32).'.temp';
						$this->db()->update($this->table->file,array('editor'=>$this->IM->getModule('member')->getLogged(),'path'=>$path,'name'=>$files[$i]->name,'type'=>$mAttachment->getFileType($files[$i]->type),'mime'=>$files[$i]->type,'size'=>$files[$i]->size,'status'=>'DRAFT','update_date'=>time()))->where('idx',$duplicated->idx)->execute();
						
						$files[$i]->idx = $duplicated->idx;
						$files[$i]->code = urlencode(Encoder(json_encode(array('idx'=>$duplicated->idx,'name'=>$files[$i]->name,'size'=>$files[$i]->size,'is_share'=>$files[$i]->is_share),JSON_UNESCAPED_UNICODE)));
						$files[$i]->chunkStart = 0;
						$files[$i]->success = true;
					}
					
					if ($files[$i]->duplicatedOption == 'cancel') {
						$files[$i]->idx = 0;
						$files[$i]->code = null;
						$files[$i]->chunkStart = 0;
						$files[$i]->success = false;
					}
					
					if ($files[$i]->duplicatedOption == null) {
						$files[$i]->update_date = time();
						$results->modalHtml = $this->getFileDuplicatedOptionModal($i,$files[$i],$duplicated);
						break;
					}
				}
			}
			
			if ($files[$i]->success !== false) {
				$file = $this->getFileMeta($files[$i]->idx);
				$file->is_favorite = $this->db()->select($this->table->favorite)->where('type','file')->where('fidx',$file->idx)->where('midx',$this->IM->getModule('member')->getLogged())->has();
				
				$files[$i]->file = $file;
			}
		}
		
		if (isset($results->modalHtml) == false) {
			$this->addActivity('UPLOAD',$uploadFolderIdx,$files);
		}
		
		$this->updateFolder($uploadFolderIdx);
	}
}

$results->files = $files;
?>