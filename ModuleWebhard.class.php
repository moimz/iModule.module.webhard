<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 *
 * 웹하드 관련 모든 기능을 제어한다.
 * 
 * @file /modules/webhard/ModuleWebhard.class.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160910
 */
class ModuleWebhard {
	/**
	 * iModule 및 Module 코어클래스
	 */
	private $IM;
	private $Module;
	
	/**
	 * DB 관련 변수정의
	 *
	 * @private object $DB DB접속객체
	 * @private string[] $table DB 테이블 별칭 및 원 테이블명을 정의하기 위한 변수
	 */
	private $DB;
	private $table;
	
	/**
	 * 언어셋을 정의한다.
	 * 
	 * @private object $lang 현재 사이트주소에서 설정된 언어셋
	 * @private object $oLang package.json 에 의해 정의된 기본 언어셋
	 */
	private $lang = null;
	private $oLang = null;
	
	/**
	 * DB접근을 줄이기 위해 DB에서 불러온 데이터를 저장할 변수를 정의한다.
	 *
	 * @private object[] $paths 폴더정보
	 * @private string[] $paths 폴더경로
	 * @private string[] $paths 폴더 고유번호 경로
	 * @private string[] $permissions 폴더권한
	 * @private boolean[] $shareds 폴더공유여부
	 * @private boolean[] $deleteds 폴더삭제여부
	 */
	private $folders = array();
	private $paths = array();
	private $pathIdxs = array();
	private $permissions = array();
	private $shareds = array();
	private $deleteds = array();
	
	/**
	 * 미리보기가 가능한 파일 확장자
	 * 문서의 경우 구글드라이브 API를 이용하여 미리보기를 처리한다.
	 */
	public $enablePreview = array('jpg','gif','png','jpeg','ppt','pptx','rtf','doc','docx','xls','xlsx','pdf');
	
	
	/**
	 * class 선언
	 *
	 * @param iModule $IM iModule 코어클래스
	 * @param Module $Module Module 코어클래스
	 * @see /classes/iModule.class.php
	 * @see /classes/Module.class.php
	 */
	function __construct($IM,$Module) {
		/**
		 * iModule 및 Module 코어 선언
		 */
		$this->IM = $IM;
		$this->Module = $Module;
		
		/**
		 * 모듈에서 사용하는 DB 테이블 별칭 정의
		 * @see 모듈폴더의 package.json 의 databases 참고
		 */
		$this->table = new stdClass();
		$this->table->activity = 'webhard_activity_table';
		$this->table->profile = 'webhard_profile_table';
		$this->table->folder = 'webhard_folder_table';
		$this->table->compress = 'webhard_compress_table';
		$this->table->file = 'webhard_file_table';
		$this->table->favorite = 'webhard_favorite_table';
		$this->table->link = 'webhard_link_table';
		$this->table->share = 'webhard_share_table';
		$this->table->share_log = 'webhard_share_log_table';
	}
	
	/**
	 * 모듈 코어 클래스를 반환한다.
	 * 현재 모듈의 각종 설정값이나 모듈의 package.json 설정값을 모듈 코어 클래스를 통해 확인할 수 있다.
	 *
	 * @return Module $Module
	 */
	function getModule() {
		return $this->Module;
	}
	
	/**
	 * 모듈 설치시 정의된 DB코드를 사용하여 모듈에서 사용할 전용 DB클래스를 반환한다.
	 *
	 * @return DB $DB
	 */
	function db() {
		if ($this->DB == null || $this->DB->ping() === false) $this->DB = $this->IM->db($this->getModule()->getInstalled()->database);
		return $this->DB;
	}
	
	/**
	 * 모듈에서 사용중인 DB테이블 별칭을 이용하여 실제 DB테이블 명을 반환한다.
	 *
	 * @param string $table DB테이블 별칭
	 * @return string $table 실제 DB테이블 명
	 */
	function getTable($table) {
		return empty($this->table->$table) == true ? null : $this->table->$table;
	}
	
	/**
	 * [코어] 사이트 외부에서 현재 모듈의 API를 호출하였을 경우, API 요청을 처리하기 위한 함수로 API 실행결과를 반환한다.
	 * 소스코드 관리를 편하게 하기 위해 각 요쳥별로 별도의 PHP 파일로 관리한다.
	 *
	 * @param string $api API명
	 * @return object $datas API처리후 반환 데이터 (해당 데이터는 /api/index.php 를 통해 API호출자에게 전달된다.)
	 * @see /api/index.php
	 */
	function getApi($api) {
		$data = new stdClass();
		
		/**
		 * 모듈의 api 폴더에 $api 에 해당하는 파일이 있을 경우 불러온다.
		 */
		if (is_file($this->getModule()->getPath().'/api/'.$api.'.php') == true) {
			INCLUDE $this->getModule()->getPath().'/api/'.$api.'.php';
		}
		
		/**
		 * 이벤트를 호출한다.
		 */
		$values = (object)get_defined_vars();
		$this->IM->fireEvent('afterGetApi','portfolio',$api,$values,$data);
		
		return $data;
	}
	
	/**
	 * [코어] 알림메세지를 구성한다.
	 *
	 * @param string $code 알림코드
	 * @param int $fromcode 알림이 발생한 대상의 고유값
	 * @param array $content 알림데이터
	 * @return string $push 알림메세지
	 */
	function getPush($code,$fromcode,$content) {
		return null;
	}
	
	/**
	 * [사이트관리자] 모듈 설정패널을 구성한다.
	 *
	 * @return string $panel 설정패널 HTML
	 */
	function getConfigPanel() {
		/**
		 * 설정패널 PHP에서 iModule 코어클래스와 모듈코어클래스에 접근하기 위한 변수 선언
		 */
		$IM = $this->IM;
		$Module = $this->getModule();
		
		ob_start();
		INCLUDE $this->getModule()->getPath().'/admin/configs.php';
		$panel = ob_get_contents();
		ob_end_clean();
		
		return $panel;
	}
	
	/**
	 * [사이트관리자] 모듈 관리자패널 구성한다.
	 *
	 * @return string $panel 관리자패널 HTML
	 */
	function getAdminPanel() {
		/**
		 * 설정패널 PHP에서 iModule 코어클래스와 모듈코어클래스에 접근하기 위한 변수 선언
		 */
		$IM = $this->IM;
		$Module = $this;
		
		ob_start();
		INCLUDE $this->getModule()->getPath().'/admin/index.php';
		$panel = ob_get_contents();
		ob_end_clean();
		
		return $panel;
	}
	
	/**
	 * [사이트관리자] 모듈의 전체 컨텍스트 목록을 반환한다.
	 *
	 * @return object $lists 전체 컨텍스트 목록
	 */
	function getContexts() {
		$contexts = $this->getText('admin/contexts');
		$lists = array();
		foreach ($contexts as $context=>$title) {
			$lists[] = array('context'=>$context,'title'=>$title);
		}
		
		return $lists;
	}
	
	/**
	 * [사이트관리자] 모듈의 컨텍스트 환경설정을 구성한다.
	 *
	 * @param object $site 설정대상 사이트
	 * @param string $context 설정대상 컨텍스트명
	 * @return object[] $configs 환경설정
	 */
	function getContextConfigs($site,$context) {
		$configs = array();
		
		$templet = new stdClass();
		$templet->title = $this->IM->getText('text/templet');
		$templet->name = 'templet';
		$templet->type = 'select';
		$templet->data = array();
		
		$templet->data[] = array('#',$this->getText('admin/configs/form/default_setting'));
		
		$templets = $this->getModule()->getTemplets();
		for ($i=0, $loop=count($templets);$i<$loop;$i++) {
			$templet->data[] = array($templets[$i]->getName(),$templets[$i]->getTitle().' ('.$templets[$i]->getDir().')');
		}
		
		$templet->value = count($templet->data) > 0 ? $templet->data[0][0] : '#';
		$configs[] = $templet;
		
		return $configs;
	}
	
