$(document).ready(function(){ 
	$("#market tr:odd").addClass("odd"); 
	$("#market tr:even").addClass("even");  
	$("#market tr").mouseover(function(){$(this).addClass("alt");}).mouseout(function(){$(this).removeClass("alt")}); 
});