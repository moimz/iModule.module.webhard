<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 * 
 * 폴더경로에 해당하는 폴더 고유번호를 반환한다.
 *
 * @file /modules/webhard/process/getPath.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160923
 *
 * @param string $path 경로
 * @return object $results
 */
 
if (defined('__IM__') == false) exit;

$path = Request('path');

$results->success = true;
$results->idx = $this->getFolderPathToPathIdx($path);
?>