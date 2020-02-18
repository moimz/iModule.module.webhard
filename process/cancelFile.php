<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 * 
 * 업로드중인 파일을 휴지통으로 보낸다.
 *
 * @file /modules/webhard/process/cancelFile.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

$target = Request('target');
$idx = Request('idx');
$files = Request('files') ? json_decode(Request('files')) : array();

if ($idx) $files[] = $idx;

$deleted = array();
for ($i=0, $loop=count($files);$i<$loop;$i++) {
	$file = $this->getFile($files[$i]);
	
	if ($file->creator == $this->IM->getModule('member')->getLogged()) {
		$deleted[] = $file->idx;
		$this->db()->update($this->table->file,array('is_delete'=>'TRUE'))->where('idx',$file->idx)->execute();
	}
}

$results->success = true;
$results->files = $deleted;
?>