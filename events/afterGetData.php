<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 *
 * afterGetData 이벤트를 처리한다.
 * 
 * @file /modules/webhard/events/afterGetData.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

if ($target == 'admin') {
	if ($get == 'configs') {
		if ($me->getModule()->getConfig('use_in_admin') == true) {
			$webhard = new stdClass();
			$webhard->menu = 'webhard';
			$webhard->page = false;
			$webhard->tab = false;
			$webhard->icon = 'xi-archive';
			$webhard->title = $me->getText('text/webhard');
			$values->additionalMenus[] = $webhard;
		}
	}
}
?>