<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 특정항목의 정보를 가져온다.
 *
 * @file /modules/webhard/process/getItem.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param string $type 종류
 * @param string $idx 고유번호
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$type = Request('type');
$idx = Request('idx');

if ($type == 'folder') {
	if ($this->checkFolderPermission($idx,'R') == false) {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN');
	} else {
		$results->success = true;
		$results->item = $this->getFolderMeta($idx);
	}
} else {
	if ($this->checkFilePermission($idx,'R') == false) {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN');
	} else {
		$results->success = true;
		$results->item = $this->getFileMeta($idx);
	}
}
?>