	/**
	 * 언어셋파일에 정의된 코드를 이용하여 사이트에 설정된 언어별로 텍스트를 반환한다.
	 * 코드에 해당하는 문자열이 없을 경우 1차적으로 package.json 에 정의된 기본언어셋의 텍스트를 반환하고, 기본언어셋 텍스트도 없을 경우에는 코드를 그대로 반환한다.
	 *
	 * @param string $code 언어코드
	 * @param string $replacement 일치하는 언어코드가 없을 경우 반환될 메세지 (기본값 : null, $code 반환)
	 * @return string $language 실제 언어셋 텍스트
	 */
	function getText($code,$replacement=null) {
		if ($this->lang == null) {
			if (is_file($this->getModule()->getPath().'/languages/'.$this->IM->language.'.json') == true) {
				$this->lang = json_decode(file_get_contents($this->getModule()->getPath().'/languages/'.$this->IM->language.'.json'));
				if ($this->IM->language != $this->getModule()->getPackage()->language && is_file($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json') == true) {
					$this->oLang = json_decode(file_get_contents($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json'));
				}
			} elseif (is_file($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json') == true) {
				$this->lang = json_decode(file_get_contents($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json'));
				$this->oLang = null;
			}
		}
		
		$returnString = null;
		$temp = explode('/',$code);
		
		$string = $this->lang;
		for ($i=0, $loop=count($temp);$i<$loop;$i++) {
			if (isset($string->{$temp[$i]}) == true) {
				$string = $string->{$temp[$i]};
			} else {
				$string = null;
				break;
			}
		}
		
		if ($string != null) {
			$returnString = $string;
		} elseif ($this->oLang != null) {
			if ($string == null && $this->oLang != null) {
				$string = $this->oLang;
				for ($i=0, $loop=count($temp);$i<$loop;$i++) {
					if (isset($string->{$temp[$i]}) == true) {
						$string = $string->{$temp[$i]};
					} else {
						$string = null;
						break;
					}
				}
			}
			
			if ($string != null) $returnString = $string;
		}
		
		/**
		 * 언어셋 텍스트가 없는경우 iModule 코어에서 불러온다.
		 */
		if ($returnString != null) return $returnString;
		elseif (in_array(reset($temp),array('text','button','action')) == true) return $this->IM->getText($code,$replacement);
		else return $replacement == null ? $code : $replacement;
	}
	
	/**
	 * 상황에 맞게 에러코드를 반환한다.
	 *
	 * @param string $code 에러코드
	 * @param object $value(옵션) 에러와 관련된 데이터
	 * @param boolean $isRawData(옵션) RAW 데이터 반환여부
	 * @return string $message 에러 메세지
	 */
	function getErrorText($code,$value=null,$isRawData=false) {
		$message = $this->getText('error/'.$code,$code);
		if ($message == $code) return $this->IM->getErrorText($code,$value,null,$isRawData);
		
		$description = null;
		switch ($code) {
			default :
				if (is_object($value) == false && $value) $description = $value;
		}
		
		$error = new stdClass();
		$error->message = $message;
		$error->description = $description;
		
		if ($isRawData === true) return $error;
		else return $this->IM->getErrorText($error);
	}
	
	/**
	 * 특정 컨텍스트에 대한 제목을 반환한다.
	 *
	 * @param string $context 컨텍스트명
	 * @return string $title 컨텍스트 제목
	 */
	function getContextTitle($context) {
		return $this->getText('admin/contexts/'.$context);
	}
	
	/**
	 * 사이트맵에 나타날 뱃지데이터를 생성한다.
	 *
	 * @param string $context 컨텍스트종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return object $badge 뱃지데이터 ($badge->count : 뱃지숫자, $badge->latest : 뱃지업데이트 시각(UNIXTIME), $badge->text : 뱃지텍스트)
	 * @todo check count information
	 */
	function getContextBadge($context,$config) {
		/**
		 * null 일 경우 뱃지를 표시하지 않는다.
		 */
		return null;
	}
	
	/**
	 * 템플릿 정보를 가져온다.
	 *
	 * @param string $this->getTemplet($configs) 템플릿명
	 * @return string $package 템플릿 정보
	 */
	function getTemplet($templet=null) {
		$templet = $templet == null ? '#' : $templet;
		
		/**
		 * 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정일 경우
		 */
		if (is_object($templet) == true) {
			$templet = $templet !== null && isset($templet->templet) == true ? $templet->templet : '#';
		}
		
		/**
		 * 템플릿명이 # 이면 모듈 기본설정에 설정된 템플릿을 사용한다.
		 */
		$templet = $templet == '#' ? $this->getModule()->getConfig('templet') : $templet;
		return $this->getModule()->getTemplet($templet);
	}
	
	/**
	 * 페이지 컨텍스트를 가져온다.
	 *
	 * @param string $context 컨테이너 종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getContext($context,$configs=null) {
		/**
		 * 컨텍스트 컨테이너를 설정한다.
		 */
		$html = PHP_EOL.'<!-- WEBHARD MODULE -->'.PHP_EOL.'<div data-role="context" data-type="module" data-module="'.$this->getModule()->getName().'" data-container="'.($configs != null && isset($configs->container) == true ? 'TRUE' : 'FALSE').'">'.PHP_EOL;
		
		$this->IM->addHeadResource('style',$this->getModule()->getDir().'/styles/style.css');
		$this->IM->addHeadResource('script',$this->getModule()->getDir().'/scripts/script.js');
		
		/**
		 * 컨텍스트 헤더
		 */
		$html.= $this->getHeader($context,$configs);
		
		/**
		 * 컨테이너 종류에 따라 컨텍스트를 가져온다.
		 */
		switch ($context) {
			case 'explorer' :
				$html.= $this->getExplorerContext($configs,$configs != null && isset($configs->select) == true ? $configs->select : null);
				break;
		}
		
		/**
		 * 컨텍스트 푸터
		 */
		$html.= $this->getFooter($context,$configs);
		
		/**
		 * 컨텍스트 컨테이너를 설정한다.
		 */
		$html.= PHP_EOL.'</div>'.PHP_EOL.'<!--// WEBHARD MODULE -->'.PHP_EOL;
		
		return $html;
	}
	
	/**
	 * 모듈 외부컨테이너를 가져온다.
	 *
	 * @param string $container 컨테이너명
	 * @return string $html 컨텍스트 HTML / FileBytes 파일 바이너리
	 */
	function getContainer($container) {
		/**
		 * 파일에 직접 접근하는 컨테이너의 경우
		 */
		if (in_array($container,array('origin','thumbnail','view','download')) == true) {
			$fidx = $this->IM->view;
			$idx = explode('/',Request('idx'));
			$share = null;
			if (count($idx) == 2) list($share,$name) = $idx;
			elseif (count($idx) == 1) list($name) = $idx;
			else $this->IM->printError('NOT_FOUND_FILE');
			
			return $this->fileRead($fidx,$container,$share);
		}
		
		$configs = new stdClass();
		$configs->container = true;
		switch ($container) {
			case 'explorer' :
				$html = $this->getContext('explorer',$configs);
				break;
				
			case 'file' :
				$configs->select = 'file';
				$html = $this->getContext('explorer',$configs);
				break;
		}
		
		/**
		 * 모듈 헤더/푸터와 iModule 코어 헤더/푸터를 합친다.
		 * 사이트템플릿은 제거한다.
		 */
		$this->IM->removeTemplet();
		$footer = $this->IM->getFooter();
		$header = $this->IM->getHeader();
		
		return $header.$html.$footer;
	}
	
	/**
	 * 컨텍스트 헤더를 가져온다.
	 *
	 * @param string $context 컨테이너 종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getHeader($context,$configs=null) {
		/**
		 * 템플릿파일을 호출한다.
		 */
		return $this->getTemplet($configs)->getHeader(get_defined_vars());
	}
	
	/**
	 * 컨텍스트 푸터를 가져온다.
	 *
	 * @param string $context 컨테이너 종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getFooter($context,$configs=null) {
		/**
		 * 템플릿파일을 호출한다.
		 */
		return $this->getTemplet($configs)->getFooter(get_defined_vars());
	}
	
	/**
	 * 에러메세지를 반환한다.
	 *
	 * @param string $code 에러코드 (에러코드는 iModule 코어에 의해 해석된다.)
	 * @param object $value 에러코드에 따른 에러값
	 * @return $html 에러메세지 HTML
	 */
	function getError($code,$value=null) {
		/**
		 * iModule 코어를 통해 에러메세지를 구성한다.
		 */
		$error = $this->getErrorText($code,$value,true);
		return $this->IM->getError($error);
	}
	
	/**
	 * 웹하드 탐색기 컨텍스트를 가져온다.
	 *
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @param string $select 선택모드
	 * @return string $html 컨텍스트 HTML
	 */
	function getExplorerContext($configs,$select=null) {
		/**
		 * 로그인이 되어 있지 않다면, 에러메세지를 출력한다.
		 */
		if ($this->IM->getModule('member')->isLogged() == false) return $this->getTemplet($configs)->getError('REQUIRED_LOGIN');
		
		/**
		 * 회원프로필을 가져온다.
		 */
		$profile = $this->getProfile();
		
		$view = $this->IM->view ? $this->IM->view : 'folder';
		$path = Request('idx');
		
		if ($view == 'folder') {
			$path = $path ? $this->getRootFolder()->name.'/'.$path : $this->getRootFolder()->name;
			$pathIdxs = $this->getFolderPathToPathIdx($path);
			$idx = end($pathIdxs);
			
			
			if ($this->IM->view != 'folder' || $path != $this->getFolderPath($idx)) {
				$temp = explode('/',$this->getFolderPath($idx));
				$root = array_shift($temp);
				
				header("location:".$this->IM->getUrl(null,null,'folder',''));
			}
			
			$pathIdx = implode('/',$pathIdxs);
		}
		
		$this->IM->loadLanguage('module','webhard',$this->getModule()->getPackage()->language);
		$header = PHP_EOL.'<form id="ModuleWebhardExplorerForm">'.PHP_EOL;
		$header.= '<input type="file" id="ModuleWebhardUploadInput" multiple style="display:none;">'.PHP_EOL;
		$header.= '<input type="hidden" name="view" value="'.$view.'">'.PHP_EOL;
		$header.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$header.= '<input type="hidden" name="path" value="'.$path.'">'.PHP_EOL;
		$header.= '<input type="hidden" name="pathIdx" value="'.$pathIdx.'">'.PHP_EOL;
		$header.= '<input type="hidden" name="mode" value="'.($select == null ? 'webhard' : $select).'">'.PHP_EOL;
		$header.= '<input type="hidden" name="templet" value="'.$this->getTemplet($configs)->getName().'">'.PHP_EOL;
		$footer = PHP_EOL.'</form>'.PHP_EOL.'<script>Webhard.init();</script>'.PHP_EOL;
		
		/**
		 * FUCKING IE!!!
		 */
		if (preg_match('/(MSIE|Trident)/',$_SERVER['HTTP_USER_AGENT']) == true) {
			$footer.= '<script src="'.$this->getModule()->getDir().'/scripts/ie.js"></script>'.PHP_EOL;
		}
		
		/**
		 * 템플릿파일을 호출한다.
		 */
		return $this->getTemplet($configs)->getContext('explorer',get_defined_vars(),$header,$footer);
	}
	
	/**
	 * 새폴더 생성 모달 컨텍스트를 가져온다.
	 *
	 * @param int $parent 새 폴더를 생성할 폴더 고유번호
	 * @return string $html 모달컨텍스트 HTML
	 * @todo 언어셋
	 */
	function getCreateModal($parent) {
		$title = '새폴더 생성하기';
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="parent" value="'.$parent.'">'.PHP_EOL;
		
		$content.= '<label>'.$this->getText('text/folder_name').'</label>';
		$content.= '<div data-role="input"><input type="text" name="name"></div>';
		
		return $this->getTemplet()->getModal($title,$content);
	}
	
	/**
	 * 이름변경 모달 컨텍스트를 가져온다.
	 *
	 * @param object $target 이름을 변경할 대상객체
	 * @return string $html 모달컨텍스트 HTML
	 * @todo 언어셋
	 */
	function getRenameModal($target) {
		$title = '이름 바꾸기';
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="type" value="'.($target->type == 'folder' ? 'folder' : 'file').'">'.PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$target->idx.'">'.PHP_EOL;
		
		/**
		 * 폴더가 아닐경우 확장자를 제거한다.
		 */
		if ($target->type != 'folder') {
			$temp = explode('.',$target->name);
			if (count($temp) > 1 && $temp[0] != '') {
				array_pop($temp);
				$target->name = implode('.',$temp);
			}
		}
		$content.= '<div data-role="input"><input type="text" name="name" value="'.$target->name.'"></div>';
		
		return $this->getTemplet()->getModal($title,$content);
	}
	
	/**
	 * 삭제 모달 컨텍스트를 가져온다.
	 *
	 * @param object $target 삭제할 객체
	 * @todo 언어셋
	 */
	function getDeleteModal($target) {
		$title = '휴지통으로 이동';
		
		$content = '<div data-role="message">'.str_replace('{COUNT}',count($target),'{COUNT}개의 파일/폴더를 휴지통으로 이동하시겠습니까?').'</div>';
		
		return $this->getTemplet()->getModal($title,$content);
	}
	
	/**
	 * 항목 이동/복사 에러 모달 컨텍스트를 가져온다.
	 *
	 * @param int $idx 에러가 발생한 객체순서
	 * @param string $error 에러코드
	 * @param object $item 에러가 발생한 항목
	 */
	function getDeleteErrorModal($idx,$error,$item) {
		$title = $this->getErrorText('DELETE_FAILED');
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$content.= '<input type="hidden" name="option" value="cancel">'.PHP_EOL;
		
		$content.= '<div data-role="message">';
		if ($item != null) $content.= $this->getText('text/error_item').' : <b>'.($item->type == 'folder' ? '/' : '').$item->name.'</b><br><br>';
		
		$content.= $this->getErrorText($error);
		
		$buttons = array();
		
		if ($error == 'SHARED_ITEM' || $error == 'SHARED_FOLDER') {
			$content.= '<br>'.$this->getText('text/confirm_shared_delete');
			
			$button = new stdClass();
			$button->type = 'cancel';
			$button->text = $this->getText('button/cancel');
			$buttons[] = $button;
			
			$button = new stdClass();
			$button->type = 'delete';
			$button->class = 'danger';
			$button->text = $this->getText('button/delete');
			$buttons[] = $button;
		} elseif ($error == 'LINKED_ITEM' || $error == 'LINKED_FOLDER') {
			$content.= '<br>'.$this->getText('text/confirm_linked_delete');
			
			$button = new stdClass();
			$button->type = 'cancel';
			$button->text = $this->getText('button/cancel');
			$buttons[] = $button;
			
			$button = new stdClass();
			$button->type = 'delete';
			$button->class = 'danger';
			$button->text = $this->getText('button/delete');
			$buttons[] = $button;
		} else {
			$button = new stdClass();
			$button->type = 'cancel';
			$button->class = 'submit';
			$button->text = $this->getText('button/confirm');
			$buttons[] = $button;
		}
		
		if ($error == 'NOT_ALLOWED_MOVE_FOR_LOCK_ITEM' || $error == 'NOT_ALLOWED_DELETE_IN_TARGET') {
			
		} 
		
		$content.= '</div>';
		
		return $this->getTemplet()->getModal($title,$content,false,null,$buttons);
	}
	
	/**
	 * 특정 액션 취소 모달 컨텍스트를 가져온다.
	 *
	 * @param string $type 취소타입
	 * @param int $idx 고유번호
	 * @return string $html 모달컨텍스트 HTML
	 * @todo 언어셋
	 */
	function getCancelModal($type,$idx) {
		$content = '<div data-role="message">';
		
		if ($type == 'upload') {
			$title = '업로드 취소';
			
			if ($idx !== null && $this->getFile($idx) !== null) {
				$file = $this->getFile($idx);
				$content.= '<input type="hidden" name="idx" value="'.$file->idx.'">'.PHP_EOL;
				$content.= $file->name.' 업로드를 취소하시겠습니까?<br>해당 파일은 휴지통으로 이동됩니다.';
			} else {
				$content.= '파일 업로드를 취소하시겠습니까?<br>업로드가 완료되지 않은 파일은 휴지통으로 이동됩니다.';
			}
		}
		
		$content.= '</div>';
		
		return $this->getTemplet()->getModal($title,$content);
	}
	
	/**
	 * 항목 이동/복사 에러 모달 컨텍스트를 가져온다.
	 *
	 * @param int $idx 에러가 발생한 객체순서
	 * @param string $mode 이동/복사 여부
	 * @param string $error 에러코드
	 * @param object $item 에러가 발생한 항목
	 * @return string $html 모달컨텍스트 HTML
	 */
	function getMoveErrorModal($idx,$mode,$error,$item) {
		$title = $this->getErrorText(strtoupper($mode).'_FAILED');
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$content.= '<input type="hidden" name="option" value="cancel">'.PHP_EOL;
		
		$content.= '<div data-role="message">';
		if ($item != null) $content.= $this->getText('text/error_item').' : <b>'.($item->type == 'folder' ? '/' : '').$item->name.'</b><br><br>';
		
		$content.= $this->getErrorText($error);
		
		$buttons = array();
		
		if ($error == 'NOT_ALLOWED_MOVE_FOR_LOCK_ITEM' || $error == 'NOT_ALLOWED_DELETE_IN_TARGET') {
			$content.= '<br>'.$this->getText('text/suggest_copy');
			
			$button = new stdClass();
			$button->type = 'cancel';
			$button->text = $this->getText('button/cancel');
			$buttons[] = $button;
			
			$button = new stdClass();
			$button->type = 'copy';
			$button->class = 'submit';
			$button->text = $this->getText('button/copy');
			$buttons[] = $button;
		} else {
			$button = new stdClass();
			$button->type = 'cancel';
			$button->class = 'submit';
			$button->text = $this->getText('button/confirm');
			$buttons[] = $button;
		}
		
		$content.= '</div>';
		
		return $this->getTemplet()->getModal($title,$content,false,null,$buttons);
	}
	
	/**
	 * 항목 이동/복사시 대상폴더에 중복된 이름을 가진 폴더를 확인하는 모달 컨텍스트를 가져온다.
	 *
	 * @param int $idx 에러가 발생한 객체순서
	 * @param string $folder 이동/복사되는 폴더객체
	 * @param object $duplicated 중복된 폴더객체
	 * @return string $html 모달컨텍스트 HTML
	 */
	function getFolderDuplicatedOptionModal($idx,$folder,$duplicated) {
		$title = $this->getErrorText('CHECKED_DUPLICATED_ITEM');
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$content.= '<input type="hidden" name="option" value="cancel">'.PHP_EOL;
		
		$content.= '<div data-role="message">';
		$content.= $this->getText('text/confirm_duplicated');
		
		$detail = array(
			'<ul data-role="duplicated">',
				'<li class="title">'.$this->getText('text/error_item').' : <b>'.$folder->name.'</b></li>',
				'<li class="item"><b>'.$this->getText('text/origin_item').'</b> : <span data-role="time" data-moment="LLL" data-time="'.$duplicated->update_date.'"></span><span class="size">('.GetFileSize($duplicated->size).')</span></li>',
				'<li class="item"><b>'.$this->getText('text/current_item').'</b> : <span data-role="time" data-moment="LLL" data-time="'.$folder->update_date.'"></span><span class="size">('.GetFileSize($folder->size).')</span></li>',
			'</ul>'
		);
		
		$content.= implode(PHP_EOL,$detail);
		
		
		$buttons = array();
		
		$button = new stdClass();
		$button->type = 'cancel';
		$button->text = $this->getText('button/cancel');
		$buttons[] = $button;
		
		$button = new stdClass();
		$button->type = 'merge';
		$button->class = 'submit';
		$button->text = $this->getText('button/merge');
		$buttons[] = $button;
		
		$button = new stdClass();
		$button->type = 'replace';
		$button->class = 'danger';
		$button->text = $this->getText('button/replace');
		$buttons[] = $button;
		
		$content.= '</div>';
		
		$content.= '<div data-role="input"><label><input type="checkbox" name="continue">'.$this->getText('text/option_continue').'</label></div>';
		
		return $this->getTemplet()->getModal($title,$content,false,null,$buttons);
	}
	
	/**
	 * 항목 이동/복사시 대상폴더에 중복된 이름을 가진 파일을 확인하는 모달 컨텍스트를 가져온다.
	 *
	 * @param int $idx 에러가 발생한 객체순서
	 * @param string $file 이동/복사되는 파일객체
	 * @param object $duplicated 중복된 파일객체
	 * @return string $html 모달컨텍스트 HTML
	 */
	function getFileDuplicatedOptionModal($idx,$file,$duplicated) {
		$title = $this->getErrorText('CHECKED_DUPLICATED_ITEM');
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$content.= '<input type="hidden" name="option" value="cancel">'.PHP_EOL;
		
		$content.= '<div data-role="message">';
		$content.= $this->getText('text/confirm_duplicated');
		
		if ($duplicated->status == 'DRAFT') {
			$duplicated->uploaded = is_file($this->getFilePath($duplicated->path)) == true ? filesize($this->getFilePath($duplicated->path)) : 0;
		} else {
			$duplicated->uploaded = $duplicated->size;
		}
		
		$detail = array(
			'<ul data-role="duplicated">',
				'<li class="title">'.$this->getText('text/error_item').' : <b>'.$file->name.'</b></li>',
				'<li class="item"><b>'.$this->getText('text/origin_item').'</b> : <span data-role="time" data-moment="LLL" data-time="'.$duplicated->update_date.'"></span><span class="size">('.GetFileSize($duplicated->uploaded).')</span></li>',
				'<li class="item"><b>'.$this->getText('text/current_item').'</b> : <span data-role="time" data-moment="LLL" data-time="'.$file->update_date.'"></span><span class="size">('.GetFileSize($file->size).')</span></li>',
			'</ul>'
		);
		
		$content.= implode(PHP_EOL,$detail);
		
		
		
		
		$buttons = array();
		
		$button = new stdClass();
		$button->type = 'cancel';
		$button->text = $this->getText('button/cancel');
		$buttons[] = $button;
		
		if ($duplicated->creator == $this->IM->getModule('member')->getLogged() && $duplicated->status == 'DRAFT' && $file->size == $duplicated->size) {
			$button = new stdClass();
			$button->type = 'continue';
			$button->class = 'submit';
			$button->text = $this->getText('button/continue');
			$buttons[] = $button;
		} else {
			$button = new stdClass();
			$button->type = 'rename';
			$button->class = 'submit';
			$button->text = $this->getText('button/rename');
			$buttons[] = $button;
		}
		
		$button = new stdClass();
		$button->type = 'replace';
		$button->class = 'danger';
		$button->text = $this->getText('button/replace');
		$buttons[] = $button;
		
		$content.= '</div>';
		
		$content.= '<div data-role="input"><label><input type="checkbox" name="continue">'.$this->getText('text/option_continue').'</label></div>';
		
		return $this->getTemplet()->getModal($title,$content,false,null,$buttons);
	}
	
	/**
	 * 웹하드 파일이 저장되는 루트폴더를 반환한다.
	 *
	 * @return string $rootPath
	 */
	function getRootPath() {
		if (is_dir($this->IM->getAttachmentPath().'/webhard') == false) {
			mkdir($this->IM->getAttachmentPath().'/webhard');
			chmod($this->IM->getAttachmentPath().'/webhard',0707);
		}
		return $this->IM->getAttachmentPath().'/webhard';
	}
	
	/**
	 * 임시파일을 업로드할 경로를 반환한다.
	 *
	 * @return string $tempPath
	 */
	function getTempPath($isFullPath=false) {
		$folder = 'temp';
		if (is_dir($this->getRootPath().'/'.$folder) == false) {
			mkdir($this->getRootPath().'/'.$folder);
			chmod($this->getRootPath().'/'.$folder,0707);
		}
		
		if ($isFullPath == true) $folder = $this->getRootPath().'/'.$folder;
		return $folder;
	}
	
	/**
	 * 현시점의 파일이 보관되는 경로를 반환한다.
	 *
	 * @return string $currentPath
	 */
	function getCurrentPath($isFullPath=false) {
		$folder = date('Ym');
		if (is_dir($this->getRootPath().'/'.$folder) == false) {
			mkdir($this->getRootPath().'/'.$folder);
			chmod($this->getRootPath().'/'.$folder,0707);
		}
		
		if ($isFullPath == true) $folder = $this->IM->getAttachmentPath().'/'.$folder;
		return $folder;
	}
	
	/**
	 * 파일의 상대경로로 파일의 절대경로를 반환한다.
	 *
	 * @param string $origin 파일의 상대경로
	 * @return string $path 파일의 절대경로
	 */
	function getFilePath($origin) {
		if (substr($origin,0,1) == '/') $path = $origin;
		else $path = $this->getRootPath().'/'.$origin;
		
		$values = new stdClass();
		$values->origin = $path;
		$values->path = $path;
		
		$this->IM->fireEvent('afterGetData','webhard','filepath',$values);
		$path = $values->path;
		
		return $path;
	}
	
	/**
	 * 회원의 웹하드 프로필을 가져온다.
	 *
	 * @param int $midx 회원고유번호 (없을 경우 현재 로그인한 사용자)
	 * @return object $profile
	 */
	function getProfile($midx=null) {
		$midx = $midx == null ? $this->IM->getModule('member')->getLogged() : $midx;
		if ($midx == 0) return null;
		
		$profile = $this->db()->select($this->table->profile)->where('midx',$midx)->getOne();
		if ($profile == null) {
			$this->db()->insert($this->table->profile,array('midx'=>$midx,'disk_limit'=>$this->getModule()->getConfig('root_size')))->execute();
			return $this->getProfile($midx);
		}
		
		$values = new stdClass();
		$values->profile = $profile;
		$this->IM->fireEvent('afterGetData','webhard','profile',$values);
		
		return $profile;
	}
	
	/**
	 * 항목 아이콘을 가져온다.
	 *
	 * @param string $type 항목종류
	 * @param string $extension 파일확장자
	 */
	function getIcon($type,$extension='') {
		$icon = 'icon_large_etc.png';
		
		if ($type == 'folder') $icon = 'icon_large_folder.png';
		if ($type == 'document') $icon = 'icon_large_document.png';
		if ($type == 'archive') $icon = 'icon_large_archive.png';
		if ($type == 'video') $icon = 'icon_large_video.png';
		if ($type == 'audio') $icon = 'icon_large_audio.png';
		if ($type == 'image') $icon = 'icon_large_image.png';
		
		if ($extension == 'hwp') $icon = 'icon_large_hwp.png';
		if ($extension == 'pdf') $icon = 'icon_large_pdf.png';
		if ($extension == 'xls' || $extension == 'xlsx') $icon = 'icon_large_xls.png';
		if ($extension == 'doc' || $extension == 'docx') $icon = 'icon_large_doc.png';
		if ($extension == 'ppt' || $extension == 'pptx') $icon = 'icon_large_ppt.png';
		
		return $this->IM->getHost().$this->getModule()->getDir().'/images/'.$icon;
	}
	
	/**
	 * 폴더정보를 가져온다.
	 *
	 * @param int $idx 폴더 고유정보
	 * @return object $folder 폴더정보
	 */
	function getFolder($idx) {
		if (isset($this->folders[$idx]) == true) return $this->folders[$idx];
		
		$folder = $this->db()->select($this->table->folder)->where('idx',$idx)->getOne();
		if ($folder == null) {
			$this->folders[$idx] = null;
		} else {
			$folder->type = 'folder';
			$folder->is_shared = $folder->is_shared == 'TRUE';
			$folder->is_delete = $folder->is_delete == 'TRUE';
			$folder->is_lock = $folder->is_lock == 'TRUE';
			$folder->is_linked = $folder->linked != 0;
			$folder->is_shared_file = $folder->is_shared_file == 'TRUE';
			$folder->is_shared_child = $folder->is_shared_child == 'TRUE';
			$folder->is_linked_child = $folder->is_linked_child == 'TRUE';
			
			$this->folders[$idx] = $folder;
		}
		
		return $this->folders[$idx];
	}
	
	/**
	 * 폴더코드로 폴더정보를 가져온다.
	 *
	 * @param string $code 폴더코드
	 * @param int $midx 회원고유번호
	 * @return object $folder 폴더정보
	 */
	function getFolderFromCode($midx,$code) {
		$folder = $this->db()->select($this->table->folder,'idx')->where('owner',$midx)->where('code',$code)->getOne();
		return $folder !== null ? $this->getFolder($folder->idx) : null;
	}
	
	/**
	 * 폴더의 메타정보를 가져온다.
	 *
	 * @param int $idx 폴더고유번호 / object $folder 폴더정보
	 * @return object $meta 파일메타정보
	 */
	function getFolderMeta($idx) {
		if (is_object($idx) == true) {
			$folder = $idx;
		} else {
			$folder = $this->getFolder($idx);
		}
		
		$meta = new stdClass();
		$meta->type = 'folder';
		$meta->idx = $folder->idx;
		$meta->folder = $folder->parent;
		$meta->owner = $folder->owner;
		$meta->creator = $folder->creator;
		$meta->editor = $folder->editor;
		$meta->code = $folder->code;
		$meta->path = $this->getFolderPath($folder->idx);
		$meta->permission = $this->getFolderPermission($folder->idx);
		$meta->name = $folder->name;
		$meta->uploaded = $folder->size;
		$meta->size = $folder->size;
		$meta->date = $folder->update_date;
		$meta->icon = $this->getIcon('folder');
		$meta->status = 'PUBLISHED';
		$meta->download = $this->IM->getModuleUrl('webhard','compress',$folder->idx.'/'.$folder->name,true);
		
		return $meta;
	}
	
	/**
	 * 폴더경로를 가져온다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @return string $path 폴더경로
	 */
	function getFolderPath($idx) {
		if (isset($this->paths[$idx]) == true) return $this->paths[$idx];
		
		$folder = $this->getFolder($idx);
		
		/**
		 * 부모폴더의 경우
		 */
		if ($folder->parent == 0) return $folder->name;
		
		/**
		 * 폴더주인이 아닌경우, 해당폴더를 공유받은 폴더를 찾는다.
		 */
		if ($folder->owner != $this->IM->getModule('member')->getLogged()) {
			$share = $this->db()->select($this->table->folder)->where('owner',$this->IM->getModule('member')->getLogged())->where('linked',$folder->idx)->where('is_delete','FALSE')->getOne();
			
			/**
			 * 공유받은폴더가 있다면, 해당폴더 경로를 반환한다.
			 */
			if ($share != null) {
				$this->paths[$idx] = $this->getFolderPath($share->idx);
				return $this->paths[$idx];
			}
		}
		
		$path = $this->getFolderPath($folder->parent);
		
		/**
		 * 폴더가 삭제된 경우 현재 폴더를 붙이지 않는다.
		 */
		if ($this->checkFolderDeleted($folder->idx) == true) {
			$this->paths[$idx] = $path;
		} else {
			$this->paths[$idx] = $path.'/'.$folder->name;
		}
		
		return $this->paths[$idx];
	}
	
	/**
	 * 폴더경로를 가져온다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @return string $path 폴더 고유번호 경로
	 */
	function getFolderPathIdx($idx) {
		if (isset($this->pathIdxs[$idx]) == true) return $this->pathIdxs[$idx];
		
		$folder = $this->getFolder($idx);
		
		/**
		 * 부모폴더의 경우
		 */
		if ($folder->parent == 0) {
			$this->pathIdxs[$idx] = $folder->idx;
		} else {
			/**
			 * 폴더주인이 아닌경우, 해당폴더를 공유받은 폴더를 찾는다.
			 */
			if ($folder->owner != $this->IM->getModule('member')->getLogged()) {
				$share = $this->db()->select($this->table->folder,'idx')->where('owner',$this->IM->getModule('member')->getLogged())->where('linked',$folder->idx)->where('is_delete','FALSE')->getOne();
				
				/**
				 * 공유받은폴더가 있다면, 해당폴더 경로를 반환한다.
				 */
				if ($share != null) {
					$this->pathIdxs[$idx] = $this->getFolderPathIdx($share->idx);
					return $this->pathIdxs[$idx];
				}
			}
			
			$path = $this->getFolderPathIdx($folder->parent);
			
			/**
			 * 폴더가 삭제된 경우 현재 폴더를 붙이지 않는다.
			 */
			if ($this->checkFolderDeleted($folder->idx) == true) {
				$this->pathIdxs[$idx] = $path;
			} else {
				$this->pathIdxs[$idx] = $path.'/'.$folder->idx;
			}
		}
		
		return $this->pathIdxs[$idx];
	}
	
	/**
	 * 폴더경로를 폴더 고유번호 경로로 변환한다.
	 *
	 * @param string $path 폴더경로
	 * @return int[] $pathidx 폴더 고유번호 경로배열
	 */
	function getFolderPathToPathIdx($path) {
		$path = explode('/',$path);
		if (end($path) == '') array_pop($path);
		array_shift($path);
		$pathIdxs = array($this->getRootFolder()->idx);
		while (count($path) > 0) {
			$name = array_shift($path);
			if ($name == '') continue;
			
			$parent = end($pathIdxs);
			$check = $this->db()->select($this->table->folder)->where('name',$name)->where('parent',$parent)->where('is_delete','FALSE')->getOne();
			if ($check == null || $this->checkFolderPermission($check->idx,'R') == false) break;
			
			array_push($pathIdxs,$check->idx);
		}
		
		return $pathIdxs;
	}
	
	/**
	 * 폴더의 권한을 가져온다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param string $permission 폴더권한
	 */
	function getFolderPermission($idx) {
		if (isset($this->permissions[$idx]) == true) return $this->permissions[$idx];
		
		$folder = $this->getFolder($idx);
		if ($folder == null) return '';
		
		/**
		 * 폴더주인이 아닌경우,
		 */
		if ($folder->owner != $this->IM->getModule('member')->getLogged()) {
			$share = $this->db()->select($this->table->folder)->where('owner',$this->IM->getModule('member')->getLogged())->where('linked',$folder->idx)->getOne();
			
			/**
			 * 공유받은폴더가 있다면, 해당폴더 권한을 반환한다.
			 */
			if ($share != null) {
				$this->permissions[$idx] = $share->permission;
				return $this->permissions[$idx];
			}
		}
		
		$this->permissions[$idx] = $folder->permission;
		return $this->permissions[$idx];
	}
	
	/**
	 * 파일정보를 가져온다.
	 *
	 * @param int $idx 파일 고유정보
	 * @return object $file 파일정보
	 */
	function getFile($idx) {
		$file = $this->db()->select($this->table->file)->where('idx',$idx)->getOne();
		if ($file == null) return null;
		
		$file->is_shared = $file->is_shared == 'TRUE';
		$file->is_delete = $file->is_delete == 'TRUE';
		$file->is_lock = $file->is_lock == 'TRUE';
		
		return $file;
	}
	
	/**
	 * 파일의 메타정보를 가져온다.
	 *
	 * @param int $idx 파일고유번호 / object $file 파일정보
	 * @return object $meta 파일메타정보
	 */
	function getFileMeta($idx) {
		if (is_object($idx) == true) {
			$file = $idx;
		} else {
			$file = $this->getFile($idx);
		}
		
		$meta = new stdClass();
		$meta->type = 'file';
		$meta->idx = $file->idx;
		$meta->folder = $file->folder;
		$meta->owner = $file->owner;
		$meta->creator = $file->creator;
		$meta->editor = $file->editor;
		$meta->code = $file->code;
		$meta->path = $this->getFolderPath($file->folder).'/'.$file->name;
		$meta->permission = $this->getFilePermission($file->idx);
		$meta->name = $file->name;
		$meta->uploaded = $file->status == 'DRAFT' ? (is_file($this->getFilePath($file->path)) == true ? filesize($this->getFilePath($file->path)) : 0) : $file->size;
		$meta->size = $file->size;
		$meta->date = $file->update_date;
		$meta->status = $file->status;
		
		$meta->filetype = $file->type;
		$meta->mime = $file->mime;
		$meta->extension = strtolower(pathinfo($file->name,PATHINFO_EXTENSION));
		$meta->icon = $this->getIcon($meta->filetype,$meta->extension);
		
		if ($meta->filetype == 'image') {
			$meta->width = $file->width;
			$meta->height = $file->height;
		}
		
		if (in_array($meta->extension,$this->enablePreview) == true) {
			$meta->preview = $this->getFileUrl($file,'thumbnail');
		}
		
		$meta->download = $this->getFileUrl($file,'download');
		
		return $meta;
	}
	
	/**
	 * 파일의 URL 을 가져온다.
	 * 공유정보가 없을 경우 파일소유자만이 해당 URL 로 파일에 접근할 수 있다.
	 *
	 * @param int $idx 파일고유번호
	 * @param string $view 종류 (origin, view, thumbnail)
	 * @param string $share 공유해시
	 * @param boolean $isFullUrl 전체 URL 포함여부 (기본값 : false)
	 */
	function getFileUrl($idx,$view='view',$share=null,$isFullUrl=false) {
		if (is_object($idx) == true) {
			$file = $idx;
		} else {
			$file = $this->getFile($idx);
		}
		
		if ($file == null) {
			return null;
		} else {
			$idx = $share == null ? $file->name : $share.'/'.$file->name;
			return $this->IM->getModuleUrl('webhard',$view,$file->idx,$idx,$isFullUrl);
		}
	}
	
	/**
	 * 파일의 권한을 가져온다.
	 *
	 * @param int $idx 파일 고유번호
	 * @param string $share 공유코드
	 * @param string $permission 폴더권한
	 */
	function getFilePermission($idx,$share=null) {
		$file = $this->getFile($idx);
		
		if ($file == null) return '';
		if ($file->owner == $this->IM->getModule('member')->getLogged()) return 'RWD';
		
		/**
		 * 공유코드가 있을 경우 공유에 대한 권한 확인
		 */
		if ($share != null) {
			$share = $this->db()->select($this->table->share)->where('hash',$share)->getOne();
			if ($share == null || $share->fidx != $idx) return '';
			
			/**
			 * URL 공유일 경우, 모든 사람에게 일기권한 부여
			 */
			if ($share->type == 'LINK') return 'R';
			
			/**
			 * 공유가 iModule 모듈에 의해 설정된 경우, 해당모듈에 접근하여 파일권한을 가져온다.
			 */
			if ($share->type == 'MODULE') {
				$target = json_decode($share->target);
				$mModule = $this->IM->getModule($target->module);
				
				/**
				 * 해당모듈에 웹하드모듈을 위한 함수가 없을 경우, 접근권한이 있다고 판단한다.
				 */
				if (method_exists($mModule,'doWebhard') == false) {
					return '';
				} else {
					if ($mModule->doWebhard('checkPermission',$target->data) == true) {
						return 'R';
					} else {
						return '';
					}
				}
			}
		}
		
		if ($this->IM->getModule('member')->isLogged() == false) return '';
		return $this->getFolderPermission($file->folder);
	}
	
	/**
	 * 회원의 루트폴더 정보를 가져온다.
	 *
	 * @param int $midx(옵션) 회원고유번호, 없을 경우 현재 로그인한 사용자
	 * @return object $root 루트폴더정보
	 */
	function getRootFolder($midx=null) {
		$midx = $midx == null ? $this->IM->getModule('member')->getLogged() : $midx;
		if ($midx == 0) return null;
		
		$check = $this->db()->select($this->table->folder)->where('owner',$midx)->where('parent',0)->getOne();
		if ($check == null) {
			$name = $this->getModule()->getConfig('root_name');
			
			$this->db()->insert($this->table->folder,array('owner'=>$midx,'creator'=>$midx,'editor'=>$midx,'name'=>$name,'reg_date'=>time(),'update_date'=>time()))->execute();
			return $this->getRootFolder($midx);
		} else {
			return $check;
		}
	}
	
	/**
	 * 대상폴더내에서 중복을 피하기 위한 파일이름을 반환한다.
	 *
	 * @param int $parent 대상폴더 고유번호
	 * @param string $name 중복된 파일이름
	 * @return string $newname 중복되지 않는 새로운 이름
	 */
	function getEscapeDuplicatedFileName($folder,$name) {
		$temp = explode('.',$name);
		$extension = array_pop($temp);
		$name = implode('.',$temp);
		$number = 0;
		while (true) {
			$newname = $number == 0 ? $name.'.'.$extension : $name.'('.$number.').'.$extension;
			if ($this->db()->select($this->table->file)->where('folder',$folder)->where('is_delete','FALSE')->where('name',$newname)->has() == false) {
				return $newname;
			}
			$number++;
		}
	}
	
	/**
	 * 대상폴더내에서 중복을 피하기 위한 폴더이름을 반환한다.
	 *
	 * @param int $parent 대상폴더 고유번호
	 * @param string $name 중복된 폴더이름
	 * @return string $newname 중복되지 않는 새로운 이름
	 */
	function getEscapeDuplicatedFolderName($parent,$name) {
		$number = 0;
		while (true) {
			$newname = $number == 0 ? $name : $name.'('.$number.')';
			if ($this->db()->select($this->table->folder)->where('parent',$parent)->where('is_delete','FALSE')->where('name',$newname)->has() == false) {
				return $newname;
			}
			$number++;
		}
	}
	
	/**
	 * 폴더명이 유효한지 확인한다.
	 *
	 * @param int $name 폴더명
	 * @return string/boolean 유효한 폴더명일 경우 true, 그렇지 않을 경우 에러메세지
	 */
	function checkFolderName($name) {
		if (preg_match('/(\/|#|\?|"|%|<|>|\'|\||\\\)+/',$name) == true) return $this->getErrorText('INVALID_FOLDER_NAME');
		if (preg_match('/^(\.)+$/',$name) == true) return $this->getErrorText('NOT_ALLOWED_CHARACTER_IN_FORDER_NAME');
		if (strlen($name) == 0 || strlen($name) > 200) return $this->getErrorText('INVALID_FOLDER_NAME_LENGTH');
		
		return true;
	}
	
	/**
	 * 파일명이 유효한지 확인한다.
	 *
	 * @param int $name 파일명
	 * @return string/boolean 유효한 파일명일 경우 true, 그렇지 않을 경우 에러메세지
	 */
	function checkFileName($name) {
		if (preg_match('/(\/|\\\)+/',$name) == true) return $this->getErrorText('INVALID_FILE_NAME');
		if (preg_match('/^(\.)+$/',$name) == true) return $this->getErrorText('INVALID_FILE_NAME');
		if (strlen($name) == 0 || strlen($name) > 200) return $this->getErrorText('INVALID_FILE_NAME_LENGTH');
		
		return true;
	}
	
	/**
	 * 폴더의 권한을 확인한다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param string $check 확인할 권한
	 * @param boolean $hasPermission
	 */
	function checkFolderPermission($idx,$check) {
		$permission = $this->getFolderPermission($idx);
		return strpos($permission,$check) !== false;
	}
	
	/**
	 * 파일의 권한을 확인한다.
	 *
	 * @param int $idx 파일 고유번호
	 * @param string $check 확인할 권한
	 * @param string $share 공유코드
	 * @param boolean $hasPermission
	 */
	function checkFilePermission($idx,$check,$share=null) {
		$permission = $this->getFilePermission($idx,$share=null);
		return strpos($permission,$check) !== false;
	}
	
	/**
	 * 파일을 공유한다.
	 *
	 * @param int $idx 파일고유번호
	 * @param array/string $type 공유타입
	 * @param int $expire 공유기간 (0 입력시 무제한, 숫자는 만료일(UNIX_TIMESTAMP))
	 * @param string $hash 공유파일해쉬 (공유실패시 false 반환)
	 */
	function shareFile($idx,$type,$expire=0) {
		if ($this->checkFilePermission($idx,'R') == true) {
			$file = $this->getFile($idx);
			
			$hash = md5($idx.$_SERVER['REMOTE_ADDR'].time().rand(1000,9999));
			if ($this->db()->select($this->table->share)->where('hash',$hash)->has() == true) return $this->shareFile($idx,$type,$expire);
			
			$insert = array();
			$insert['hash'] = $hash;
			$insert['midx'] = $this->IM->getModule('member')->getLogged();
			$insert['fidx'] = $idx;
			$insert['reg_date'] = time();
			$insert['expire_date'] = $expire;
			
			/**
			 * $type 이 배열일 경우 모듈에서 공유 시도한다는 의미
			 */
			if (is_array($type) == true) {
				$insert['type'] = 'MODULE';
				$insert['target'] = json_encode($type,JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
			}
			
			$check = $this->db()->select($this->table->share)->where('midx',$insert['midx'])->where('type',$insert['type'])->where('fidx',$insert['fidx'])->where('target',$insert['target'])->getOne();
			if ($check != null) return $check->hash;
			
			$this->db()->insert($this->table->share,$insert)->execute();
			$this->addActivity('SAHRE_FILE',$idx,$type);
			
			if ($file->is_shared == false) {
				$this->db()->update($this->table->file,array('is_shared'=>'TRUE'))->where('idx',$idx)->execute();
				$this->updateFolderShared($file->folder);
			}
			
			return $hash;
		} else {
			return false;
		}
	}
	
	/**
	 * 파일을 공유해제한다.
	 *
	 * @param string $hash 파일공유해시
	 * @return boolean $success
	 */
	function unshareFile($hash) {
		$share = $this->db()->select($this->table->share)->where('hash',$hash)->getOne();
		if ($share == null) return false;
		if ($share->midx != $this->IM->getModule('member')->getLogged()) return false;
		
		$this->db()->delete($this->table->share)->where('hash',$hash)->execute();
		
		$this->addActivity('UNSAHRE_FILE',$share->fidx,json_decode($share->target));
		
		if ($this->db()->select($this->table->share)->where('fidx',$share->fidx)->has() == false) {
			$file = $this->getFile($share->fidx);
			$this->db()->update($this->table->file,array('is_shared'=>'FALSE'))->where('idx',$file->idx)->execute();
			$this->updateFolderShared($file->folder);
		}
		
		return true;
	}
	
	/**
	 * 폴더 내부에 공유중인 항목이 있는지 확인한다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param boolean $isShared
	 */
	function checkFolderShared($idx) {
		if (isset($this->shareds[$idx]) == true) return $this->shareds[$idx];
		
		$folder = $this->getFolder($idx);
		if ($folder->parent == 0) {
			$this->shareds[$idx] = false;
		} else {
			$this->shareds[$idx] = $folder->is_shared == true || $folder->is_shared_file == true || $folder->is_shared_child == true;
			
		}
		
		return $this->shareds[$idx];
	}
	
	/**
	 * 폴더공유상태를 업데이트한다.
	 *
	 * @param int $idx 폴더고유번호
	 */
	function updateFolderShared($idx) {
		$folder = $this->getFolder($idx);
		
		if ($folder == null) return;
		
		/**
		 * 링크된 폴더가 있는지 확인한다.
		 */
		$is_parent = false;
		if ($this->db()->select($this->table->folder)->where('linked',$folder->idx)->has() == true) {
			if ($folder->is_shared == false) {
				$this->db()->update($this->table->folder,array('is_shared'=>'TRUE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		} else {
			if ($folder->is_shared == true) {
				$this->db()->update($this->table->folder,array('is_shared'=>'FALSE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		}
		
		/**
		 * 폴더내부에 공유중인 파일이 있는지, 또는 폴더내부에 공유중인 폴더가 있는지 확인한다.
		 */
		if ($this->db()->select($this->table->folder)->where('is_shared_file','TRUE')->where('parent',$folder->idx)->has() == true || $this->db()->select($this->table->file)->where('is_shared','TRUE')->where('folder',$folder->idx)->has() == true) {
			if ($folder->is_shared_file == false) {
				$this->db()->update($this->table->folder,array('is_shared_file'=>'TRUE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		} else {
			if ($folder->is_shared_file == true) {
				$this->db()->update($this->table->folder,array('is_shared_file'=>'FALSE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		}
		
		/**
		 * 폴더내부에 공유중인 자식이 있는 폴더가 있는지 확인한다.
		 */
		if ($this->db()->select($this->table->folder)->where('is_shared_child','TRUE')->where('parent',$folder->idx)->has() == true || $this->db()->select($this->table->folder)->where('is_shared','TRUE')->where('parent',$folder->idx)->has() == true) {
			if ($folder->is_shared_child == false) {
				$this->db()->update($this->table->folder,array('is_shared_child'=>'TRUE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		} else {
			if ($folder->is_shared_child == true) {
				$this->db()->update($this->table->folder,array('is_shared_child'=>'FALSE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		}
		
		/**
		 * 폴더내부에 공유받은 폴더가 있는지 확인한다.
		 */
		if ($this->db()->select($this->table->folder)->where('linked',0,'!=')->where('parent',$folder->idx)->has() == true || $this->db()->select($this->table->folder)->where('is_linked_child','TRUE')->where('parent',$folder->idx)->has() == true) {
			if ($folder->is_linked_child == false) {
				$this->db()->update($this->table->folder,array('is_linked_child'=>'TRUE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		} else {
			if ($folder->is_linked_child == true) {
				$this->db()->update($this->table->folder,array('is_linked_child'=>'FALSE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		}
		
		if ($is_parent == true || $folder->parent != 0) $this->updateFolderShared($folder->parent);
	}
	
	/**
	 * 공유받은 폴더상태를 업데이트한다.
	 *
	 * @param int $idx 폴더고유번호
	 */
	function updateFolderLinked($idx) {
		$folder = $this->getFolder($idx);
		
		if ($folder == null) return;
		
		$is_parent = false;
		if ($this->db()->select($this->table->folder)->where('is_linked_child','TRUE')->where('parent',$folder->idx)->has() == true || $this->db()->select($this->table->folder)->where('linked',0,'!=')->where('parent',$folder->idx)->has() == true) {
			if ($folder->is_linked_child == false) {
				$this->db()->update($this->table->folder,array('is_linked_child'=>'TRUE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		} else {
			if ($folder->is_linked_child == true) {
				$this->db()->update($this->table->folder,array('is_linked_child'=>'FALSE'))->where('idx',$folder->idx)->execute();
				$is_parent = true;
			}
		}
		
		if ($folder->parent != 0) {
			$parent = $this->getFolder($folder->parent);
			if ($parent->is_linked_child != $folder->is_linked) $is_parent = true;
		}
		
		if ($is_parent == true || $folder->parent != 0) $this->updateFolderLinked($folder->parent);
	}
	
	/**
	 * 삭제된 폴더인지 확인한다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param boolean $isDeleted
	 */
	function checkFolderDeleted($idx) {
		if (isset($this->deleteds[$idx]) == true) return $this->deleteds[$idx];
		
		$folder = $this->getFolder($idx);
		if ($folder->parent == 0) {
			$this->deleteds[$idx] = false;
		} else {
			$this->deleteds[$idx] = $folder->is_delete == true || $this->checkFolderDeleted($folder->parent);
		}
		
		return $this->deleteds[$idx];
	}
	
	/**
	 * 삭제된 파일인지 확인한다.
	 *
	 * @param int $idx 파일 고유번호
	 * @param boolean $isDeleted
	 */
	function checkFileDeleted($idx) {
		$file = $this->getFile($idx);
		return $file == null || $file->is_delete == true || $this->checkFolderDeleted($file->folder);
	}
	
	/**
	 * 폴더를 휴지통으로 보낸다.
	 * 폴더를 휴지통으로 보낼때, 폴더내부의 모든 공유를 삭제하고, 폴더내부의 모든 파일의 즐겨찾기를 제거한다.
	 *
	 * @param int $idx 폴더고유번호
	 * @return boolean $isDelete
	 */
	function deleteFolder($idx,$owner=null) {
		$folder = $this->getFolder($idx);
		
		/**
		 * 공유받은 폴더의 경우
		 */
		if ($folder->is_linked == true) {
			$this->db()->delete($this->table->folder)->where('idx',$folder->idx)->execute();
			$this->addActivity('UNLINK',$folder[$i]->parent,$folder,time());
			
			/**
			 * 공유받은 폴더중 내가 즐겨찾기 한 파일이 있을 경우 삭제한다.
			 */
			$files = $this->db()->select($this->table->file)->where('folder',$folder->linked)->get();
			for ($i=0, $loop=count($files);$i<$loop;$i++) {
				$this->db()->delete($this->table->favorite)->where('midx',$folder->owner)->where('type','FILE')->where('fidx',$files[$i]->idx)->execute();
			}
			
			/**
			 * 공유받은 폴더중 내가 즐겨찾기 한 폴더가 있으면 삭제한다.
			 */
			$folders = $this->db()->select($this->table->folder)->where('parent',$folder->linked)->get();
			for ($i=0, $loop=count($folders);$i<$loop;$i++) {
				$this->db()->delete($this->table->favorite)->where('midx',$folder->owner)->where('type','FOLDER')->where('fidx',$folders[$i]->idx)->execute();
				
				/**
				 * 현 폴더내부의 즐겨찾기 제거
				 */
				$this->deleteFolder($folders[$i]->idx,$folder->owner);
			}
			
			return;
		}
		
		
		if ($owner !== null) {
			/**
			 * 공유받은 폴더중 내가 즐겨찾기 한 파일이 있을 경우 삭제한다.
			 */
			$files = $this->db()->select($this->table->file)->where('folder',$folder->idx)->get();
			for ($i=0, $loop=count($files);$i<$loop;$i++) {
				$this->db()->delete($this->table->favorite)->where('midx',$owner)->where('type','FILE')->where('fidx',$files[$i]->idx)->execute();
			}
			
			/**
			 * 공유받은 폴더중 내가 즐겨찾기 한 폴더가 있으면 삭제한다.
			 */
			$folders = $this->db()->select($this->table->folder)->where('parent',$folder->idx)->get();
			for ($i=0, $loop=count($folders);$i<$loop;$i++) {
				$this->db()->delete($this->table->favorite)->where('midx',$owner)->where('type','FOLDER')->where('fidx',$folders[$i]->idx)->execute();
				
				/**
				 * 현 폴더내부의 즐겨찾기 제거
				 */
				$this->deleteFolder($folders[$i]->idx,$owner);
			}
			
			return;
		}
		
		/**
		 * 공유해준 폴더를 모두 삭제한다.
		 */
		$shared = $this->db()->select($this->table->folder)->where('linked',$folder->idx)->get();
		for ($i=0, $loop=count($shared);$i<$loop;$i++) {
			$this->db()->delete($this->table->folder)->where('idx',$shared[$i]->idx)->execute();
			$this->db()->delete($this->table->favorite)->where('type','FOLDER')->where('fidx',$shared[$i]->idx)->execute();
			$this->addActivity('UNLINKED',$shared[$i]->parent,$shared[$i],time());
			$this->updateFolderLinked($shared[$i]->parent);
		}
		
		/**
		 * 공유요청을 모두 삭제한다.
		 */
		$this->db()->delete($this->table->link)->where('fidx',$folder->idx)->execute();
		
		/**
		 * 공유받은 폴더를 모두 삭제한다.
		 */
		$linked = $this->db()->select($this->table->folder)->where('linked',0,'!=')->where('parent',$folder->idx)->get();
		for ($i=0, $loop=count($linked);$i<$loop;$i++) {
			$this->db()->delete($this->table->folder)->where('idx',$linked[$i]->idx)->execute();
			$this->db()->delete($this->table->favorite)->where('type','FOLDER')->where('fidx',$linked[$i]->idx)->execute();
			$this->addActivity('UNLINK',$linked[$i]->linked,$linked[$i],time());
			$this->updateFolderShared($linked[$i]->linked);
		}
		
		/**
		 * 즐겨찾기에서 해당 폴더를 제거한다.
		 */
		$this->db()->delete($this->table->favorite)->where('type','FOLDER')->where('fidx',$folder->idx)->execute();
		
		/**
		 * 폴더내부 파일에 대한 처리
		 */
		$files = $this->db()->select($this->table->file)->where('folder',$folder->idx)->get();
		for ($i=0, $loop=count($files);$i<$loop;$i++) {
			$this->db()->delete($this->table->share)->where('fidx',$files[$i]->idx)->execute();
			if ($files[$i]->is_shared == 'TRUE') {
				$this->db()->update($this->table->file,array('is_shared'=>'FALSE'))->where('idx',$files[$i]->idx)->execute();
				$this->addActivity('UNSHARE_FILE',$files[$i]->idx,$files[$i],time());
			}
			
			$this->db()->delete($this->table->favorite)->where('type','FILE')->where('fidx',$files[$i]->idx)->execute();
		}
		
		$this->db()->update($this->table->folder,array('is_shared'=>'FALSE','is_shared_file'=>'FALSE','is_shared_child'=>'FALSE','is_linked_child'=>'FALSE'))->where('idx',$folder->idx)->execute();
		
		/**
		 * 자식폴더에 대한 처리
		 */
		$children = $this->db()->select($this->table->folder)->where('parent',$folder->idx)->get();
		for ($i=0, $loop=count($children);$i<$loop;$i++) {
			$this->deleteFolder($children[$i]->idx);
		}
	}
	
	/**
	 * 활동내역을 기록한다.
	 *
	 * @param string $type 활동분류
	 * @param int $target 활동이 일어난 폴더고유번호 또는 파일고유번호
	 * @param object $datas 활동데이터
	 * @param int $reg_date 활동이 일어난 시각
	 */
	function addActivity($type,$target,$datas=null,$reg_date=null) {
		$is_record = false;
		$data = new stdClass();
		
		if ($type == 'UPLOAD') {
			$data->folder = new stdClass();
			$data->folder->idx = $target;
			$data->folder->path = $this->getFolderPath($target);
			
			$data->files = array();
			for ($i=0, $loop=count($datas);$i<$loop;$i++) {
				if ($datas[$i]->idx > 0) {
					$file = $this->db()->select($this->table->file,'idx,name,type,size,update_date')->where('idx',$datas[$i]->idx)->getOne();
					if ($datas[$i]->duplicatedOption == 'replace') $this->addActivity('REPLACE_FILE',$file->idx,$file);
					elseif ($datas[$i]->duplicatedOption == null) $this->addActivity('CREATE_FILE',$file->idx,$file);
					
					if ($datas[$i]->duplicatedOption == null || $datas[$i]->duplicatedOption == 'replace') {
						$data->files[] = $file;
						$reg_date = $reg_date == null || $reg_date > $file->update_date ? $file->update_date : $reg_date;
					}
				}
			}
			
			if (count($data->files) == 0) return;
			
			$target = $target == 0 ? '@'.$this->IM->getModule('member')->getLogged() : '/'.$target;
			$is_record = true;
		}
		
		if ($type == 'CREATE_FOLDER' || $type == 'CREATE_FILE' || $type == 'REPLACE_FILE') {
			$data = $datas;
			$reg_date = $datas->update_date;
			$is_record = true;
		}
		
		if ($type == 'DELETE') {
			$data->folder = new stdClass();
			$data->folder->idx = $target;
			$data->folder->path = $this->getFolderPath($target);
			
			$data->items = array();
			for ($i=0, $loop=count($datas);$i<$loop;$i++) {
				if ($datas[$i]->success == true) {
					if ($datas[$i]->type == 'folder') {
						$folder = $this->db()->select($this->table->folder)->where('idx',$datas[$i]->idx)->getOne();
						$this->addActivity('DELETE_FOLDER',$folder->idx,$folder);
						
						$item = new stdClass();
						$item->type = 'folder';
						$item->idx = $folder->idx;
						$item->name = $folder->name;
						$item->size = $folder->size;
					} else {
						$file = $this->db()->select($this->table->file)->where('idx',$datas[$i]->idx)->getOne();
						$this->addActivity('DELETE_FILE',$file->idx,$file);
						
						$item = new stdClass();
						$item->type = $file->type;
						$item->idx = $file->idx;
						$item->name = $file->name;
						$item->size = $file->size;
					}
					
					$data->items[] = $item;
				}
			}
			
			$target = $target == 0 ? '@'.$this->IM->getModule('member')->getLogged() : '/'.$target;
			$is_record = true;
		}
		
		if ($type == 'DELETE_FOLDER' || $type == 'DELETE_FILE') {
			$data = $datas;
			$reg_date = $datas->update_date;
			$target = $type == 'DELETE_FOLDER' ? '/'.$target : $target;
			$is_record = true;
		}
		
		if ($type == 'SAHRE_FILE' || $type == 'SHARE_FOLDER' || $type == 'UNSAHRE_FILE' || $type == 'UNSAHRE_FOLDER') {
			$data = $datas;
			$target = $type == 'SHARE_FOLDER' || $type == 'UNSAHRE_FOLDER' ? '/'.$target : $target;
			$is_record = true;
		}
		
		if ($is_record == true) {
			$reg_date = $reg_date == null ? time() : $reg_date;
		
			$this->db()->insert($this->table->activity,array('reg_date'=>$reg_date,'target'=>$target,'type'=>$type,'midx'=>$this->IM->getModule('member')->getLogged(),'data'=>json_encode($data,JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES)))->execute();
		}
	}
	
	/**
	 * 파일 업로드 완료처리를 한다.
	 *
	 * @param int $idx 파일고유번호
	 */
	function fileUpload($idx) {
		$mAttachment = $this->IM->getModule('attachment');
		$file = $this->db()->select($this->table->file)->where('idx',$idx)->getOne();
		$filePath = $this->getFilePath($file->path);
		
		$insert = array();
		$insert['mime'] = $mAttachment->getFileMime($filePath);
		$insert['type'] = $mAttachment->getFileType($insert['mime']);
		$hash = md5_file($filePath);
		$insert['path'] = $this->getCurrentPath().'/'.$hash.'.'.base_convert(microtime(true)*10000,10,32).'.'.$mAttachment->getFileExtension($file->name,$filePath);
		$insert['width'] = 0;
		$insert['height'] = 0;
		if ($insert['type'] == 'image') {
			$check = getimagesize($filePath);
			$insert['width'] = $check[0];
			$insert['height'] = $check[1];
		}
		$insert['status'] = 'PUBLISHED';

		rename($filePath,$this->getRootPath().'/'.$insert['path']);
		$this->db()->update($this->table->file,$insert)->where('idx',$idx)->execute();
		
		return $this->getFile($idx);
	}
	
	/**
	 * 파일을 읽는다.
	 *
	 * @param int $idx 파일고유번호
	 * @param string $type 파일을 읽어올 종류 (origin, view, thumbnail, download)
	 * @param string $share 공유코드 (옵션)
	 * @return FileBytes 파일스트림
	 */
	function fileRead($idx,$type,$share=null) {
		$file = $this->getFile($idx);
		if ($file == null || $file->status == 'DRAFT') return $this->IM->printError('NOT_FOUND_FILE');
		
		/**
		 * 공유코드가 없을경우, 현재 로그인한 유저의 파일의 접근권한을 확인한다.
		 */
		if ($this->checkFilePermission($idx,'R',$share) == true) {
			header('Content-Type: '.($file->mime == 'Unknown' ? 'application/x-unknown' : $file->mime));
			header('Content-Length: '.$file->size);
			
			if (ob_get_level()) ob_end_clean();
			
			/**
			 * 파일을 바로 다운로드 받기 위한 헤더 설정
			 */
			if ($type == 'download') {
				header("Pragma: public");
				header("Expires: 0");
				header("Cache-Control: must-revalidate, post-check=0, pre-check=0"); 
				header("Cache-Control: private",false);
				header('Content-Disposition: attachment; filename="'.$file->name.'"; filename*=UTF-8\'\''.rawurlencode($file->name));
				header("Content-Transfer-Encoding: binary");
				header('Content-Type: '.($file->mime == 'Unknown' ? 'application/x-unknown' : $file->mime));
				header('Content-Length: '.$file->size);
			}
			
			//http://portfolio.moimz.link/ko/module/webhard/thumbnail/8/2.jpg
			readfile($this->getFilePath($file->path));
//			exit;
		} else {
			return $this->IM->printError('FORBIDDEN');
		}
	}
	
	/**
	 * 폴더를 생성한다.
	 *
	 * @param string $name 폴더명
	 * @param int $owner 폴더주인 회원고유번호
	 * @param string $code 코드
	 * @param string $permission 퍼미션코드 (기본값 : RWD)
	 * @param boolean $is_lock 잠금폴더여부 (기본값 : false)
	 * @return object $folder 생성된 폴더정보
	 */
	function createFolder($name,$parent,$code=null,$permission='RWD',$is_lock=false) {
		$parent = $this->getFolder($parent);
		if ($parent == null) return false;
		
		$insert = array();
		if ($code != null) $insert['code'] = $code;
		$insert['owner'] = $insert['creator'] = $insert['editor'] = $parent->owner;
		$insert['parent'] = $parent->idx;
		$insert['name'] = $this->getEscapeDuplicatedFolderName($parent->idx,$name);
		$insert['permission'] = $permission;
		$insert['reg_date'] = $insert['update_date'] = time();
		if ($is_lock == true) $insert['is_lock'] = 'TRUE';
		else $insert['is_lock'] = 'FALSE';
		
		$idx = $this->db()->insert($this->table->folder,$insert)->execute();
		return $this->getFolder($idx);
	}
	
	/**
	 * 대상파일을 다른폴더로 복사한다.
	 *
	 * @param object $file 복사할 대상 파일 객체
	 * @param int $target 복사할 위치 파일 고유번호
	 * @return boolean $success 성공여부
	 */
	function copyFile($file,$target,$is_check=true) {
		if ($is_check == true) {
			if ($this->db()->select($this->table->file)->where('folder',$target)->where('name',$file->name)->where('is_delete','FALSE')->has() == true) return false;
		}
		
		$temp = explode('/',$file->path);
		$temp = explode('.',end($temp));
		
		$path = $this->getCurrentPath().'/'.$temp[0].'.'.base_convert(microtime(true)*10000,10,32).'.'.end($temp);
		@copy($this->getFilePath($file->path),$this->getFilePath($path));
		
		$insert = array();
		$insert['folder'] = $target;
		$insert['owner'] = $insert['creator'] = $insert['editor'] = $this->IM->getModule('member')->getLogged();
		$insert['path'] = $path;
		$insert['name'] = $file->name;
		$insert['type'] = $file->type;
		$insert['mime'] = $file->mime;
		$insert['size'] = $file->size;
		$insert['width'] = $file->width;
		$insert['height'] = $file->height;
		$insert['status'] = $file->status;
		$insert['reg_date'] = $insert['update_date'] = time();
		
		$this->db()->insert($this->table->file,$insert)->execute();
		
		return true;
	}
	
	/**
	 * 대상폴더를 다른폴더로 복사한다.
	 *
	 * @param object $origin 복사할 대상 폴더 객체
	 * @param int $target 복사할 위치 폴더 고유번호
	 * @return boolean $success 성공여부
	 */
	function copyFolder($folder,$target,$is_check=true) {
		if ($is_check == true) {
			if ($this->db()->select($this->table->folder)->where('parent',$target)->where('name',$folder->name)->where('is_delete','FALSE')->has() == true) return false;
		}
		
		$insert = array();
		$insert['owner'] = $insert['creator'] = $insert['editor'] = $this->IM->getModule('member')->getLogged();
		$insert['parent'] = $target;
		$insert['name'] = $folder->name;
		$insert['size'] = 0;
		$insert['permission'] = 'RWD';
		$insert['reg_date'] = $insert['update_date'] = time();
		
		$idx = $this->db()->insert($this->table->folder,$insert)->execute();
		
		$children = $this->db()->select($this->table->folder)->where('parent',$folder->linked ? $folder->linked : $folder->idx)->where('is_delete','FALSE');
		if ($this->checkFolderPermission($folder->idx,'R') == false) $children->where('creator',$this->IM->getModule('member')->getLogged());
		$children = $children->get();
		for ($i=0, $loop=count($children);$i<$loop;$i++) {
			$this->copyFolder($children[$i],$idx,false);
		}
		
		$files = $this->db()->select($this->table->file)->where('folder',$folder->linked ? $folder->linked : $folder->idx)->where('is_delete','FALSE');
		if ($this->checkFolderPermission($folder->idx,'R') == false) $files->where('creator',$this->IM->getModule('member')->getLogged());
		$files = $files->get();
		for ($i=0, $loop=count($files);$i<$loop;$i++) {
			$this->copyFile($files[$i],$idx,false);
		}
		
		$this->updateFolder($idx);
		
		return true;
	}
	
	/**
	 * 대상폴더를 다른폴더와 병합한다.
	 *
	 * @param int $origin 복사할 대상 폴더 고유번호
	 * @param int $target 복사할 위치 폴더 고유번호
	 * @return boolean $success 성공여부
	 */
	function mergeFolder($origin,$target,$is_copy=false) {
		$childFolders = $this->db()->select($this->table->folder)->where('parent',$target)->where('is_delete','FALSE')->get();
		for ($i=0, $loop=count($childFolders);$i<$loop;$i++) {
			$duplicated = $this->db()->select($this->table->folder)->where('parent',$origin)->where('name',$childFolders[$i]->name)->where('is_delete','FALSE')->getOne();
			if ($duplicated != null) {
				$this->mergeFolder($duplicated->idx,$childFolders[$i]->idx,$is_copy);
			} else {
				if ($is_copy == true) $this->copyFolder($childFolders[$i],$origin,false);
				else $this->db()->update($this->table->folder,array('parent'=>$origin))->where('idx',$childFolders[$i]->idx)->execute();
			}
		}
		
		$childFiles = $this->db()->select($this->table->file)->where('folder',$target)->where('is_delete','FALSE')->get();
		for ($i=0, $loop=count($childFiles);$i<$loop;$i++) {
			$duplicated = $this->db()->select($this->table->file)->where('folder',$origin)->where('name',$childFiles[$i]->name)->where('is_delete','FALSE')->getOne();
			if ($duplicated != null) $childFiles[$i]->name = $this->getEscapeDuplicatedFileName($origin,$childFiles[$i]->name);
			
			if ($is_copy == true) {
				$this->copyFile($childFiles[$i],$origin,false);
			} else {
				$this->db()->update($this->table->file,array('folder'=>$origin,'name'=>$childFiles[$i]->name))->where('idx',$childFiles[$i]->idx)->execute();
			}
		}
		
		$this->updateFolder($origin);
		if ($is_copy == false) $this->db()->delete($this->table->folder)->where('idx',$target)->execute();
		
		return true;
	}
	
	/**
	 * 폴더용량 및 최종수정시각을 업데이트한다.
	 *
	 * @param int $idx 폴더고유번호
	 */
	function updateFolder($idx) {
		$folder = $this->getFolder($idx);
		if ($folder == null) return;
		
		if ($folder->is_linked == true) {
			$children = $this->db()->select($this->table->folder,'sum(size) as size')->where('parent',$folder->linked)->where('is_delete','FALSE')->getOne();
			$children = isset($children->size) == true ? $children->size : 0;
			
			$files = $this->db()->select($this->table->file,'sum(size) as size')->where('folder',$folder->linked)->where('is_delete','FALSE')->getOne();
			$files = isset($files->size) == true ? $files->size : 0;
			
			$size = $children + $files;
		} else {
			$children = $this->db()->select($this->table->folder,'sum(size) as size')->where('parent',$folder->idx)->where('is_delete','FALSE')->getOne();
			$children = isset($children->size) == true ? $children->size : 0;
			
			$files = $this->db()->select($this->table->file,'sum(size) as size')->where('folder',$folder->idx)->where('is_delete','FALSE')->getOne();
			$files = isset($files->size) == true ? $files->size : 0;
			
			$size = $children + $files;
			
			$linked = $this->db()->select($this->table->folder)->where('linked',$folder->idx)->get();
			for ($i=0, $loop=count($linked);$i<$loop;$i++) {
				$this->db()->update($this->table->folder,array('size'=>$size,'update_date'=>time()))->where('idx',$linked[$i]->idx)->execute();
				$this->updateFolder($linked[$i]->parent);
			}
		}
		
		$this->db()->update($this->table->folder,array('size'=>$size,'update_date'=>time()))->where('idx',$folder->idx)->execute();
		if ($folder->parent == 0) {
			$total = $this->db()->select($this->table->file,'sum(size) as size')->where('owner',$folder->owner)->getOne();
			$total = isset($total->size) == true ? $total->size : 0;
			
			$this->db()->update($this->table->profile,array('disk_usage'=>$total))->where('midx',$folder->owner)->execute();
		} else {
			$this->updateFolder($folder->parent);
		}
	}
	
	/**
	 * 폴더 내부의 모든 파일을 압축한다.
	 *
	 * @param int $folder 폴더 고유번호
	 * @param string $base 압축파일내 기본폴더
	 */
	function compressFolder($folder,$base=null) {
		$folder = $this->db()->select($this->table->folder)->where('idx',$folder)->getOne();
		if ($folder == null) return array();
		
		$path = $base == null ? $folder->name : $base.'/'.$folder->name;
		
		$folders = $this->db()->select($this->table->folder)->where('parent',$folder->linked == 0 ? $folder->idx : $folder->linked);
		$files = $this->db()->select($this->table->file)->where('folder',$folder->linked == 0 ? $folder->idx : $folder->linked);
		if ($this->checkFolderPermission($folder->idx,'R') == false) {
			$folders->where('creator',$this->IM->getModule('member')->getLogged());
			$files->where('creator',$this->IM->getModule('member')->getLogged());
		}
		$folders = $folders->where('is_delete','FALSE')->get();
		$files = $files->where('is_delete','FALSE')->get();
		
		$children = array();
		for ($i=0, $loop=count($folders);$i<$loop;$i++) {
			$children = array_merge($children,$this->compressFolder($folders[$i]->idx,$path));
		}
		
		$children[] = $path.'/0';
		for ($i=0, $loop=count($files);$i<$loop;$i++) {
			if ($files[$i]->status == 'DRAFT') continue;
			$children[] = $path.'/'.$files[$i]->idx;
		}
		
		return $children;
	}
	
	/**
	 * 현재 모듈에서 처리해야하는 요청이 들어왔을 경우 처리하여 결과를 반환한다.
	 * 소스코드 관리를 편하게 하기 위해 각 요쳥별로 별도의 PHP 파일로 관리한다.
	 * 작업코드가 '@' 로 시작할 경우 사이트관리자를 위한 작업으로 최고관리자 권한이 필요하다.
	 *
	 * @param string $action 작업코드
	 * @return object $results 수행결과
	 * @see /process/index.php
	 */
	function doProcess($action) {
		$results = new stdClass();
		
		/**
		 * 모듈의 process 폴더에 $action 에 해당하는 파일이 있을 경우 불러온다.
		 */
		if (is_file($this->getModule()->getPath().'/process/'.$action.'.php') == true) {
			INCLUDE $this->getModule()->getPath().'/process/'.$action.'.php';
		}
		
		$values = (object)get_defined_vars();
		$this->IM->fireEvent('afterDoProcess','member',$action,$values,$results);
		
		return $results;
	}
}
?>