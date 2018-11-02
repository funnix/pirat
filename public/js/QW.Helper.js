"use strict";
/* Namespace */
var QW = QW || {};

/**
 * Hilfsfunktionen für das gesamte Frontend und Templates
 * 
 * 
 */
QW.Helper = {};


/**
 * Sortieren verketteter Listen
 * 
 * Diese Funktion nimmt ein Array mit Elementen, die immer eine
 * "id" sowie ein "prev"-Attribut als Referenz auf die Vorgänger-ID beinhalten
 * müssen, und sortiert diese Elemente dann entsprechend der Eintragungen. 
 * 
 * @param {array} linkedList Array mit Einträgen der verketteten Liste
 * @return {array} Sortierte Liste
 * 
 */
QW.Helper.mapSort = function(linkedList){

	var error = [];

	var sortedList = [];
	var map = new Map();
	var currentId = null;
	
	// index the linked list by attribute "prev"
	for(var i = 0; i < linkedList.length; i++){
		var item = linkedList[i];
		if(item.prev === null || item.prev == 0  || item.prev == ""){
			// first item
			currentId = item.id;
			sortedList.push(item);
		} else {
			map.set(item.prev, i);
		}
	}
		
	var linkedListLength = linkedList.length;
	
	while (sortedList.length < linkedListLength){
		
		// get the item with a previous item ID referencing the current Item
		var nextItem = linkedList[map.get(currentId)];
		if(nextItem == undefined){
			error.push("SortedList: Verweis von record ", currentId, " auf seine PrevId ist nicht zu finden!");
			console.log("SortedList: Verweis von record ", currentId, " auf seine PrevId ist nicht zu finden!")
			linkedListLength--;
		} else  {
			sortedList.push(nextItem);
			currentId = nextItem.id;
		}
	}

	
	if(error.length > 0){
		return linkedList;
	}
	
	return sortedList;
	
};

/**
 * Maskieren von HTML-Strings
 * 
 * Sonderzeichen wie &, <, >, ", ', / 
 * werden maskiert, damit der String auf der Web-Oberfläche 
 * gefahrlos ausgegeben werden kann.
 * 
 * @param {string} string HTML-String
 * @return {string} Maskierter HTML-String
 * 
 */
QW.Helper.escapeHTML = function(string){

	if(string == null || string == "")return "";

	var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
   };
   return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });	
	
}

// var escape = document.createElement('textarea');
// String.prototype.escapeHTML = function() {
//     escape.textContent = this;
//     return escape.innerHTML;
// };
// String.prototype.unescapeHTML = function(){
//     escape.innerHTML = this;
//     return escape.textContent;
// }


/**
 * JSON-Objekt von BART aus dem localStorage laden
 * 
 * @return {object} JSON-Objekt mit Daten 
 */
function fetchLocalStorage(){
	
	var data = {};
	try{
		var storage = localStorage.getItem("BART");
		if(storage !== null)data = JSON.parse(storage);
	} catch(e){
		console.log(e);
	}
	return data;	
}
/**
 * Setzen eines Wertes in den localStorage
 * 
 * @param {string} key Key des zu speichernden Werts
 * @param {string} value Zu speichernder Wert
 */
QW.Helper.setValue = function(key, value){
		
	var data = fetchLocalStorage();	
	data[key] = value;
	localStorage.setItem("BART", JSON.stringify(data));
	
}
/**
 * Holen eines Wertes aus dem localStorage
 * 
 * @param {string} key Key des zu holenden Werts
 * @param {any} defaultValue Default-Wert, wenn der angegebene Key nicht vorhanden ist
 *
 * @return {any} Objekt/Wert aus dem localStorage
 */
QW.Helper.getValue = function(key, defaultValue){
	
	var data = fetchLocalStorage();	
	if(data[key]==undefined){
		return defaultValue;
	}
	return data[key];	
}
/**
 * Löschen eines Wertes aus dem localStorage
 * 
 * @param {string} key Key des zu löschenden Werts
 */
QW.Helper.deleteValue = function(key){
	var data = fetchLocalStorage();	
	delete data[key];
	localStorage.setItem("BART", JSON.stringify(data));
}


///////////////////////////////////////////////////////
/// Globale Helper für can.stache (Template engine) ///
///////////////////////////////////////////////////////

/**
 * Ermitteln, wie viele Nutzer auf einem Arbeitsblatt sind
 * 
 * @param {object} sheetUsage JSON-Objekt aus dem Backend
 * @param {integer} id ID des Arbeitsblatts
 * 
 * @return {integer} Anzahl der Nutzer des Arbeitsblatts
 */
can.stache.registerHelper("getSheetUsage", function(sheetUsage, id){
	var value = (sheetUsage && sheetUsage[id]) ? sheetUsage[id]: 0;
	return value;
})

