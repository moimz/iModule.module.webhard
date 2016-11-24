<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 파일을 업로드한다.
 *
 * @file /modules/webhard/process/uploadFile.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$code = Decoder(Request('code'));
if ($code) {
	$code = json_decode($code);
	$file = $this->db()->select($this->table->file)->where('idx',$code->idx)->getOne();
	
	if ($file != null) {
		if (isset($_SERVER['HTTP_CONTENT_RANGE']) == true && preg_match('/bytes ([0-9]+)\-([0-9]+)\/([0-9]+)/',$_SERVER['HTTP_CONTENT_RANGE'],$fileRange) == true) {
			$chunkBytes = file_get_contents("php://input");
			$chunkRangeStart = intval($fileRange[1]);
			$chunkRangeEnd = intval($fileRange[2]);
			$chunkTotalLength = intval($fileRange[3]);
			
			if ($chunkRangeStart === 0) {
				$fp = fopen($this->getFilePath($file->path),'w');
			} else {
				$fp = fopen($this->getFilePath($file->path),'a');
			}
			fseek($fp,$chunkRangeStart);
			fwrite($fp,$chunkBytes);
			fclose($fp);
			
			if ($chunkRangeEnd + 1 === $chunkTotalLength) {
				if (intval($file->size) != filesize($this->getFilePath($file->path))) {
					unlink($this->getFilePath($file->path));
					$this->db()->delete($this->table->file)->where('idx',$file->idx)->execute();
					$results->success = false;
					$results->message = 'SIZE NOT MATCHED ('.strlen($chunkBytes).'/'.$file->size.'/'.filesize($this->getFilePath($file->path)).')';
				} else {
					$status = 'PUBLISHED';
					$file = $this->fileUpload($file->idx);
					
					$results->success = true;
					$results->file = $this->getFileMeta($file);
					/*
					$results->file->preview = null;
					if ($results->file->type == 'image' || in_array(strtolower(pathinfo($results->file->name,PATHINFO_EXTENSION)),$this->enablePreview) == true) $results->file->preview = $this->getFileUrl($results->file->idx,'thumbnail');
					$results->file->uploaded = $results->file->size;
					$results->file->owner = null;
					$results->file->favorite = false;
					$results->file->extension = strtolower(pathinfo($results->file->name,PATHINFO_EXTENSION));
					$results->file->sort_name = addslashes(strtolower($results->file->name));
					*
					
					if ($code->is_share == true) {
						$hash = $this->shareFile($results->file->idx,'LINK',0);
						if ($hash === false) {
							$results->file->share = false;
						} else {
							$results->file->share = new stdClass();
							$results->file->share->hash = $hash;
							if ($results->file->type == 'image') {
								$results->file->share->view = $this->IM->getHost(true).$this->getFileUrl($results->file->idx,'view',$hash);
							}
							if ($results->file->type == 'image' || in_array(strtolower(pathinfo($results->file->name,PATHINFO_EXTENSION)),$this->enablePreview) == true) {
								$results->file->share->thumbnail = $this->IM->getHost(true).$this->getFileUrl($results->file->idx,'thumbnail',$hash);
							}
							$results->file->share->download = $this->IM->getModuleUrl('webhard','share',$hash,true);
						}
					}
					*/
				}
			} else {
				$results->success = true;
				$results->file = $file;
			}
		} else {
			$results->success = false;
			$results->message = $this->getErrorText('UPLOAD_FAIL_HEADER_ERROR');
		}
	} else {
		$results->success = false;
		$results->message = $this->getErrorText('UPLOAD_FAIL_UNREGISTED');
	}
} else {
	$results->success = false;
	$results->message = $this->getErrorText('NOT_FOUND');
}
?>