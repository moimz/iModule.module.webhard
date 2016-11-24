<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 업로드 취소/실패한 파일의 업로드를 재개한다.
 *
 * @file /modules/webhard/process/restartFile.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param int $idx 업로드 재개할 파일의 고유번호
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$idx = Request('idx');
$file = $this->getFile($idx);

if ($file == null || $file->creator != $this->IM->getModule('member')->getLogged()) {
	$results->success = false;
	$results->message = $this->getErrorText('UPLOAD_RESTART_FAILED');
} else {
	$this->db()->update($this->table->file,array('is_delete'=>'FALSE'))->where('idx',$idx)->execute();
	
	$results->success = true;
	$results->file = $this->getFileMeta($idx);
	$results->chunkStart = is_file($this->getFilePath($file->path)) == true ? filesize($this->getFilePath($file->path)) : 0;
}
?>