/**
 * Key/Value aus einem Objekt erhalten
 * 
 * @param {object} object JSON-Objekt
 * @param {string} key 1. Stufe des Objekts
 * @param {string} value 2. Stufe des Objekts
 * 
 * @return {any} Wert
 */ 
can.stache.registerHelper("getDataObject", function(object, key, value){

	if(object && object[key] && object[key][value])return object[key][value];
	return "";
})


/**
 * Überschrift für ein Arbeitsblatt ermitteln (Rechte-Management)
 * 
 * Hierfür wird eine Laufvariable ("currentHeadline") extern instanziiert,
 * um bei einem Überschrift-Wechsel, die Überschrift als HTML-Objekt zurückzugeben.
 * 
 * @param {object} object Ein JSON-Objekt
 * 
 * @return {string} HTML-String mit einer Überschrift, oder leer
 * 
 */
var currentHeadline = "";
can.stache.registerHelper("getSheetHeadline", function(object){

	if(currentHeadline == object.key.substr(object.key.length-1,1))return "";
	currentHeadline = object.key.substr(object.key.length-1,1);
	return '<div style="border-bottom:1px solid steelblue;margin-top:10px;padding:3px; font-size:1.2em;color:gray;">Sheet: '+currentHeadline+'</div>';
})

/**
 * Prüfen, ob der Nutzer ein Recht hat
 * 
 * @param {string} right Das zu prüfende Recht
 * 
 * @return {boolean} True|false 
 */
can.stache.registerHelper('hasRight', function (right) {
	return QW.Helper.hasRight(right);
})

/**
 * Hilfsfunktion: Hat der Benutzer das übergebene Recht
 * 
 * @param {string} right Das zu prüfende Recht
 * 
 * @return {boolean} True|false 
 */
QW.Helper.hasRight = function(right){
	if(QW.Base.appState && QW.Base.appState.attr("rights") && QW.Base.appState.attr("rights").indexOf(right)!==-1)return true;
	else return false;
}

/**
 * Hat der Benutzer ein Recht, das dem übergebenen RegExp entspricht
 * 
 * @param {string} regex Der reguläre Ausdruck für das Matching auf ein Recht
 * 
 * @return {boolean} True|false 
 */
can.stache.registerHelper('hasRightLike', function (regex) {
	return QW.Helper.hasRightLike(regex);
})

/**
 * Hilfsfunktion: Hat der Benutzer ein Recht, das dem übergebenen RegExp entspricht
 * 
 * @param {string} regex Der reguläre Ausdruck für das Matching auf ein Recht
 * 
 * @return {boolean} True|false 
 */
QW.Helper.hasRightLike = function(regex){
	var search = new RegExp(regex);
	for(var x in QW.Base.appState.attr("rights")){
		if(search.test(QW.Base.appState.attr("rights")[x])==true)return true;
	}	
	return false;
}

/**
 * Hat der Benutzer das Schreib-Recht auf das übergebene Arbeitsblatt
 * 
 * @param {integer} sheetId ID des Arbeitsblatts
 * 
 * @return {boolean} True|false 
 */
can.stache.registerHelper('hasSheetWriteRight', function (sheetId) {
	return QW.Helper.hasRight("sheet_write_"+sheetId);
})

/**
 * Hat der Benutzer das Konfigurations-Recht auf das übergebene Arbeitsblatt
 * 
 * @param {integer} sheetId ID des Arbeitsblatts
 * 
 * @return {boolean} True|false 
 */
can.stache.registerHelper('hasSheetConfigRight', function (sheetId) {
	return QW.Helper.hasRight("sheet_config_"+sheetId);
})

/**
 * Ausgeben eines Datums im moment-Calendar-Format (soundso viele Stunden her....)
 * 
 * @param {date} date Datum
 * @return {string} String-Angabe des Datums in Relation zu jetzt
 */
can.stache.registerHelper('getDate', function (date) {
	var date = moment(date,moment.ISO_8601)
	if(!date.isValid())return "";
	return date.calendar();			
})

/**
 * Ausgeben eines Datums im Format: DD.MM.YYYY JJ:mm:ss
 * 
 * @param {date} date Datum
 * @return {string} String-Angabe des Datums
 */
can.stache.registerHelper('getDatetime', function (date) {
	var date = moment(date,moment.ISO_8601)
	if(!date.isValid())return "";
	return date.format("DD.MM.YYYY HH:mm:ss");			
})

// Synonym .... s.o.
can.stache.registerHelper('getCalendar', function (date) {
	var date = moment(date,moment.ISO_8601)
	if(!date.isValid())return "";
	return date.calendar();			
})

/**
 * Ausgeben eines Datums als unix-Timestamp (ms seit 1970)
 * 
 * @param {date} date Datum
 * @return {integer} Unix-Timestamp 
 */
can.stache.registerHelper("getUnix", function(date){

	var date = moment(date);
	if(!date.isValid())return "";
	return date.unix()

})

