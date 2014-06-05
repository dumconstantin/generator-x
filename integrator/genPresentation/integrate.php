<?php

$json = file_get_contents('../generator-core/test/plugins/generator-x/projects/Logic/generator/integration.json');

$array = json_decode($json,true);

print_r($array);

$dir = 'test/';

function parse($plugin,$pluginName) {
global $dir;


	file_put_contents($dir.$pluginName.'.html',$plugin['html']);

	foreach ($plugin['plugins'] as $nextPluginName=>$nextPlugin) {
		parse($nextPlugin,$nextPluginName);
	}


}

parse($array,'index');