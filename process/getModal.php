<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 모달창 컨텍스트를 가져온다.
 *
 * @file /modules/webhard/process/getModal.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param string $modal 모달종류
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$modal = Request('modal');

/**
 * 새폴더 생성 모달
 */
if ($modal == 'create') {
	$parent = Request('parent');
	
	if ($this->checkFolderPermission($parent,'W') == true) {
		$results->success = true;
		$results->modalHtml = $this->getCreateModal($parent);
	} else {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN').$this->checkFolderPermission($parent);
	}
}

/**
 * 업로드 취소 모달
 */
if ($modal == 'cancel') {
	$type = Request('type');
	$idx = Request('idx');
	
	$results->success = true;
	$results->modalHtml = $this->getCancelModal($type,$idx);
}
?>