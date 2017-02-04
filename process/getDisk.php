<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 사용자 디스크 사용량을 가져온다.
 *
 * @file /modules/webhard/process/getDisk.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param int $select 삭제할 대상
 * @return object $results
 */

if (defined('__IM__') == false) exit;

$profile = $this->getProfile();
			
if ($profile == null) {
	$results->success = false;
} else {
	$results->success = true;
	$results->usage = $profile->disk_usage;
	$results->limit = $profile->disk_limit * 1000 * 1000;
}
?>