/**
 * Vergleich zweier Objekte auf einfache Gleichheit
 * 
 * @param {objekt} value Ein Objekt oder Wert
 * @param {objekt} compare Das Vergleichs-Objekt (Vergleichs-Wert)
 * 
 * @return {boolean} True|false 
 */
can.stache.registerHelper('comparison', function (value, compare) {
	if(value == compare)return true;
	else return false;			
})


/**
 * Menschenlesbare Form von Dateigrößen/Bytes
 * 
 * Hiermit wird eine Zahl (Bytes) in GB, MB, KB, Byte umgerechnet und "schön" ausgegeben.
 * 
 * 
 * @param {objekt} value Anzahl von Bytes
 * 
 * @return {string} Anzahl Bytes in menschenlesbarer Form 
 */
can.stache.registerHelper('getHumanBytes', function (value) {
	var val = parseInt(value,10);

	if(val > 1073741824){
		return (Math.round((val/1073741824)*100))/100 + " GB";
	} else if(val > 1048576){		
		return (Math.round((val/1048576)*100))/100 + " MB";
	} else if(val > 1024){
		return (Math.round((val/1024)*100))/100 + " KB";
	} else {
		return val + " Bytes";
	}
})

/**
 * Boolescher Vergleich eines Objekts
 * 
 * @param {objekt} value Ein Objekt oder Wert
 * @param {objekt} compare Das Vergleichs-Objekt (Vergleichs-Wert)
 * 
 * @return {boolean} True|false
 */
can.stache.registerHelper("boolCompare",function(obj, bool){
		
		var a,b;
		
		if(bool == "true" || bool == true || bool == 1 || bool == "1")a = true;
		else a = false;

		if(obj == true || obj == "true" || obj == 1 || obj == "1")b = true;
		else b = false;

		if(a == b)return true;
		else return false;
	
	});

/**
 * Ermittelt die Anzahl an Objekten in einem JSON-Objekt
 * 
 * @param {objekt} obj Ein JSON-Objekt
 * 
 * @return {integer} Anzahl der enthaltenen Objekte 
 */
can.stache.registerHelper("countHelper",function(obj){

	if(obj==undefined || obj == null)return 0;
	if(obj.length !== undefined)return obj.length;
	else return Object.keys(obj).length;
});

/**
 * Gibt den ADMIN-Status des Users zurück
 *  
 * @return {boolean} True (wenn Admin), False (wenn nicht)
 */
can.stache.registerHelper("admin",function(){
	if(QW.Base.user.admin === true)return true;
	else return false;
})

/**
 * Sucht in einem Objekt nach dem gegebenen Namespace und gibt den Wert zurück
 * 
 * 
 * @param {object} object JSON-Objekt 
 * @param {string} ns Pfad zum Wert eines Objektes
 * 
 * @return {string} Der gefundene Wert (oder leer, wenn nicht gefunden)
 */
can.stache.registerHelper("getNS", function(object, ns, defaultValue){
	
	return QW.Helper.getNS(object, ns, defaultValue);
	
});
/**
 * Hilfsfunktion: Sucht in einem Objekt nach dem gegebenen Namespace und gibt den Wert zurück
 * 
 * @param {object} object JSON-Objekt 
 * @param {string} ns Pfad zum Wert eines Objektes
 * 
 * @return {string} Der gefundene Wert (oder leer, wenn nicht gefunden)
 */
QW.Helper.getNS = function(object, ns, defaultValue){
	
	var split = ns.split(".");
	var value = object;
	for(var x in split){
		if(value[split[x]]!==undefined)value = value[split[x]];
		else {
			if(defaultValue)return defaultValue 
			else return false;
		}
	}
	return value;

}


/**
 * Für die Anzeige des Importlogs: Ermitteln der Differenz und Rückgabe eines entsprechenden HTML-Strings
 * 
 * @param {object} diff Differenz-Objekt (aus dem Backend geholt)
 * @param {string} addon Zusatz-String, der angezeigt wird, wenn KEIN Differenz-Objekt reingegeben wurde
 * @param {boolean} raw Wenn true, dann wird der Wert der Differenz (statt ein HTML-String) zurückgegeben
 * 
 * @return {string|integer} Der Differenz-Wert als String oder (wenn raw = true) als Zahl
 * 
 */
can.stache.registerHelper("getDiff",function(diff,addon,raw){

	if(typeof addon !== "string")addon = "";

	if(diff == undefined){
		return '- '+addon;
	}

	if(raw == true){
		if(parseInt(diff) == 100000000)return "";
		else return diff;
	}

	if(parseInt(diff) == 100000000)return '<span style="color:green">... '+addon+'</span>';
	if(diff >= 0){
		return '<span style="color:green">+'+diff+' '+addon+'</span>';
	} else {
		return '<span style="color:red">'+diff+' '+addon+'</span>';
	}
	
});