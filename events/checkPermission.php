<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 *
 * checkPermission 이벤트를 처리한다.
 * 
 * @file /modules/webhard/events/checkPermission.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

if ($target == 'admin') {
	if ($caller == 'menu') {
		if ($action == 'webhard') {
			$permission = true;
		}
	}
}
?>